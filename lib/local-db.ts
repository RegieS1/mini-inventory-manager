import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { DatabaseSync } from "node:sqlite";

const tables = ["products", "stock_movements", "accounts", "inventory_settings"] as const;
type TableName = (typeof tables)[number];

const tableColumns: Record<TableName, string[]> = {
  products: [
    "id",
    "name",
    "sku",
    "description",
    "category",
    "supplier",
    "cost_price",
    "selling_price",
    "low_stock_threshold",
    "quantity_on_hand",
    "is_active",
    "created_at",
    "updated_at",
  ],
  stock_movements: [
    "id",
    "product_id",
    "movement_type",
    "quantity",
    "quantity_before",
    "quantity_after",
    "note",
    "reason",
    "created_at",
    "created_by",
  ],
  accounts: ["username", "email", "password_hash", "active", "permissions", "created_at"],
  inventory_settings: [
    "id",
    "shop_name",
    "default_low_stock_threshold",
    "currency_code",
    "updated_at",
    "singleton",
    "logo_base64",
    "logo_content_type",
    "logo_updated_at",
  ],
};

const booleanColumns = new Set(["is_active", "active", "singleton"]);
const numberColumns = new Set(["cost_price", "selling_price", "low_stock_threshold", "quantity_on_hand", "default_low_stock_threshold", "quantity", "quantity_before", "quantity_after"]);

type Db = DatabaseSync;
type Row = Record<string, unknown>;
type DbError = { message: string; code?: string } | null;
type DbResult = { data: unknown; error: DbError; count?: number | null };

let database: Db | null = null;
let ready: Promise<void> | null = null;

function dbFile() {
  return path.join(process.cwd(), "data", "kugi.sqlite");
}

function storeValue(column: string, value: unknown) {
  if (value === undefined) return null;
  if (booleanColumns.has(column)) return value ? 1 : 0;
  if (column === "permissions" && value && typeof value === "object") return JSON.stringify(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

function presentRow(row: Row) {
  const copy: Row = { ...row };
  for (const column of booleanColumns) {
    if (column in copy) copy[column] = copy[column] === 1 || copy[column] === true;
  }
  if (typeof copy.permissions === "string") {
    copy.permissions = JSON.parse(copy.permissions);
  }
  for (const column of numberColumns) {
    if (copy[column] != null && copy[column] !== "") copy[column] = Number(copy[column]);
  }
  return copy;
}

function quoteIdent(name: string) {
  if (!/^[a-z0-9_]+$/.test(name)) {
    throw new Error(`Unknown column ${name}`);
  }
  return name;
}

function openDatabase() {
  mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  const db = new DatabaseSync(dbFile());
  db.exec(`
    pragma foreign_keys = on;
    pragma journal_mode = wal;
    pragma synchronous = full;

    create table if not exists inventory_settings (
      id text primary key,
      shop_name text not null,
      default_low_stock_threshold integer not null default 5,
      currency_code text not null default 'PHP',
      updated_at text not null,
      singleton integer not null default 1 unique,
      logo_base64 text,
      logo_content_type text,
      logo_updated_at text
    );

    create table if not exists accounts (
      username text primary key,
      email text,
      password_hash text not null,
      active integer not null default 1,
      permissions text not null,
      created_at text not null
    );

    create table if not exists products (
      id text primary key,
      name text not null,
      sku text not null unique,
      description text,
      category text,
      supplier text,
      cost_price real not null,
      selling_price real,
      low_stock_threshold integer not null,
      quantity_on_hand integer not null default 0,
      is_active integer not null default 1,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists stock_movements (
      id text primary key,
      product_id text not null references products (id),
      movement_type text not null,
      quantity integer not null,
      quantity_before integer not null,
      quantity_after integer not null,
      note text,
      reason text,
      created_at text not null,
      created_by text
    );
  `);
  return db;
}

function countOf(db: Db, table: TableName) {
  const row = db.prepare(`select count(*) as n from ${table}`).get() as { n: number };
  return Number(row.n);
}

function insertRaw(db: Db, table: TableName, row: Row) {
  const keys = tableColumns[table].filter((column) => column in row);
  const sql = `insert into ${table} (${keys.join(", ")}) values (${keys.map(() => "?").join(", ")})`;
  db.prepare(sql).run(...keys.map((column) => storeValue(column, row[column])));
}

async function fetchAll(
  client: {
    from(table: string): {
      select(columns: string): {
        range(from: number, to: number): PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
      };
    };
  },
  table: string,
) {
  const rows: Row[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await client.from(table).select("*").range(from, from + size - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < size) break;
  }
  return rows;
}

async function importCloudIfEmpty(db: Db) {
  if (countOf(db, "products") > 0 || countOf(db, "stock_movements") > 0) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const [settings, accounts, products, movements] = await Promise.all([
      fetchAll(client, "inventory_settings"),
      fetchAll(client, "accounts"),
      fetchAll(client, "products"),
      fetchAll(client, "stock_movements"),
    ]);

    db.exec("begin immediate");
    try {
      db.exec("delete from stock_movements");
      db.exec("delete from products");
      db.exec("delete from accounts");
      db.exec("delete from inventory_settings");
      for (const row of settings) insertRaw(db, "inventory_settings", row);
      for (const row of accounts) insertRaw(db, "accounts", row);
      for (const row of products) insertRaw(db, "products", row);
      for (const row of movements) insertRaw(db, "stock_movements", row);
      db.exec("commit");
    } catch (error) {
      db.exec("rollback");
      throw error;
    }
  } catch {
    return;
  }
}

function ensureSettings(db: Db) {
  if (countOf(db, "inventory_settings") > 0) return;
  insertRaw(db, "inventory_settings", {
    id: randomUUID(),
    shop_name: "My shop",
    default_low_stock_threshold: 5,
    currency_code: "PHP",
    updated_at: new Date().toISOString(),
    singleton: 1,
  });
}

function backupToday(db: Db) {
  try {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
    const folder = path.join(process.cwd(), "data", "backups");
    mkdirSync(folder, { recursive: true });
    const dest = path.join(folder, `kugi-${day}.sqlite`).replaceAll("\\", "/");
    if (existsSync(dest)) return;
    db.exec(`vacuum into '${dest.replaceAll("'", "''")}'`);
  } catch {
    return;
  }
}

function whenReady() {
  ready ??= (async () => {
    database = openDatabase();
    await importCloudIfEmpty(database);
    ensureSettings(database);
    backupToday(database);
  })();
  return ready;
}

function fail(message: string, code?: string): DbResult {
  return { data: null, error: { message, code }, count: null };
}

function recordMovement(db: Db, args: Record<string, unknown>): DbResult {
  const movementType = String(args.p_movement_type ?? "");
  const quantity = Number(args.p_quantity);
  const direction = args.p_adjustment_direction == null ? null : String(args.p_adjustment_direction);
  const reason = args.p_reason == null || args.p_reason === "" ? null : String(args.p_reason);
  const note = String(args.p_note ?? "").trim() || null;
  const productId = String(args.p_product_id ?? "");
  const createdBy = args.p_created_by == null || args.p_created_by === "" ? null : String(args.p_created_by);

  if (!["IN", "OUT", "ADJUSTMENT"].includes(movementType)) {
    return fail("Movement type must be IN, OUT, or ADJUSTMENT.");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return fail("Quantity must be a positive whole number.");
  }
  if (movementType === "ADJUSTMENT") {
    if (direction !== "increase" && direction !== "decrease") {
      return fail("Adjustments require a direction of increase or decrease, and a note.");
    }
    if (!note) return fail("Adjustments require a note.");
  } else if (direction) {
    return fail("Direction is only used for adjustments.");
  }
  if (movementType === "OUT") {
    if (!reason || !["sold", "damaged", "shop", "correction"].includes(reason)) {
      return fail("Stock out requires a reason: sold, damaged, shop, or correction.");
    }
  } else if (reason) {
    return fail("Reason is only used for stock out.");
  }

  db.exec("begin immediate");
  try {
    const product = db.prepare("select quantity_on_hand, is_active from products where id = ?").get(productId) as
      | { quantity_on_hand: number; is_active: number }
      | undefined;
    if (!product) {
      db.exec("rollback");
      return fail("Product not found.");
    }
    if (!product.is_active) {
      db.exec("rollback");
      return fail("Inactive products cannot receive stock movements.");
    }

    const before = Number(product.quantity_on_hand);
    const after = movementType === "IN" || direction === "increase" ? before + quantity : before - quantity;
    if (after < 0) {
      db.exec("rollback");
      return fail(`Stock cannot become negative. Available quantity is ${before}.`);
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare("update products set quantity_on_hand = ?, updated_at = ? where id = ?").run(after, createdAt, productId);
    db.prepare(
      `insert into stock_movements (
        id, product_id, movement_type, quantity, quantity_before, quantity_after, note, reason, created_at, created_by
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, productId, movementType, quantity, before, after, note, movementType === "OUT" ? reason : null, createdAt, createdBy);
    db.exec("commit");
    return { data: { id, product_id: productId }, error: null };
  } catch (error) {
    db.exec("rollback");
    return fail(error instanceof Error ? error.message : "Could not record the movement.");
  }
}

function removeProduct(db: Db, productId: string): DbResult {
  db.exec("begin immediate");
  try {
    const product = db.prepare("select id from products where id = ?").get(productId);
    if (!product) {
      db.exec("rollback");
      return fail("Product not found.");
    }
    const count = db.prepare("select count(*) as n from stock_movements where product_id = ?").get(productId) as { n: number };
    if (Number(count.n) > 0) {
      db.prepare("update products set is_active = 0, updated_at = ? where id = ?").run(new Date().toISOString(), productId);
      db.exec("commit");
      return { data: "deactivated", error: null };
    }
    db.prepare("delete from products where id = ?").run(productId);
    db.exec("commit");
    return { data: "deleted", error: null };
  } catch (error) {
    db.exec("rollback");
    return fail(error instanceof Error ? error.message : "Could not remove the product.");
  }
}

type Filter =
  | { kind: "eq" | "gt" | "gte"; column: string; value: unknown }
  | { kind: "ilike"; columns: string[]; term: string };

class LocalQuery implements PromiseLike<DbResult> {
  private operation: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private columns = "*";
  private countExact = false;
  private head = false;
  private filters: Filter[] = [];
  private sort: { column: string; ascending: boolean } | null = null;
  private window: { from: number; to: number } | null = null;
  private rowLimit: number | null = null;
  private shape: "many" | "one" | "maybe" = "many";
  private payload: Row | null = null;
  private pending: Promise<DbResult> | null = null;

  constructor(private table: TableName) {}

  select(columns: string, options?: { count?: "exact"; head?: boolean }) {
    this.columns = columns;
    this.countExact = options?.count === "exact";
    this.head = Boolean(options?.head);
    return this;
  }

  insert(row: Row) {
    this.operation = "insert";
    this.payload = row;
    return this;
  }

  update(row: Row) {
    this.operation = "update";
    this.payload = row;
    return this;
  }

  upsert(row: Row) {
    this.operation = "upsert";
    this.payload = row;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ kind: "gt", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }

  or(filters: string) {
    const columns: string[] = [];
    let term = "";
    for (const part of filters.split(",")) {
      const match = part.match(/^(\w+)\.ilike\.%([\s\S]*)%$/);
      if (!match) return this;
      columns.push(match[1]);
      term = match[2];
    }
    this.filters.push({ kind: "ilike", columns, term });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sort = { column, ascending: options?.ascending !== false };
    return this;
  }

  range(from: number, to: number) {
    this.window = { from, to };
    return this;
  }

  limit(count: number) {
    this.rowLimit = count;
    return this;
  }

  maybeSingle() {
    this.shape = "maybe";
    return this;
  }

  single() {
    this.shape = "one";
    return this;
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.pending ??= this.run();
    return this.pending.then(onfulfilled, onrejected);
  }

  private async run(): Promise<DbResult> {
    await whenReady();
    const db = database;
    if (!db) return fail("The shop database is not open.");

    try {
      if (this.operation === "insert") return this.runInsert(db);
      if (this.operation === "update") return this.runUpdate(db);
      if (this.operation === "upsert") return this.runUpsert(db);
      if (this.operation === "delete") return this.runDelete(db);
      return this.runSelect(db);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not use the shop database.";
      if (message.includes("UNIQUE")) return fail("This SKU already exists. Choose a different code.", "23505");
      return fail(message);
    }
  }

  private where() {
    const clauses: string[] = [];
    const params: unknown[] = [];
    for (const filter of this.filters) {
      if (filter.kind === "ilike") {
        clauses.push(`(${filter.columns.map((column) => `lower(t.${quoteIdent(column)}) like lower(?)`).join(" or ")})`);
        for (const _column of filter.columns) params.push(`%${filter.term}%`);
        continue;
      }
      const operator = filter.kind === "gt" ? ">" : filter.kind === "gte" ? ">=" : "=";
      clauses.push(`t.${quoteIdent(filter.column)} ${operator} ?`);
      params.push(storeValue(filter.column, filter.value));
    }
    return { sql: clauses.length ? ` where ${clauses.join(" and ")}` : "", params };
  }

  private runInsert(db: Db): DbResult {
    const payload = { ...(this.payload ?? {}) };
    if (this.table === "products") {
      if (payload.quantity_on_hand != null && Number(payload.quantity_on_hand) !== 0) {
        return fail("New products start at zero. Add stock with record_stock_movement.");
      }
      payload.id ??= randomUUID();
      payload.quantity_on_hand ??= 0;
      payload.is_active ??= 1;
      payload.created_at ??= new Date().toISOString();
      payload.updated_at ??= new Date().toISOString();
    }
    insertRaw(db, this.table, payload);
    if (this.shape === "many") return { data: null, error: null };
    const id = payload.id;
    const row = id ? (db.prepare(`select ${this.projectedColumns()} from ${this.table} t where t.id = ?`).get(id) as Row) : payload;
    return { data: presentRow(row), error: null };
  }

  private runUpdate(db: Db): DbResult {
    const payload = { ...(this.payload ?? {}) };
    if (this.table === "products" && "quantity_on_hand" in payload) {
      return fail("Quantity can only change through record_stock_movement.");
    }
    if (this.table === "products" || this.table === "inventory_settings") {
      payload.updated_at = new Date().toISOString();
    }
    const keys = Object.keys(payload).filter((column) => tableColumns[this.table].includes(column));
    const { sql, params } = this.where();
    db.prepare(`update ${this.table} as t set ${keys.map((column) => `${quoteIdent(column)} = ?`).join(", ")}${sql}`).run(
      ...keys.map((column) => storeValue(column, payload[column])),
      ...params,
    );
    return { data: null, error: null };
  }

  private runUpsert(db: Db): DbResult {
    const payload = { ...(this.payload ?? {}) };
    if (this.table !== "accounts") return fail("Upsert is only used for accounts.");
    payload.created_at ??= new Date().toISOString();
    const keys = tableColumns.accounts.filter((column) => column in payload);
    const updates = keys.filter((column) => column !== "username" && column !== "created_at");
    db.prepare(
      `insert into accounts (${keys.join(", ")}) values (${keys.map(() => "?").join(", ")})
       on conflict(username) do update set ${updates.map((column) => `${column} = excluded.${column}`).join(", ")}`,
    ).run(...keys.map((column) => storeValue(column, payload[column])));
    return { data: null, error: null };
  }

  private runDelete(db: Db): DbResult {
    const { sql, params } = this.where();
    db.prepare(`delete from ${this.table} as t${sql}`).run(...params);
    return { data: null, error: null };
  }

  private projectedColumns() {
    return splitList(this.columns)
      .filter((part) => !part.includes("("))
      .map((part) => `t.${quoteIdent(part)}`)
      .join(", ");
  }

  private runSelect(db: Db): DbResult {
    const { sql, params } = this.where();
    const count = this.countExact
      ? Number((db.prepare(`select count(*) as n from ${this.table} t${sql}`).get(...params) as { n: number }).n)
      : null;
    if (this.head) return { data: null, error: null, count };

    const embed = splitList(this.columns)
      .map((part) => part.match(/^(\w+)\((.+)\)$/))
      .find((match) => match);
    const own = this.projectedColumns();
    const join = embed ? ` left join ${quoteIdent(embed[1])} p on p.id = t.product_id` : "";
    const embedColumns = embed
      ? splitList(embed[2])
          .map((column) => `p.${quoteIdent(column)} as embed_${quoteIdent(column)}`)
          .join(", ")
      : "";
    const selected = [own || "t.*", embedColumns].filter(Boolean).join(", ");
    const order = this.sort ? ` order by t.${quoteIdent(this.sort.column)} ${this.sort.ascending ? "asc" : "desc"}` : "";
    let limit = "";
    const limitParams: number[] = [];
    if (this.window) {
      limit = " limit ? offset ?";
      limitParams.push(this.window.to - this.window.from + 1, this.window.from);
    } else if (this.rowLimit != null) {
      limit = " limit ?";
      limitParams.push(this.rowLimit);
    }

    const rows = db.prepare(`select ${selected} from ${this.table} t${join}${sql}${order}${limit}`).all(...params, ...limitParams) as Row[];
    const data = rows.map((row) => {
      const presented = presentRow(row);
      if (!embed) return presented;
      const nested: Row = {};
      const flat: Row = {};
      for (const [key, value] of Object.entries(presented)) {
        if (key.startsWith("embed_")) nested[key.slice(6)] = value;
        else flat[key] = value;
      }
      flat[embed[1]] = nested;
      return flat;
    });

    if (this.shape === "many") return { data, error: null, count };
    if (data.length > 1) return fail("More than one row was found.");
    if (data.length === 0) {
      return this.shape === "one" ? fail("No row was found.") : { data: null, error: null, count };
    }
    return { data: data[0], error: null, count };
  }
}

function splitList(input: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of input) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function createLocalClient() {
  return {
    from(table: string) {
      if (!tables.includes(table as TableName)) {
        throw new Error(`Unknown table ${table}`);
      }
      return new LocalQuery(table as TableName);
    },
    async rpc(name: string, args: Record<string, unknown>) {
      await whenReady();
      const db = database;
      if (!db) return fail("The shop database is not open.");
      if (name === "record_stock_movement") return recordMovement(db, args);
      if (name === "remove_product") return removeProduct(db, String(args.p_product_id ?? ""));
      return fail(`Unknown function ${name}`);
    },
  };
}

import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";
import type { MovementType } from "@/lib/types";

export type MovementRecord = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
};

type MovementRow = {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  note: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  products: { name: string; sku: string } | { name: string; sku: string }[] | null;
};

function toMovement(row: MovementRow): MovementRecord {
  const related = Array.isArray(row.products) ? row.products[0] : row.products;

  return {
    id: row.id,
    productId: row.product_id,
    productName: related?.name ?? "Unknown product",
    sku: related?.sku ?? "",
    movementType: row.movement_type,
    quantity: row.quantity,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    note: row.note,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

const movementSelect =
  "id,product_id,movement_type,quantity,quantity_before,quantity_after,note,reason,created_by,created_at,products(name,sku)";

export async function productFlowTotals(productId: string) {
  if (!getSupabaseServerConfig()) {
    return { stockIn: 0, stockOut: 0, error: "Supabase is not configured." };
  }

  const { data, error } = await createSupabaseServerClient()
    .from("stock_movements")
    .select("movement_type,quantity")
    .eq("product_id", productId);

  if (error) {
    return { stockIn: 0, stockOut: 0, error: error.message };
  }

  let stockIn = 0;
  let stockOut = 0;

  for (const row of data ?? []) {
    const quantity = Number(row.quantity);

    if (row.movement_type === "IN") {
      stockIn += quantity;
    }

    if (row.movement_type === "OUT") {
      stockOut += quantity;
    }
  }

  return { stockIn, stockOut, error: null };
}

export async function listMovements(limit = 50, since?: Date | null, offset = 0) {
  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", movements: [] as MovementRecord[], total: 0 };
  }

  let query = createSupabaseServerClient()
    .from("stock_movements")
    .select(movementSelect, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (since) {
    query = query.gte("created_at", since.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message, movements: [] as MovementRecord[], total: 0 };
  }

  const movements = ((data ?? []) as MovementRow[]).map(toMovement);
  return { error: null, movements, total: count ?? movements.length };
}

export async function getMovement(id: string) {
  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", movement: null };
  }

  const { data, error } = await createSupabaseServerClient()
    .from("stock_movements")
    .select(movementSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { error: error.message, movement: null };
  }

  if (!data) {
    return { error: null, movement: null };
  }

  return { error: null, movement: toMovement(data as MovementRow) };
}

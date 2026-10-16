import { connection } from "next/server";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";

export const ageBuckets = [
  { id: "30", label: "0–30 days" },
  { id: "60", label: "31–60 days" },
  { id: "90", label: "61–90 days" },
  { id: "old", label: "Over 90 days" },
] as const;

export type AgeBucket = (typeof ageBuckets)[number]["id"];

export type AgedStock = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  days: number;
  cost: number;
  bucket: AgeBucket;
};

type Lot = { quantity: number; at: string };

function manilaDay(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function ageInDays(receivedAt: string, now: Date) {
  const start = new Date(`${manilaDay(new Date(receivedAt))}T00:00:00+08:00`).getTime();
  const end = new Date(`${manilaDay(now)}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function bucketFor(days: number): AgeBucket {
  if (days <= 30) return "30";
  if (days <= 60) return "60";
  if (days <= 90) return "90";
  return "old";
}

function remainingLots(
  movements: { quantity: number; quantity_before: number; quantity_after: number; created_at: string }[],
) {
  const lots: Lot[] = [];

  for (const movement of movements) {
    if (movement.quantity_after > movement.quantity_before) {
      lots.push({ quantity: movement.quantity, at: movement.created_at });
      continue;
    }

    let left = movement.quantity;
    while (left > 0 && lots.length > 0) {
      const take = Math.min(lots[0].quantity, left);
      lots[0].quantity -= take;
      left -= take;
      if (lots[0].quantity === 0) lots.shift();
    }
  }

  return lots.filter((lot) => lot.quantity > 0);
}

export async function loadAging() {
  await connection();

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", rows: [] as AgedStock[] };
  }

  const supabase = createSupabaseServerClient();
  const [{ data: products, error: productError }, { data: movements, error: movementError }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,sku,cost_price,quantity_on_hand,created_at")
      .eq("is_active", true)
      .gt("quantity_on_hand", 0)
      .order("name"),
    supabase
      .from("stock_movements")
      .select("product_id,quantity,quantity_before,quantity_after,created_at")
      .order("created_at"),
  ]);

  if (productError || movementError) {
    return { error: productError?.message ?? movementError?.message ?? "Could not load aging.", rows: [] as AgedStock[] };
  }

  const now = new Date();
  const byProduct = new Map<string, typeof movements>();
  for (const movement of movements ?? []) {
    const list = byProduct.get(movement.product_id) ?? [];
    list.push(movement);
    byProduct.set(movement.product_id, list);
  }

  const rows: AgedStock[] = [];

  for (const product of products ?? []) {
    const lots = remainingLots(byProduct.get(product.id) ?? []);
    const covered = lots.reduce((total, lot) => total + lot.quantity, 0);
    if (covered < product.quantity_on_hand) {
      lots.unshift({ quantity: product.quantity_on_hand - covered, at: product.created_at });
    }

    const grouped = new Map<AgeBucket, { quantity: number; days: number }>();
    for (const lot of lots) {
      const days = ageInDays(lot.at, now);
      const bucket = bucketFor(days);
      const current = grouped.get(bucket) ?? { quantity: 0, days: 0 };
      current.quantity += lot.quantity;
      current.days = Math.max(current.days, days);
      grouped.set(bucket, current);
    }

    for (const [bucket, group] of grouped) {
      rows.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: group.quantity,
        days: group.days,
        cost: group.quantity * Number(product.cost_price),
        bucket,
      });
    }
  }

  rows.sort((left, right) => right.days - left.days || left.name.localeCompare(right.name));
  return { error: null, rows };
}

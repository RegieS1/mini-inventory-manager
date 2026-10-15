import { connection } from "next/server";
import { cache } from "react";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { listProducts } from "@/lib/products";
import { listMovements } from "@/lib/movements";
import { periodStart } from "@/lib/shop";

export const getInventory = cache(async () => {
  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", summary: null, attention: [] as Product[] };
  }

  const { products, error } = await listProducts("", "all");

  if (error) {
    return { error, summary: null, attention: [] as Product[] };
  }

  const active = products.filter((product) => product.is_active);
  const attention = active
    .filter((product) => product.quantity_on_hand <= product.low_stock_threshold)
    .sort((a, b) => a.quantity_on_hand - b.quantity_on_hand);

  return {
    error: null,
    summary: {
      activeCount: active.length,
      units: active.reduce((total, product) => total + product.quantity_on_hand, 0),
      value: active.reduce((total, product) => total + product.quantity_on_hand * product.cost_price, 0),
      lowCount: attention.filter((product) => product.quantity_on_hand > 0).length,
      outCount: attention.filter((product) => product.quantity_on_hand === 0).length,
    },
    attention,
  };
});

export async function getRecentMovements() {
  const { error, movements } = await listMovements(4);
  return { error, movements };
}

export async function getDailyClose() {
  await connection();

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", close: null };
  }

  const since = periodStart("today", new Date()) ?? new Date(0);
  const { data, error } = await createSupabaseServerClient()
    .from("stock_movements")
    .select("movement_type,quantity,quantity_before,quantity_after,products(cost_price)")
    .gte("created_at", since.toISOString());

  if (error) {
    return { error: error.message, close: null };
  }

  let unitsIn = 0;
  let unitsOut = 0;
  let costLeft = 0;

  for (const row of data ?? []) {
    const quantity = Number(row.quantity);
    const related = Array.isArray(row.products) ? row.products[0] : row.products;
    const cost = Number(related?.cost_price ?? 0);
    const increased = row.quantity_after > row.quantity_before;

    if (row.movement_type === "IN" || (row.movement_type === "ADJUSTMENT" && increased)) {
      unitsIn += quantity;
    }

    if (row.movement_type === "OUT" || (row.movement_type === "ADJUSTMENT" && !increased)) {
      unitsOut += quantity;
      costLeft += quantity * cost;
    }
  }

  return { error: null, close: { unitsIn, unitsOut, costLeft } };
}

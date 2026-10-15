import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";
import { stockStatus } from "@/lib/stock-status";
import type { Product } from "@/lib/types";

export type StockFilter = "all" | "in" | "low" | "out";

export { stockStatus };

function matchesStock(product: Product, stock: StockFilter) {
  if (stock === "all") {
    return true;
  }

  const status = stockStatus(product);

  if (stock === "out") {
    return status.label === "Out of stock";
  }

  if (stock === "low") {
    return status.label === "Low";
  }

  return status.label === "In stock";
}

function asProduct(row: {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  supplier: string | null;
  cost_price: number | string;
  selling_price: number | string | null;
  low_stock_threshold: number;
  quantity_on_hand: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): Product {
  return {
    ...row,
    cost_price: Number(row.cost_price),
    selling_price: row.selling_price === null ? null : Number(row.selling_price),
  };
}

export async function listProducts(search: string, stock: StockFilter) {
  if (!getSupabaseServerConfig()) {
    return { products: [] as Product[], error: "Supabase is not configured." };
  }

  const term = search.trim().replace(/[%_,.()]/g, "");
  let query = createSupabaseServerClient()
    .from("products")
    .select(
      "id,name,sku,description,category,supplier,cost_price,selling_price,low_stock_threshold,quantity_on_hand,is_active,created_at,updated_at",
    )
    .eq("is_active", true)
    .order("name");

  if (term) {
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { products: [] as Product[], error: error.message };
  }

  const products = (data ?? []).map(asProduct).filter((product) => matchesStock(product, stock));

  return { products, error: null };
}

export async function getDefaultLowStockThreshold() {
  if (!getSupabaseServerConfig()) {
    return 5;
  }

  const { data } = await createSupabaseServerClient()
    .from("inventory_settings")
    .select("default_low_stock_threshold")
    .limit(1)
    .maybeSingle();

  return data?.default_low_stock_threshold ?? 5;
}

export async function getProduct(id: string) {
  if (!getSupabaseServerConfig()) {
    return { product: null, error: "Supabase is not configured." };
  }

  const { data, error } = await createSupabaseServerClient()
    .from("products")
    .select(
      "id,name,sku,description,category,supplier,cost_price,selling_price,low_stock_threshold,quantity_on_hand,is_active,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { product: null, error: error.message };
  }

  if (!data) {
    return { product: null, error: null };
  }

  return { product: asProduct(data), error: null };
}

export async function productHasMovements(id: string) {
  if (!getSupabaseServerConfig()) {
    return { hasMovements: false, error: "Supabase is not configured." };
  }

  const { count, error } = await createSupabaseServerClient()
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (error) {
    return { hasMovements: false, error: error.message };
  }

  return { hasMovements: (count ?? 0) > 0, error: null };
}

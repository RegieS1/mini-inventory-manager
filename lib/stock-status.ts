import type { Product } from "@/lib/types";

export function stockStatus(product: Pick<Product, "quantity_on_hand" | "low_stock_threshold" | "is_active">) {
  if (!product.is_active) {
    return { label: "Inactive", tone: "muted" as const };
  }

  if (product.quantity_on_hand === 0) {
    return { label: "Out of stock", tone: "out" as const };
  }

  if (product.quantity_on_hand <= product.low_stock_threshold) {
    return { label: "Low", tone: "low" as const };
  }

  return { label: "In stock", tone: "in" as const };
}

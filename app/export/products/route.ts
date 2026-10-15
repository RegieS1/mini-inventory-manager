import { allows } from "@/lib/accounts";
import { listProducts } from "@/lib/products";
import { csvRow, margin, reorderQuantity } from "@/lib/shop";

export async function GET() {
  if (!(await allows("products", "read"))) {
    return new Response("Not allowed", { status: 403 });
  }

  const { products, error } = await listProducts("", "all");

  if (error) {
    return new Response(error, { status: 500 });
  }

  const lines = [
    csvRow(["Name", "SKU", "Category", "Supplier", "On hand", "Threshold", "Reorder", "Cost", "Selling", "Margin"]),
    ...products.map((product) =>
      csvRow([
        product.name,
        product.sku,
        product.category,
        product.supplier,
        product.quantity_on_hand,
        product.low_stock_threshold,
        reorderQuantity(product.quantity_on_hand, product.low_stock_threshold),
        product.cost_price,
        product.selling_price,
        margin(product.cost_price, product.selling_price),
      ]),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products.csv"',
    },
  });
}

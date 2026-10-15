import { allows } from "@/lib/accounts";
import { PageHeader } from "@/components/page-header";
import { StockCountForm } from "@/components/stock-count-form";
import { listProducts } from "@/lib/products";

export default async function StockCountPage() {
  if (!(await allows("movements", "write"))) {
    return <p className="text-sm text-muted">Your account cannot record a stock count.</p>;
  }

  const { products, error } = await listProducts("", "all");

  if (error) {
    return <p className="text-sm text-stock-out">{error}</p>;
  }

  const rows = products
    .filter((product) => product.is_active)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantityOnHand: product.quantity_on_hand,
    }));

  return (
    <>
      <PageHeader
        title="Stock count"
        description="Type what you counted. Differences are saved as adjustments. Matching counts are left alone."
      />
      <StockCountForm products={rows} />
    </>
  );
}

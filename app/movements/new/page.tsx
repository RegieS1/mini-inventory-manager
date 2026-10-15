import { allows } from "@/lib/accounts";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/lazy-fallback";
import { PageHeader } from "@/components/page-header";
import { RecordMovementForm } from "@/components/record-movement-form";
import { listProducts } from "@/lib/products";

async function RecordMovementLoader({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[]; type?: string | string[] }>;
}) {
  const params = await searchParams;
  const productParam = Array.isArray(params.product) ? params.product[0] : params.product;
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const { products, error } = await listProducts("", "all");

  if (error) {
    return (
      <p role="alert" className="mt-6 text-sm text-stock-out">
        Could not load products. {error}
      </p>
    );
  }

  const active = products
    .filter((product) => product.is_active)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantityOnHand: product.quantity_on_hand,
    }));

  return (
    <RecordMovementForm
      key={`${productParam ?? "none"}-${typeParam ?? "IN"}`}
      products={active}
      initialProductId={productParam ?? ""}
      initialType={typeParam ?? "IN"}
    />
  );
}

export default async function NewMovementPage({ searchParams }: PageProps<"/movements/new">) {
  if (!(await allows("movements", "write"))) {
    return <p className="text-sm text-muted">Your account cannot record stock movements.</p>;
  }

  return (
    <>
      <PageHeader
        title="Record movement"
        description="Add stock with Stock In. Remove stock with Stock Out. One save updates the quantity and the history together."
      />
      <Suspense fallback={<FormSkeleton />}>
        <RecordMovementLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

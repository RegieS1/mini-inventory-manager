import { allows } from "@/lib/accounts";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/lazy-fallback";
import { PageHeader } from "@/components/page-header";
import { NewProductForm } from "@/components/new-product-form";
import { getDefaultLowStockThreshold } from "@/lib/products";

async function NewProductFormLoader() {
  const defaultThreshold = await getDefaultLowStockThreshold();
  return <NewProductForm defaultThreshold={defaultThreshold} />;
}

export default async function NewProductPage() {
  if (!(await allows("products", "write"))) {
    return <p className="text-sm text-muted">Your account cannot add products.</p>;
  }

  return (
    <>
      <PageHeader
        title="New product"
        description="Required fields are marked. Prices and the threshold cannot be negative."
      />
      <Suspense fallback={<FormSkeleton />}>
        <NewProductFormLoader />
      </Suspense>
    </>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { allows } from "@/lib/accounts";
import { TableSkeleton } from "@/components/lazy-fallback";
import { PageHeader } from "@/components/page-header";
import { ProductList } from "@/components/product-list";

export const instant = false;

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  if (!(await allows("products", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open products.</p>;
  }

  const canWrite = await allows("products", "write");

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Products"
          description="Loaded from the database. Quantity changes only through stock movements."
        />
        <div className="flex flex-wrap gap-2">
          <a href="/export/products" className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
            Export products
          </a>
          {canWrite ? (
            <Link href="/products/new" className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper">
              New product
            </Link>
          ) : null}
        </div>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

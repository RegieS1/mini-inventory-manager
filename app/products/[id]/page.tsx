import { Suspense } from "react";
import { DetailSkeleton } from "@/components/lazy-fallback";
import { ProductDetail } from "@/components/product-detail";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { DetailSkeleton } from "@/components/lazy-fallback";
import { MovementDetail } from "@/components/movement-detail";

export default function MovementPage({ params }: PageProps<"/movements/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <MovementDetail params={params} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { allows } from "@/lib/accounts";
import { AgingReport } from "@/components/aging-report";
import { TableSkeleton } from "@/components/lazy-fallback";
import { PageHeader } from "@/components/page-header";

export const instant = false;

export default async function AgingPage({ searchParams }: PageProps<"/aging">) {
  if (!(await allows("products", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open aging.</p>;
  }

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      <PageHeader
        title="Aging"
        description="How long stock still on hand has been in the shop. Older stock is what came in first and has not gone out yet."
      />
      <Suspense fallback={<TableSkeleton />}>
        <AgingReport searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

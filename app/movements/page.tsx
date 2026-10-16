import { allows } from "@/lib/accounts";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MovementList } from "@/components/movement-list";
import { TableSkeleton } from "@/components/lazy-fallback";

export const instant = false;

export default async function MovementsPage({ searchParams }: PageProps<"/movements">) {
  if (!(await allows("movements", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open stock movements.</p>;
  }

  const canWrite = await allows("movements", "write");

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Stock movements"
          description="History is kept. A wrong entry is corrected with a new adjustment, not an edit."
        />
        <div className="flex flex-wrap gap-2">
          <a href="/export/movements" className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
            Export month
          </a>
          {canWrite ? (
            <Link href="/movements/count" className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
              Stock count
            </Link>
          ) : null}
          {canWrite ? (
            <Link href="/movements/new" className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper">
              Record movement
            </Link>
          ) : null}
        </div>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <MovementList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

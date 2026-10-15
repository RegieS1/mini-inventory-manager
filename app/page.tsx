import { Suspense } from "react";
import { DailyClose, DashboardMetrics, LowStockPanel, RecentMovements } from "@/components/dashboard-summary";
import { CardSkeleton, MetricsSkeleton } from "@/components/lazy-fallback";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="lg:flex lg:h-[calc(100dvh-3.5rem)] lg:flex-col lg:overflow-hidden">
      <PageHeader
        compact
        title="Dashboard"
        description="Overview of current inventory. These numbers are calculated from the database."
      />
      <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-3">
        <Suspense fallback={<MetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>
        <Suspense fallback={null}>
          <DailyClose />
        </Suspense>
        <p className="mt-5 shrink-0 rounded-lg bg-copper-soft px-4 py-3 text-sm leading-6 lg:mt-0 lg:py-2 lg:text-xs lg:leading-5">
          <span className="font-semibold text-stock-low">How value is calculated. </span>
          Sum of each active product’s quantity on hand multiplied by its cost price. Selling price is not included.
        </p>
        <div className="mt-5 grid gap-4 lg:mt-0 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-3">
          <Suspense fallback={<CardSkeleton label="Loading low stock..." />}>
            <LowStockPanel />
          </Suspense>
          <Suspense fallback={<CardSkeleton label="Loading recent movements..." />}>
            <RecentMovements />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

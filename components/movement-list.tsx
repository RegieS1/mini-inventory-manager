import Link from "next/link";
import { connection } from "next/server";
import { MovementBrowser } from "@/components/movement-browser";
import { listMovements } from "@/lib/movements";
import { periodStart, type Period } from "@/lib/shop";

const periods: { id: Period; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export async function MovementList({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const requested = typeof params.period === "string" ? params.period : "all";
  const period: Period = requested === "today" || requested === "week" || requested === "month" ? requested : "all";
  const since = periodStart(period, new Date());
  const { error, movements } = await listMovements(since ? 500 : 100, since);

  if (error) {
    return (
      <p role="alert" className="mt-6 rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
        Could not load movements. {error}
      </p>
    );
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {periods.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/movements" : `/movements?period=${item.id}`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              period === item.id ? "bg-copper text-on-copper" : "border border-line bg-surface"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {movements.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No stock movements in this period.</p>
      ) : (
        <MovementBrowser movements={movements} />
      )}
    </div>
  );
}

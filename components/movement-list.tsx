import Link from "next/link";
import { connection } from "next/server";
import { MovementBrowser } from "@/components/movement-browser";
import { PageFooter, pageWindow } from "@/components/show-footer";
import { listMovements } from "@/lib/movements";
import { periodStart, type Period } from "@/lib/shop";

const periods: { id: Period; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

function listHref(period: Period, page = 1) {
  const query = new URLSearchParams();
  if (period !== "all") query.set("period", period);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/movements?${text}` : "/movements";
}

export async function MovementList({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[]; page?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const requested = typeof params.period === "string" ? params.period : "all";
  const requestedPage = typeof params.page === "string" ? params.page : undefined;
  const period: Period = requested === "today" || requested === "week" || requested === "month" ? requested : "all";
  const view = pageWindow(requestedPage);
  const since = periodStart(period, new Date());
  const { error, movements, total } = await listMovements(view.limit, since, view.offset);

  return (
    <div className="mt-4 flex flex-col lg:min-h-0 lg:flex-1">
      <div className="flex shrink-0 justify-end">
        <div className="inline-flex max-w-full flex-wrap overflow-hidden rounded-lg border border-line">
          {periods.map((item) => (
            <Link
              key={item.id}
              href={listHref(item.id)}
              className={`px-3 py-2 text-sm font-semibold ${
                period === item.id ? "bg-copper text-on-copper" : "bg-surface"
              } ${item.id === periods[periods.length - 1].id ? "" : "border-r border-line"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="min-h-0 lg:flex-1 lg:overflow-auto">
        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
            Could not load movements. {error}
          </p>
        ) : movements.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No stock movements in this period.</p>
        ) : (
          <MovementBrowser movements={movements} start={view.offset + 1} />
        )}
      </div>
      <div className="mt-3 shrink-0">
        <PageFooter page={view.page} total={total} hrefForPage={(page) => listHref(period, page)} />
      </div>
    </div>
  );
}

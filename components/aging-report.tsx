import { ageBuckets, loadAging, type AgeBucket } from "@/lib/aging";
import { AgingBuckets } from "@/components/aging-buckets";
import { PageFooter, pageWindow } from "@/components/show-footer";
import { formatPeso } from "@/lib/money";

function isBucket(value: string | undefined): value is AgeBucket {
  return ageBuckets.some((bucket) => bucket.id === value);
}

export async function AgingReport({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string; page?: string }>;
}) {
  const params = await searchParams;
  const selected = isBucket(params.bucket) ? params.bucket : "all";
  const view = pageWindow(params.page);
  const { error, rows } = await loadAging();

  if (error) {
    return (
      <p role="alert" className="mt-6 rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
        Could not load aging. {error}
      </p>
    );
  }

  const totals = ageBuckets.map((bucket) => {
    const matching = rows.filter((row) => row.bucket === bucket.id);
    return {
      ...bucket,
      quantity: matching.reduce((total, row) => total + row.quantity, 0),
      cost: matching.reduce((total, row) => total + row.cost, 0),
    };
  });
  const filtered = selected === "all" ? rows : rows.filter((row) => row.bucket === selected);
  const shown = filtered.slice(view.offset, view.offset + view.limit);

  function href(page = 1) {
    const query = new URLSearchParams();
    if (selected !== "all") query.set("bucket", selected);
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return text ? `/aging?${text}` : "/aging";
  }

  return (
    <div className="mt-6 flex flex-col gap-4 lg:mt-4 lg:min-h-0 lg:flex-1 lg:gap-3">
      <AgingBuckets selected={selected} totals={totals} />
      <div className="min-h-0 lg:flex-1">
        {shown.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">No stock in this age.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-copper-soft text-xs text-muted">
                <tr>
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">On hand</th>
                  <th className="px-3 py-2 font-medium">Days</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row, index) => (
                  <tr key={`${row.productId}-${row.bucket}`} className="border-t border-line">
                    <td className="px-3 py-1.5 font-medium text-muted">{view.offset + index + 1}</td>
                    <td className="truncate px-3 py-1.5">
                      <span className="font-semibold">{row.name}</span>
                      <span className="ml-2 text-xs text-muted">{row.sku || "—"}</span>
                    </td>
                    <td className="px-3 py-1.5 font-semibold">{row.quantity}</td>
                    <td className="px-3 py-1.5">{row.days}</td>
                    <td className="truncate px-3 py-1.5 text-muted">
                      {ageBuckets.find((bucket) => bucket.id === row.bucket)?.label}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">{formatPeso(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-3 shrink-0">
        <PageFooter page={view.page} total={filtered.length} hrefForPage={href} />
      </div>
    </div>
  );
}

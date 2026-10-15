import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { allows } from "@/lib/accounts";
import { getDailyClose, getInventory, getRecentMovements } from "@/lib/dashboard";
import { formatPeso } from "@/lib/money";
import { reorderQuantity } from "@/lib/shop";

const movementLabels = {
  IN: "Stock In",
  OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

export async function DashboardMetrics() {
  if (!(await allows("products", "read"))) {
    return <p className="mt-6 text-sm text-muted">Your account cannot view inventory totals.</p>;
  }

  const { error, summary } = await getInventory();

  if (error || !summary) {
    return (
      <p role="alert" className="mt-6 rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
        Could not load the dashboard. {error}
      </p>
    );
  }

  return (
    <section className="mt-4 grid shrink-0 grid-cols-2 gap-2 md:mt-6 md:gap-3 lg:mt-3 lg:grid-cols-4 lg:gap-3">
      <article className="rounded-xl border border-line bg-surface p-3 md:p-4 lg:p-3">
        <p className="text-xs text-muted md:text-sm">Active products</p>
        <p className="mt-1 text-lg font-semibold md:text-3xl lg:text-2xl lg:leading-tight">{summary.activeCount}</p>
      </article>
      <article className="rounded-xl border border-line bg-surface p-3 md:p-4 lg:p-3">
        <p className="text-xs text-muted md:text-sm">Units in stock</p>
        <p className="mt-1 text-lg font-semibold md:text-3xl lg:text-2xl lg:leading-tight">{summary.units.toLocaleString("en-PH")}</p>
      </article>
      <article className="min-w-0 rounded-xl border border-line bg-surface p-3 md:p-4 lg:p-3">
        <p className="text-xs text-muted md:text-sm">Inventory value</p>
        <p className="mt-1 truncate text-lg font-semibold md:text-3xl lg:text-2xl lg:leading-tight">{formatPeso(summary.value)}</p>
        <p className="mt-1 text-[11px] text-muted md:text-xs">Quantity × cost price</p>
      </article>
      <article className="rounded-xl border border-line bg-surface p-3 md:p-4 lg:p-3">
        <p className="text-xs text-muted md:text-sm">Low or out</p>
        <p className="mt-1 text-lg font-semibold text-stock-low md:text-3xl lg:text-2xl lg:leading-tight">{summary.lowCount + summary.outCount}</p>
        <p className="mt-1 text-[11px] text-muted md:text-xs">
          {summary.lowCount} low · {summary.outCount} out of stock
        </p>
      </article>
    </section>
  );
}

export async function DailyClose() {
  if (!(await allows("movements", "read"))) {
    return null;
  }

  const { error, close } = await getDailyClose();

  if (error || !close) {
    return (
      <p role="alert" className="mt-4 rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
        Could not load today’s close. {error}
      </p>
    );
  }

  return (
    <section className="mt-4 shrink-0 lg:mt-0">
      <h2 className="text-sm font-semibold">Today</h2>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <article className="rounded-xl border border-line bg-surface p-3 lg:py-2">
          <p className="text-xs text-muted">Units in</p>
          <p className="mt-1 text-lg font-semibold text-stock-in lg:text-base lg:leading-tight">{close.unitsIn}</p>
        </article>
        <article className="rounded-xl border border-line bg-surface p-3 lg:py-2">
          <p className="text-xs text-muted">Units out</p>
          <p className="mt-1 text-lg font-semibold text-stock-out lg:text-base lg:leading-tight">{close.unitsOut}</p>
        </article>
        <article className="rounded-xl border border-line bg-surface p-3 lg:py-2">
          <p className="text-xs text-muted">Cost of what left</p>
          <p className="mt-1 truncate text-lg font-semibold lg:text-base lg:leading-tight">{formatPeso(close.costLeft)}</p>
        </article>
      </div>
    </section>
  );
}

export async function LowStockPanel() {
  if (!(await allows("products", "read"))) {
    return null;
  }

  const { error, attention } = await getInventory();

  if (error) {
    return null;
  }

  const shown = attention.slice(0, 4);

  return (
    <section className="rounded-xl border border-line bg-surface p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-semibold">Low stock</h2>
        <Link href="/products" className="text-sm font-semibold text-copper">
          View products
        </Link>
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No products are low or out of stock.</p>
      ) : (
        <ul className="mt-2">
          {shown.map((product) => (
            <li
              key={product.id}
              className="relative flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0 hover:bg-copper-soft focus-within:bg-copper-soft lg:py-1"
            >
              <div className="min-w-0">
                <Link href={`/products/${product.id}`} className="block truncate font-semibold after:absolute after:inset-0">
                  {product.name}
                </Link>
                <p className="truncate text-xs text-muted">
                  {product.sku}
                  {reorderQuantity(product.quantity_on_hand, product.low_stock_threshold) > 0
                    ? ` · bring in ${reorderQuantity(product.quantity_on_hand, product.low_stock_threshold)}`
                    : ""}
                  {product.supplier ? ` · ${product.supplier}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted">{product.quantity_on_hand} on hand</span>
                <StatusBadge product={product} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {attention.length > shown.length ? (
        <p className="mt-2 text-xs text-muted">
          Showing {shown.length} of {attention.length}
        </p>
      ) : null}
    </section>
  );
}

export async function RecentMovements() {
  if (!(await allows("movements", "read"))) {
    return <p className="text-sm text-muted">Your account cannot view stock movements.</p>;
  }

  const { error, movements } = await getRecentMovements();

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
        Could not load recent movements. {error}
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-semibold">Recent movements</h2>
        <Link href="/movements" className="text-sm font-semibold text-copper">
          View history
        </Link>
      </div>
      {movements.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No stock movements yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto lg:mt-1 lg:min-h-0 lg:overflow-hidden">
          <table className="w-full text-left text-sm lg:table-fixed">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">Movement</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => {
                const increased = movement.quantityAfter > movement.quantityBefore;
                const signed = `${increased ? "+" : "−"}${movement.quantity}`;

                return (
                  <tr key={movement.id} className="border-t border-line">
                    <td className="py-3 pr-3 lg:py-1">
                      <p className="truncate font-semibold">{movement.productName}</p>
                      <p className="text-xs text-muted">{movementLabels[movement.movementType]}</p>
                    </td>
                    <td className={`py-3 pr-3 font-semibold lg:py-1 ${increased ? "text-stock-in" : "text-stock-out"}`}>{signed}</td>
                    <td className="py-3 lg:py-1">
                      <Link href={`/movements/${movement.id}`} className="text-xs font-semibold text-copper">
                        {formatWhen(movement.createdAt)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

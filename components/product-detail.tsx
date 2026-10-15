import { allows } from "@/lib/accounts";
import Link from "next/link";
import { HistoryBack } from "@/components/back-button";
import { RemoveProductForm } from "@/components/remove-product-form";
import { StatusBadge } from "@/components/status-badge";
import { formatPeso } from "@/lib/money";
import { productFlowTotals } from "@/lib/movements";
import { getProduct, productHasMovements } from "@/lib/products";

export async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await allows("products", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open products.</p>;
  }

  const { id } = await params;
  const { product, error } = await getProduct(id);

  if (error) {
    return (
      <p role="alert" className="mt-6 text-sm text-stock-out">
        Could not load this product. {error}
      </p>
    );
  }

  if (!product) {
    return <p className="mt-6 text-sm text-muted">This product was not found.</p>;
  }

  const history = await productHasMovements(product.id);
  const flow = await productFlowTotals(product.id);
  const canMove = await allows("movements", "write");
  const canDelete = await allows("products", "delete");

  return (
    <>
    <HistoryBack fallback="/products" className="mb-4" />
    <article className="mt-4 max-w-xl rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold tracking-tight md:text-[28px]">{product.name}</h1>
        <StatusBadge product={product} />
      </div>
      <p className="mt-1 text-sm text-muted">{product.sku}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted">Category</dt>
          <dd className="font-medium">{product.category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">On hand</dt>
          <dd className="font-medium">{product.quantity_on_hand}</dd>
        </div>
        <div>
          <dt className="text-muted">Stock in</dt>
          <dd className="font-medium">{flow.error ? "—" : flow.stockIn}</dd>
        </div>
        <div>
          <dt className="text-muted">Stock out</dt>
          <dd className="font-medium">{flow.error ? "—" : flow.stockOut}</dd>
        </div>
        <div>
          <dt className="text-muted">Cost price</dt>
          <dd className="font-medium">{formatPeso(product.cost_price)}</dd>
        </div>
        <div>
          <dt className="text-muted">Selling price</dt>
          <dd className="font-medium">{formatPeso(product.selling_price)}</dd>
        </div>
        <div>
          <dt className="text-muted">Low-stock threshold</dt>
          <dd className="font-medium">{product.low_stock_threshold}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-muted">
        Quantity on hand is what is still here. Stock in and stock out are the units that arrived and left. Adjustments are not included.
      </p>
      {product.is_active && canMove ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/movements/new?type=IN&product=${product.id}`}
            className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper"
          >
            Stock In
          </Link>
          <Link
            href={`/movements/new?type=OUT&product=${product.id}`}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold"
          >
            Stock Out
          </Link>
        </div>
      ) : product.is_active ? null : (
        <p className="mt-4 text-sm leading-6 text-muted">This product is inactive, so it cannot receive new stock movements.</p>
      )}
      {product.description ? <p className="mt-3 text-sm leading-6">{product.description}</p> : null}
      {flow.error ? (
        <p role="alert" className="mt-4 text-sm text-stock-out">
          Could not total stock in and stock out. {flow.error}
        </p>
      ) : null}
      {history.error ? (
        <p role="alert" className="mt-4 text-sm text-stock-out">
          Could not check stock history. {history.error}
        </p>
      ) : product.is_active && canDelete ? (
        <RemoveProductForm productId={product.id} productName={product.name} hasHistory={history.hasMovements} />
      ) : null}
    </article>
    </>
  );
}

import { ProductBrowser } from "@/components/product-browser";
import { ProductFilters } from "@/components/product-filters";
import { PageFooter, pageWindow } from "@/components/show-footer";
import { allows } from "@/lib/accounts";
import { listProducts, type StockFilter } from "@/lib/products";

export async function ProductList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const stock: StockFilter =
    params.stock === "in" || params.stock === "low" || params.stock === "out" ? params.stock : "all";
  const view = pageWindow(params.page);
  const [{ products, error, total }, canMove] = await Promise.all([
    listProducts(q, stock, view.limit, view.offset),
    allows("movements", "write"),
  ]);

  function href(page = 1) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (stock !== "all") query.set("stock", stock);
    if (page > 1) query.set("page", String(page));
    const text = query.toString();
    return text ? `/products?${text}` : "/products";
  }

  return (
    <div className="mt-6 flex flex-col gap-4 lg:mt-4 lg:min-h-0 lg:flex-1 lg:gap-3">
      <ProductFilters key={`${q}-${stock}`} q={q} stock={stock} />
      <div className="min-h-0 lg:flex-1">
        {error ? (
          <p role="alert" className="rounded-xl border border-stock-out-bg bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
            Could not load products. {error}
          </p>
        ) : products.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
            No products match this search.
          </p>
        ) : (
          <ProductBrowser products={products} canMove={canMove} start={view.offset + 1} />
        )}
      </div>
      <div className="mt-3 shrink-0">
        <PageFooter page={view.page} total={total} hrefForPage={href} />
      </div>
    </div>
  );
}

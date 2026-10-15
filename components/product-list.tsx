import { ProductBrowser } from "@/components/product-browser";
import { allows } from "@/lib/accounts";
import { listProducts, type StockFilter } from "@/lib/products";

const stockFilters: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All stock levels" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out of stock" },
];

export async function ProductList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const stock: StockFilter =
    params.stock === "in" || params.stock === "low" || params.stock === "out" ? params.stock : "all";
  const [{ products, error }, canMove] = await Promise.all([listProducts(q, stock), allows("movements", "write")]);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <form action="/products" className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or SKU"
          aria-label="Search by product name or SKU"
          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm sm:w-72"
        />
        <select
          name="stock"
          defaultValue={stock}
          aria-label="Filter by stock level"
          className="h-11 rounded-lg border border-line bg-surface px-3 text-sm"
        >
          {stockFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-lg bg-copper px-4 text-sm font-semibold text-on-copper"
        >
          Apply
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl border border-stock-out-bg bg-stock-out-bg px-4 py-3 text-sm text-stock-out">
          Could not load products. {error}
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
          No products match this search.
        </p>
      ) : (
        <ProductBrowser products={products} canMove={canMove} />
      )}
    </div>
  );
}

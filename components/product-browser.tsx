"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { StatusBadge } from "@/components/status-badge";
import { formatPeso } from "@/lib/money";
import { margin, reorderQuantity } from "@/lib/shop";
import type { Product } from "@/lib/types";

export function ProductBrowser({ products, canMove }: { products: Product[]; canMove: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Product | null>(null);

  const gap = selected ? margin(selected.cost_price, selected.selling_price) : null;
  const bring = selected ? reorderQuantity(selected.quantity_on_hand, selected.low_stock_threshold) : 0;

  function openMovement(type: "IN" | "OUT") {
    if (!selected) return;
    const href = `/movements/new?type=${type}&product=${selected.id}`;
    flushSync(() => setSelected(null));
    router.push(href);
  }

  useEffect(() => {
    if (!selected) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="relative rounded-xl border border-line bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelected(product)}
                  className="text-left font-semibold after:absolute after:inset-0"
                >
                  {product.name}
                </button>
                <p className="text-xs text-muted">{product.sku}</p>
              </div>
              <StatusBadge product={product} />
            </div>
            <p className="mt-2 text-sm">
              <span className="font-semibold">{product.quantity_on_hand}</span>
              <span className="text-muted"> on hand</span>
              {product.category ? <span className="text-muted"> · {product.category}</span> : null}
            </p>
            <p className="mt-1 text-xs text-muted">
              Cost {formatPeso(product.cost_price)} · Sell {formatPeso(product.selling_price)}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-copper-soft text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Selling</th>
              <th className="px-4 py-3 font-medium">On hand</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="relative border-t border-line hover:bg-copper-soft">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelected(product)}
                    className="text-left font-semibold after:absolute after:inset-0"
                  >
                    {product.name}
                  </button>
                  <div className="text-xs text-muted">{product.sku}</div>
                </td>
                <td className="px-4 py-3">{product.category ?? "—"}</td>
                <td className="px-4 py-3">{formatPeso(product.cost_price)}</td>
                <td className="px-4 py-3 text-muted">{formatPeso(product.selling_price)}</td>
                <td className="px-4 py-3 font-semibold">{product.quantity_on_hand}</td>
                <td className="px-4 py-3">
                  <StatusBadge product={product} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            className="relative max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              autoFocus
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-lg leading-none text-muted hover:bg-copper-soft"
            >
              ×
            </button>
            <div className="flex items-center gap-2 pr-10">
              <h2 id="product-detail-title" className="text-base font-semibold tracking-tight md:text-2xl">
                {selected.name}
              </h2>
              <StatusBadge product={selected} />
            </div>
            <p className="mt-1 text-sm text-muted">{selected.sku}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted">Category</dt>
                <dd className="font-medium">{selected.category ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">On hand</dt>
                <dd className="font-medium">{selected.quantity_on_hand}</dd>
              </div>
              <div>
                <dt className="text-muted">Cost price</dt>
                <dd className="font-medium">{formatPeso(selected.cost_price)}</dd>
              </div>
              <div>
                <dt className="text-muted">Selling price</dt>
                <dd className="font-medium">{formatPeso(selected.selling_price)}</dd>
              </div>
              <div>
                <dt className="text-muted">Low-stock threshold</dt>
                <dd className="font-medium">{selected.low_stock_threshold}</dd>
              </div>
              <div>
                <dt className="text-muted">Supplier</dt>
                <dd className="font-medium">{selected.supplier ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Margin</dt>
                <dd className={`font-medium ${gap !== null && gap < 0 ? "text-stock-out" : ""}`}>
                  {gap === null ? "—" : formatPeso(gap)}
                  {gap !== null && gap < 0 ? " · below cost" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Reorder</dt>
                <dd className="font-medium">{bring === 0 ? "None" : `Bring in ${bring}`}</dd>
              </div>
            </dl>
            {selected.description ? <p className="mt-4 text-sm leading-6">{selected.description}</p> : null}
            {selected.is_active && canMove ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openMovement("IN")}
                  className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper"
                >
                  Stock In
                </button>
                <button
                  type="button"
                  onClick={() => openMovement("OUT")}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold"
                >
                  Stock Out
                </button>
              </div>
            ) : selected.is_active ? null : (
              <p className="mt-4 text-sm leading-6 text-muted">This product is inactive, so it cannot receive new stock movements.</p>
            )}
          </article>
        </div>
      ) : null}
    </>
  );
}

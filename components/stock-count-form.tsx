"use client";

import { useActionState } from "react";
import { recordStockCount } from "@/app/movements/actions";

type CountProduct = {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
};

export function StockCountForm({ products }: { products: CountProduct[] }) {
  const [state, action, pending] = useActionState(recordStockCount, { error: null });

  return (
    <form action={action} className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
      {state.error ? (
        <p role="alert" className="m-4 rounded-lg bg-stock-out-bg px-3 py-3 text-sm text-stock-out">
          {state.error}
        </p>
      ) : null}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-copper-soft text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">System</th>
            <th className="px-4 py-3 font-medium">Counted</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-line">
              <td className="px-4 py-3">
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-muted">{product.sku}</p>
              </td>
              <td className="px-4 py-3">{product.quantityOnHand}</td>
              <td className="px-4 py-3">
                <input
                  name={`count-${product.id}`}
                  defaultValue={product.quantityOnHand}
                  inputMode="numeric"
                  aria-label={`Counted ${product.name}`}
                  className="h-11 w-28 rounded-lg border border-line bg-surface px-3"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end p-4">
        <button
          type="submit"
          disabled={pending || products.length === 0}
          className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save count"}
        </button>
      </div>
    </form>
  );
}

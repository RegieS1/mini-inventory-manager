"use client";

import { useActionState, useState } from "react";
import { removeProduct, type RemoveProductState } from "@/app/products/actions";

export function RemoveProductForm({
  productId,
  productName,
  hasHistory,
}: {
  productId: string;
  productName: string;
  hasHistory: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(removeProduct, { error: null } satisfies RemoveProductState);
  const label = hasHistory ? "Deactivate product" : "Delete product";

  return (
    <div className="mt-5 border-t border-line pt-4">
      {open ? (
        <form action={action} className="rounded-lg bg-stock-out-bg p-3">
          <input type="hidden" name="productId" value={productId} />
          <p className="text-sm leading-6 text-stock-out">
            {hasHistory
              ? `${productName} has stock history, so it will be marked inactive. The movement records stay.`
              : `${productName} has no stock history. Deleting it removes the product permanently.`}
          </p>
          {state.error ? (
            <p role="alert" className="mt-2 text-sm text-stock-out">
              {state.error}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-stock-out px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
            >
              {pending ? "Saving..." : hasHistory ? "Confirm deactivate" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-stock-out px-4 py-2.5 text-sm font-semibold text-stock-out"
        >
          {label}
        </button>
      )}
    </div>
  );
}

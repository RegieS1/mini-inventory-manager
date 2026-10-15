"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { recordMovement, type MovementFormState } from "@/app/movements/actions";
import { stockOutReasons } from "@/lib/shop";
import type { MovementField } from "@/lib/movement-input";

export type MovementProductOption = {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
};

const emptyValues = {
  productId: "",
  movementType: "IN",
  quantity: "",
  note: "",
  direction: "decrease",
  reason: "sold",
};

export function RecordMovementForm({
  products,
  initialProductId,
  initialType,
}: {
  products: MovementProductOption[];
  initialProductId: string;
  initialType: string;
}) {
  const params = useSearchParams();
  const requestedProductId = params.get("product") || initialProductId;
  const requestedType = params.get("type") || initialType;
  const movementType =
    requestedType === "OUT" || requestedType === "ADJUSTMENT" ? requestedType : "IN";
  const [state, action, pending] = useActionState(recordMovement, {
    error: null,
    field: null,
    values: {
      ...emptyValues,
      productId: requestedProductId,
      movementType,
    },
  } satisfies MovementFormState);
  const fields = useRef<Partial<Record<MovementField, HTMLElement>>>({});

  useEffect(() => {
    if (pending || !state.field) {
      return;
    }

    const field = fields.current[state.field];
    field?.focus();
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [pending, state.field, state.error]);
  const [productId, setProductId] = useState(requestedProductId);
  const [movementChoice, setMovementChoice] = useState(movementType);
  const [seenProductId, setSeenProductId] = useState(requestedProductId);

  if (requestedProductId !== seenProductId) {
    setSeenProductId(requestedProductId);
    setProductId(requestedProductId);
  }

  const selected = products.find((product) => product.id === productId);
  const invalid = (field: MovementField) => state.field === field;
  const controlClass = (field: MovementField) =>
    `h-11 rounded-lg border bg-surface px-3 ${invalid(field) ? "border-stock-out" : "border-line"}`;

  return (
    <form action={action} className="mt-6 rounded-xl border border-line bg-surface p-5">
      <p className="rounded-lg bg-copper-soft px-3 py-3 text-sm leading-6">
        Stock In adds units. Stock Out removes units and cannot go below zero. Use Stock In to give a new product its first quantity.
      </p>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-stock-out-bg px-3 py-3 text-sm text-stock-out">
          {state.error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Movement type</span>
          <select
            key={movementType}
            ref={(node) => {
              fields.current.movementType = node ?? undefined;
            }}
            name="movementType"
            value={movementChoice}
            onChange={(event) => setMovementChoice(event.target.value)}
            aria-invalid={invalid("movementType")}
            className={controlClass("movementType")}
          >
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </label>
        {movementChoice === "OUT" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Reason</span>
            <select
              name="reason"
              defaultValue={state.values.reason || "sold"}
              aria-invalid={invalid("reason")}
              className={controlClass("reason")}
            >
              {stockOutReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted">Required for stock out.</span>
          </label>
        ) : null}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Quantity</span>
          <input
            ref={(node) => {
              fields.current.quantity = node ?? undefined;
            }}
            name="quantity"
            inputMode="numeric"
            defaultValue={state.values.quantity}
            required
            aria-invalid={invalid("quantity")}
            className={controlClass("quantity")}
          />
          <span className="text-xs text-muted">Whole number greater than zero.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Adjustment direction</span>
          <select
            ref={(node) => {
              fields.current.direction = node ?? undefined;
            }}
            name="direction"
            defaultValue={state.values.direction}
            aria-invalid={invalid("direction")}
            className={controlClass("direction")}
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <span className="text-xs text-muted">Used only for an adjustment.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm lg:col-span-3">
          <span className="font-medium">Product</span>
          <select
            ref={(node) => {
              fields.current.productId = node ?? undefined;
            }}
            name="productId"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            required
            aria-invalid={invalid("productId")}
            className={controlClass("productId")}
          >
            <option value="">Choose a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.sku} · {product.quantityOnHand} on hand
              </option>
            ))}
          </select>
          {selected ? (
            <span className="text-xs text-muted">{selected.quantityOnHand} currently on hand.</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1.5 text-sm lg:col-span-3">
          <span className="font-medium">Note</span>
          <input
            ref={(node) => {
              fields.current.note = node ?? undefined;
            }}
            name="note"
            defaultValue={state.values.note}
            aria-invalid={invalid("note")}
            className={controlClass("note")}
          />
          <span className="text-xs text-muted">Optional for Stock In and Stock Out. Required for an adjustment.</span>
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <BackButton fallback="/movements" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">
          Cancel
        </BackButton>
        <button
          type="submit"
          disabled={pending || products.length === 0}
          className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
        >
          {pending ? "Saving..." : "Record movement"}
        </button>
      </div>
    </form>
  );
}

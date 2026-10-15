"use client";

import { useActionState } from "react";
import { BackButton } from "@/components/back-button";
import { createProduct, type ProductFormState } from "@/app/products/actions";

const initialState: ProductFormState = {
  error: null,
  values: {
    name: "",
    sku: "",
    description: "",
    category: "",
    supplier: "",
    costPrice: "",
    sellingPrice: "",
    threshold: "",
  },
};

function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-11 rounded-lg border border-line bg-surface px-3"
      />
      {hint ? <span className="text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function NewProductForm({ defaultThreshold }: { defaultThreshold: number }) {
  const [state, action, pending] = useActionState(createProduct, {
    ...initialState,
    values: { ...initialState.values, threshold: String(defaultThreshold) },
  });

  return (
    <form action={action} className="mt-6 rounded-xl border border-line bg-surface p-5">
      <p className="rounded-lg bg-copper-soft px-3 py-3 text-sm leading-6">
        Quantity starts at 0. After you save, the next screen is Stock In, where you assign the first units.
      </p>

      {state.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-stock-out-bg px-3 py-3 text-sm text-stock-out">
          {state.error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Field label="Product name" name="name" defaultValue={state.values.name} required />
        <Field
          label="SKU"
          name="sku"
          defaultValue={state.values.sku}
          hint="Must be unique in this inventory."
          required
        />
        <Field label="Category" name="category" defaultValue={state.values.category} />
        <Field label="Supplier" name="supplier" defaultValue={state.values.supplier} hint="Who you reorder this from. Optional." />
        <label className="flex flex-col gap-1.5 text-sm lg:col-span-3">
          <span className="font-medium">Description</span>
          <input
            name="description"
            defaultValue={state.values.description}
            className="h-11 rounded-lg border border-line bg-surface px-3"
          />
        </label>
        <Field label="Cost price (₱)" name="costPrice" defaultValue={state.values.costPrice} hint="Zero or greater." required />
        <Field
          label="Selling price (₱)"
          name="sellingPrice"
          defaultValue={state.values.sellingPrice}
          hint="Optional. Used for margin, not inventory value."
        />
        <Field
          label="Low-stock threshold"
          name="threshold"
          defaultValue={state.values.threshold}
          hint="Default from settings. Later default changes do not overwrite this product."
          required
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <BackButton fallback="/products" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">
          Cancel
        </BackButton>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save product"}
        </button>
      </div>
    </form>
  );
}

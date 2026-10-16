"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";

type StockFilter = "all" | "in" | "low" | "out";

const stockFilters: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All stock levels" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out of stock" },
];

export function ProductFilters({ q, stock }: { q: string; stock: StockFilter }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextQ = String(data.get("q") ?? "").trim();
    const nextStock = String(data.get("stock") ?? "all");
    const query = new URLSearchParams();
    if (nextQ) query.set("q", nextQ);
    if (nextStock !== "all") query.set("stock", nextStock);
    const text = query.toString();

    startTransition(() => {
      router.replace(text ? `/products?${text}` : "/products", { scroll: false });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex shrink-0 flex-col gap-3 sm:flex-row sm:justify-end">
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
        disabled={pending}
        className="h-11 rounded-lg bg-copper px-4 text-sm font-semibold text-on-copper disabled:opacity-60"
      >
        {pending ? "Applying..." : "Apply"}
      </button>
    </form>
  );
}

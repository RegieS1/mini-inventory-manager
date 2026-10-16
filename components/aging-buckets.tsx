"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatPeso } from "@/lib/money";

type BucketCard = {
  id: string;
  label: string;
  quantity: number;
  cost: number;
};

export function AgingBuckets({ selected, totals }: { selected: string; totals: BucketCard[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function open(id: string) {
    startTransition(() => {
      router.replace(selected === id ? "/aging" : `/aging?bucket=${id}`, { scroll: false });
    });
  }

  return (
    <div className={`grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
      {totals.map((bucket) => (
        <button
          key={bucket.id}
          type="button"
          onClick={() => open(bucket.id)}
          className={`rounded-xl border p-3 text-left ${
            selected === bucket.id ? "border-copper bg-copper-soft" : "border-line bg-surface"
          }`}
        >
          <p className="text-xs text-muted">{bucket.label}</p>
          <p className="mt-1 text-lg font-semibold">{bucket.quantity.toLocaleString("en-PH")}</p>
          <p className="mt-1 text-[11px] text-muted">{formatPeso(bucket.cost)}</p>
        </button>
      ))}
    </div>
  );
}

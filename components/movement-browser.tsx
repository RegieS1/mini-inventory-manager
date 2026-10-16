"use client";

import { useEffect, useState } from "react";
import { reasonLabel } from "@/lib/shop";
import type { MovementType } from "@/lib/types";

type MovementRow = {
  id: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
};

const movementLabels: Record<MovementType, string> = {
  IN: "Stock In",
  OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
};

const typeClass: Record<MovementType, string> = {
  IN: "text-stock-in",
  OUT: "text-stock-out",
  ADJUSTMENT: "text-stock-low",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function MovementBrowser({ movements, start = 1 }: { movements: MovementRow[]; start?: number }) {
  const [selected, setSelected] = useState<MovementRow | null>(null);

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
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-copper-soft text-xs text-muted">
            <tr>
              <th className="w-12 bg-copper-soft px-3 py-2 font-medium">#</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Date</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Time</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Product</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Type</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Movement</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">By</th>
              <th className="bg-copper-soft px-3 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement, index) => {
              const increased = movement.quantityAfter > movement.quantityBefore;
              const signed = `${increased ? "+" : "−"}${movement.quantity}`;

              return (
                <tr key={movement.id} className="relative border-t border-line hover:bg-copper-soft">
                  <td className="px-3 py-1.5 font-medium text-muted">{start + index}</td>
                  <td className="whitespace-nowrap px-3 py-1.5">{formatWhen(movement.createdAt)}</td>
                  <td className={`whitespace-nowrap px-3 py-1.5 font-semibold ${increased ? "text-stock-in" : "text-stock-out"}`}>
                    {formatTime(movement.createdAt)}
                  </td>
                  <td className="truncate px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => setSelected(movement)}
                      className="inline-block max-w-full truncate text-left font-semibold after:absolute after:inset-0"
                    >
                      {movement.productName}
                    </button>
                  </td>
                  <td className={`px-3 py-1.5 font-semibold ${typeClass[movement.movementType]}`}>
                    <span className="block truncate">{movementLabels[movement.movementType]}</span>
                    {reasonLabel(movement.reason) ? (
                      <span className="block truncate text-xs font-medium text-muted">{reasonLabel(movement.reason)}</span>
                    ) : null}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-1.5 font-semibold ${increased ? "text-stock-in" : "text-stock-out"}`}>
                    {signed}
                  </td>
                  <td className="truncate px-3 py-1.5 text-muted">{movement.createdBy ?? "—"}</td>
                  <td className="truncate px-3 py-1.5 text-muted" title={movement.note ?? undefined}>
                    {movement.note ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected ? <MovementCard movement={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function MovementCard({ movement, onClose }: { movement: MovementRow; onClose: () => void }) {
  const increased = movement.quantityAfter > movement.quantityBefore;
  const signed = `${increased ? "+" : "−"}${movement.quantity}`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-detail-title"
        className="relative max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          autoFocus
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-lg leading-none text-muted hover:bg-copper-soft"
        >
          ×
        </button>
        <h2
          id="movement-detail-title"
          className={`pr-10 text-base font-semibold tracking-tight md:text-2xl ${typeClass[movement.movementType]}`}
        >
          {movementLabels[movement.movementType]}
        </h2>
        <p className="mt-1 text-sm font-semibold">{movement.productName}</p>
        <p className="text-xs text-muted">{movement.sku || "—"}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Date</dt>
            <dd className="font-medium">{formatWhen(movement.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Time</dt>
            <dd className={`font-medium ${increased ? "text-stock-in" : "text-stock-out"}`}>
              {formatTime(movement.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Movement</dt>
            <dd className={`font-medium ${increased ? "text-stock-in" : "text-stock-out"}`}>{signed}</dd>
          </div>
          <div>
            <dt className="text-muted">By</dt>
            <dd className="font-medium">{movement.createdBy ?? "—"}</dd>
          </div>
          {reasonLabel(movement.reason) ? (
            <div>
              <dt className="text-muted">Reason</dt>
              <dd className="font-medium">{reasonLabel(movement.reason)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 text-sm leading-6">{movement.note ?? "No note."}</p>
      </article>
    </div>
  );
}

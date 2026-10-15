import { stockStatus } from "@/lib/stock-status";

const tones = {
  out: "bg-stock-out-bg text-stock-out",
  low: "bg-stock-low-bg text-stock-low",
  in: "bg-stock-in-bg text-stock-in",
  muted: "bg-line text-muted",
};

export function StatusBadge({
  product,
}: {
  product: Parameters<typeof stockStatus>[0];
}) {
  const status = stockStatus(product);

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tones[status.tone]}`}>
      {status.label}
    </span>
  );
}

export function formatPeso(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

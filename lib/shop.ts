export const stockOutReasons = [
  { value: "sold", label: "Sold" },
  { value: "damaged", label: "Damaged" },
  { value: "shop", label: "Used in the shop" },
  { value: "correction", label: "Correction" },
] as const;

export type StockOutReason = (typeof stockOutReasons)[number]["value"];
export type Period = "all" | "today" | "week" | "month";

export function reasonLabel(value: string | null) {
  return stockOutReasons.find((reason) => reason.value === value)?.label ?? null;
}

export function isStockOutReason(value: string): value is StockOutReason {
  return stockOutReasons.some((reason) => reason.value === value);
}

export function reorderQuantity(onHand: number, threshold: number) {
  return Math.max(0, threshold - onHand);
}

export function margin(cost: number, selling: number | null) {
  if (selling === null) return null;
  return selling - cost;
}

function manilaDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function manilaMidnight(day: string) {
  return new Date(`${day}T00:00:00+08:00`);
}

export function periodStart(period: Period, now: Date) {
  if (period === "all") return null;

  const day = manilaDate(now);
  const today = manilaMidnight(day);

  if (period === "today") return today;

  if (period === "month") return manilaMidnight(`${day.slice(0, 8)}01`);

  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "short" }).format(now);
  const index = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekday] ?? 0;
  const sinceMonday = index === 0 ? 6 : index - 1;
  return new Date(today.getTime() - sinceMonday * 24 * 60 * 60 * 1000);
}

export function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function csvRow(values: Array<string | number | null | undefined>) {
  return values.map(csvCell).join(",");
}

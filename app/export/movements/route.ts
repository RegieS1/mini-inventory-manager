import { connection } from "next/server";
import { allows } from "@/lib/accounts";
import { listMovements } from "@/lib/movements";
import { csvRow, periodStart, reasonLabel } from "@/lib/shop";

export async function GET() {
  await connection();

  if (!(await allows("movements", "read"))) {
    return new Response("Not allowed", { status: 403 });
  }

  const { movements, error } = await listMovements(500, periodStart("month", new Date()));

  if (error) {
    return new Response(error, { status: 500 });
  }

  const lines = [
    csvRow(["Date", "Product", "SKU", "Type", "Quantity", "Reason", "By", "Note"]),
    ...movements.map((movement) =>
      csvRow([
        movement.createdAt,
        movement.productName,
        movement.sku,
        movement.movementType,
        movement.quantityAfter > movement.quantityBefore ? movement.quantity : -movement.quantity,
        reasonLabel(movement.reason),
        movement.createdBy,
        movement.note,
      ]),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="movements-this-month.csv"',
    },
  });
}

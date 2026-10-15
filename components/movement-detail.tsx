import Link from "next/link";
import { HistoryBack } from "@/components/back-button";
import { allows } from "@/lib/accounts";
import { getMovement } from "@/lib/movements";

const movementLabels = {
  IN: "Stock In",
  OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export async function MovementDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await allows("movements", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open stock movements.</p>;
  }

  const { id } = await params;
  const { movement, error } = await getMovement(id);

  if (error) {
    return (
      <p role="alert" className="mt-6 text-sm text-stock-out">
        Could not load this movement. {error}
      </p>
    );
  }

  if (!movement) {
    return <p className="mt-6 text-sm text-muted">This movement was not found.</p>;
  }

  const increased = movement.quantityAfter > movement.quantityBefore;
  const signed = `${increased ? "+" : "−"}${movement.quantity}`;

  return (
    <>
    <HistoryBack fallback="/movements" className="mb-4" />
    <article className="mt-4 max-w-xl rounded-xl border border-line bg-surface p-5">
      <h1 className="text-base font-semibold tracking-tight md:text-[28px]">{movementLabels[movement.movementType]}</h1>
      <p className="mt-1 text-sm text-muted">{formatWhen(movement.createdAt)}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted">Product</dt>
          <dd className="font-medium">
            <Link href={`/products/${movement.productId}`} className="text-copper">
              {movement.productName}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-muted">SKU</dt>
          <dd className="font-medium">{movement.sku || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Quantity</dt>
          <dd className={`font-medium ${increased ? "text-stock-in" : "text-stock-out"}`}>{signed}</dd>
        </div>
        <div>
          <dt className="text-muted">By</dt>
          <dd className="font-medium">{movement.createdBy ?? "—"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6">{movement.note ?? "No note."}</p>
      <p className="mt-3 text-sm leading-6 text-muted">Posted movements are kept. This record cannot be edited.</p>
    </article>
    </>
  );
}

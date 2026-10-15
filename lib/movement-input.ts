import { isStockOutReason } from "@/lib/shop";

export type MovementTypeInput = "IN" | "OUT" | "ADJUSTMENT";
export type AdjustmentDirectionInput = "increase" | "decrease";

export type MovementInput = {
  productId: string;
  movementType: string;
  quantity: string;
  note: string;
  direction: string;
  reason: string;
};

export type MovementField = "productId" | "movementType" | "quantity" | "direction" | "note" | "reason";

export type ParsedMovement =
  | {
      ok: true;
      value: {
        productId: string;
        movementType: MovementTypeInput;
        quantity: number;
        note: string | null;
        direction: AdjustmentDirectionInput | null;
        reason: "sold" | "damaged" | "shop" | "correction" | null;
      };
    }
  | { ok: false; error: string; field: MovementField };

export function parseMovementInput(input: MovementInput): ParsedMovement {
  const productId = input.productId.trim();
  const movementType = input.movementType.trim();
  const note = input.note.trim();
  const quantity = Number(input.quantity.trim());

  if (!productId) {
    return { ok: false, error: "Choose a product.", field: "productId" };
  }

  if (movementType !== "IN" && movementType !== "OUT" && movementType !== "ADJUSTMENT") {
    return { ok: false, error: "Choose Stock In, Stock Out, or Adjustment.", field: "movementType" };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: "Quantity must be a whole number greater than zero.", field: "quantity" };
  }

  if (movementType === "ADJUSTMENT") {
    if (input.direction !== "increase" && input.direction !== "decrease") {
      return { ok: false, error: "An adjustment needs a direction: increase or decrease.", field: "direction" };
    }

    if (!note) {
      return { ok: false, error: "An adjustment requires a note.", field: "note" };
    }

    return {
      ok: true,
      value: {
        productId,
        movementType,
        quantity,
        note,
        direction: input.direction,
        reason: null,
      },
    };
  }

  if (movementType === "OUT" && !isStockOutReason(input.reason)) {
    return { ok: false, error: "Choose why this stock left: sold, damaged, used in the shop, or correction.", field: "reason" };
  }

  return {
    ok: true,
    value: {
      productId,
      movementType,
      quantity,
      note: note || null,
      direction: null,
      reason: movementType === "OUT" && isStockOutReason(input.reason) ? input.reason : null,
    },
  };
}

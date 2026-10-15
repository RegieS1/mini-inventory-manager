"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allows, currentAccount } from "@/lib/accounts";
import { parseMovementInput, type MovementField, type MovementInput } from "@/lib/movement-input";
import { listProducts } from "@/lib/products";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";

export type MovementFormState = {
  error: string | null;
  field: MovementField | null;
  values: MovementInput;
};

export async function recordMovement(
  state: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  const values: MovementInput = {
    productId: String(formData.get("productId") ?? ""),
    movementType: String(formData.get("movementType") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    note: String(formData.get("note") ?? ""),
    direction: String(formData.get("direction") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };
  const parsed = parseMovementInput(values);

  if (!parsed.ok) {
    return { error: parsed.error, field: parsed.field, values };
  }

  if (!(await allows("movements", "write"))) {
    return { error: "Your account cannot record stock movements.", field: null, values };
  }

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", field: null, values };
  }

  const account = await currentAccount();

  const { data, error } = await createSupabaseServerClient().rpc("record_stock_movement", {
    p_product_id: parsed.value.productId,
    p_movement_type: parsed.value.movementType,
    p_quantity: parsed.value.quantity,
    p_note: parsed.value.note,
    p_created_by: account?.username ?? null,
    p_adjustment_direction: parsed.value.direction,
    p_reason: parsed.value.reason,
  });

  if (error) {
    return { error: error.message, field: null, values };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const movementId = row && typeof row === "object" && "id" in row && typeof row.id === "string" ? row.id : null;

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${parsed.value.productId}`);
  revalidatePath("/movements");

  if (movementId) {
    revalidatePath(`/movements/${movementId}`);
    redirect(`/movements/${movementId}`);
  }

  redirect("/movements");
}

export async function recordStockCount(
  state: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!(await allows("movements", "write"))) {
    return { error: "Your account cannot record a stock count." };
  }

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured." };
  }

  const { products, error } = await listProducts("", "all");

  if (error) {
    return { error };
  }

  const account = await currentAccount();
  let posted = 0;

  for (const product of products) {
    if (!product.is_active) continue;

    const raw = String(formData.get(`count-${product.id}`) ?? "").trim();
    if (!raw) continue;

    const counted = Number(raw);

    if (!Number.isInteger(counted) || counted < 0) {
      return { error: `${product.name} needs a whole number, zero or greater.` };
    }

    const difference = counted - product.quantity_on_hand;
    if (difference === 0) continue;

    const { error: moveError } = await createSupabaseServerClient().rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "ADJUSTMENT",
      p_quantity: Math.abs(difference),
      p_note: `Stock count. System had ${product.quantity_on_hand}, counted ${counted}.`,
      p_created_by: account?.username ?? null,
      p_adjustment_direction: difference > 0 ? "increase" : "decrease",
      p_reason: null,
    });

    if (moveError) {
      return { error: moveError.message };
    }

    posted += 1;
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/movements");

  if (posted === 0) {
    return { error: "Every count matches the system. Nothing was recorded." };
  }

  redirect("/movements?period=today");
}

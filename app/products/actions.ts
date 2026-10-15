"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseProductInput, type ProductInput } from "@/lib/product-input";
import { allows } from "@/lib/accounts";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";

export type ProductFormState = {
  error: string | null;
  values: ProductInput;
};

export async function createProduct(state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const values: ProductInput = {
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    supplier: String(formData.get("supplier") ?? ""),
    costPrice: String(formData.get("costPrice") ?? ""),
    sellingPrice: String(formData.get("sellingPrice") ?? ""),
    threshold: String(formData.get("threshold") ?? ""),
  };

  const parsed = parseProductInput(values);

  if (!parsed.ok) {
    return { error: parsed.error, values };
  }

  if (!(await allows("products", "write"))) {
    return { error: "Your account cannot add products.", values };
  }

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured.", values };
  }

  const { data, error } = await createSupabaseServerClient()
    .from("products")
    .insert(parsed.value)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This SKU already exists. Choose a different code.", values };
    }

    return { error: error.message, values };
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/movements/new?type=IN&product=${data.id}`);
}

export type RemoveProductState = {
  error: string | null;
};

export async function removeProduct(
  state: RemoveProductState,
  formData: FormData,
): Promise<RemoveProductState> {
  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    return { error: "Choose a product." };
  }

  if (!(await allows("products", "delete"))) {
    return { error: "Your account cannot delete products." };
  }

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_product", {
    p_product_id: productId,
  });

  if (error) {
    const missingFunction = error.code === "PGRST202" || error.message.includes("remove_product");

    if (!missingFunction) {
      return { error: error.message };
    }

    const { count, error: countError } = await supabase
      .from("stock_movements")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError) {
      return { error: countError.message };
    }

    if ((count ?? 0) > 0) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", productId);

      if (updateError) {
        return { error: updateError.message };
      }
    } else {
      return {
        error:
          "This product has no stock history, so it can be deleted. Run supabase/remove-product.sql in the Supabase SQL editor, then try again.",
      };
    }
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/movements");
  redirect("/products");
}

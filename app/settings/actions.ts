"use server";

import { revalidatePath } from "next/cache";
import { allows } from "@/lib/accounts";
import { saveLogo, saveShopName } from "@/lib/branding";

export type SettingsState = {
  error: string | null;
  saved: boolean;
};

export async function saveSettings(state: SettingsState, formData: FormData): Promise<SettingsState> {
  if (!(await allows("settings", "write"))) {
    return { error: "Your account cannot change settings.", saved: false };
  }

  const shopName = String(formData.get("shopName") ?? "").trim();

  if (!shopName) {
    return { error: "Store name is required.", saved: false };
  }

  const savedName = await saveShopName(shopName);

  if (savedName.error) {
    return { error: savedName.error, saved: false };
  }

  const logo = formData.get("logo");

  if (logo instanceof File && logo.size > 0) {
    const savedLogo = await saveLogo(logo);

    if (savedLogo.error) {
      return { error: savedLogo.error, saved: false };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/settings");
  return { error: null, saved: true };
}

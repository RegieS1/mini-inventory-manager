import { readFile } from "fs/promises";
import path from "path";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";

export type Branding = {
  shopName: string;
  logoUrl: string | null;
};

type LogoRow = {
  shop_name: string | null;
  logo_base64: string | null;
  logo_content_type: string | null;
  logo_updated_at: string | null;
};

function hostedHint(message: string) {
  if (message.includes("logo_base64")) {
    return `${message} Run supabase/hosted.sql in the Supabase SQL editor.`;
  }

  return message;
}

async function settingsRow() {
  const { data, error } = await createSupabaseServerClient()
    .from("inventory_settings")
    .select("shop_name,logo_base64,logo_content_type,logo_updated_at")
    .eq("singleton", true)
    .maybeSingle();

  if (error) {
    throw new Error(hostedHint(error.message));
  }

  return (data ?? null) as LogoRow | null;
}

async function importLocalLogo(row: LogoRow | null) {
  if (row?.logo_base64) {
    return row;
  }

  try {
    const meta = JSON.parse(await readFile(path.join(process.cwd(), "data", "logo.json"), "utf8")) as {
      contentType?: string;
    };
    const bytes = await readFile(path.join(process.cwd(), "data", "logo"));

    if (!meta.contentType) {
      return row;
    }

    const updatedAt = new Date().toISOString();
    const { error } = await createSupabaseServerClient()
      .from("inventory_settings")
      .update({
        logo_base64: bytes.toString("base64"),
        logo_content_type: meta.contentType,
        logo_updated_at: updatedAt,
      })
      .eq("singleton", true);

    if (error) {
      throw new Error(hostedHint(error.message));
    }

    return {
      shop_name: row?.shop_name ?? null,
      logo_base64: bytes.toString("base64"),
      logo_content_type: meta.contentType,
      logo_updated_at: updatedAt,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("logo_base64")) {
      throw error;
    }

    return row;
  }
}

export async function getBranding(): Promise<Branding> {
  if (!getSupabaseServerConfig()) {
    return { shopName: "My shop", logoUrl: null };
  }

  const row = await importLocalLogo(await settingsRow());

  return {
    shopName: row?.shop_name || "My shop",
    logoUrl: row?.logo_updated_at ? `/logo?v=${new Date(row.logo_updated_at).getTime()}` : null,
  };
}

export async function saveShopName(shopName: string) {
  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await createSupabaseServerClient()
    .from("inventory_settings")
    .update({ shop_name: shopName })
    .eq("singleton", true);

  return { error: error?.message ?? null };
}

export async function saveLogo(file: File) {
  const allowed = ["image/png", "image/jpeg", "image/webp"];

  if (!allowed.includes(file.type)) {
    return { error: "Use a PNG, JPEG, or WebP logo." };
  }

  if (file.size > 1024 * 1024) {
    return { error: "Logo must be 1 MB or smaller." };
  }

  if (!getSupabaseServerConfig()) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await createSupabaseServerClient()
    .from("inventory_settings")
    .update({
      logo_base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      logo_content_type: file.type,
      logo_updated_at: new Date().toISOString(),
    })
    .eq("singleton", true);

  return { error: error ? hostedHint(error.message) : null };
}

export async function readLogo() {
  if (!getSupabaseServerConfig()) {
    return null;
  }

  const row = await importLocalLogo(await settingsRow());

  if (!row?.logo_base64 || !row.logo_content_type) {
    return null;
  }

  return {
    bytes: Buffer.from(row.logo_base64, "base64"),
    contentType: row.logo_content_type,
  };
}

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createLocalClient } from "@/lib/local-db";

export function usesLocalShop() {
  return process.env.KUGI_LOCAL === "1";
}

export function getSupabaseServerConfig() {
  if (usesLocalShop()) {
    return { url: "local", serviceRoleKey: "local" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function createSupabaseServerClient(): SupabaseClient {
  if (usesLocalShop()) {
    return createLocalClient() as unknown as SupabaseClient;
  }

  const config = getSupabaseServerConfig();

  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

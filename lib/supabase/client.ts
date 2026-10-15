import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient(): SupabaseClient {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and add the Supabase project URL and anon key.",
    );
  }

  return createClient(config.url, config.anonKey);
}

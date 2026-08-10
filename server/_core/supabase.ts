import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV, hasSupabaseAdmin, hasSupabaseConfig } from "./env";

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
    );
  }
  if (!anonClient) {
    anonClient = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return anonClient;
}

/** Service-role client for server-side auth validation and storage. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!hasSupabaseAdmin()) {
    throw new Error(
      "Supabase admin is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }
  if (!adminClient) {
    adminClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return adminClient;
}

export function getPublicStorageUrl(path: string): string {
  const bucket = ENV.supabaseStorageBucket;
  return `${ENV.supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, "")}`;
}

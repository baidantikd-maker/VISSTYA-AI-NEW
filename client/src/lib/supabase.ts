import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
let anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

let client: SupabaseClient | null = null;
let configLoad: Promise<void> | null = null;

export async function loadBrowserSupabaseConfig(): Promise<void> {
  if (hasBrowserSupabaseConfig()) return;
  if (configLoad) return configLoad;

  configLoad = (async () => {
    const response = await fetch("/api/config/supabase", {
      credentials: "same-origin",
    });
    const config = await response.json().catch(() => ({}));
    if (!response.ok || !config.url || !config.anonKey) {
      throw new Error(
        config.error ||
          "Supabase is not configured for this deployment. Set the server Supabase environment variables in Vercel."
      );
    }
    url = config.url;
    anonKey = config.anonKey;
  })();

  try {
    await configLoad;
  } catch (error) {
    configLoad = null;
    throw error;
  }
}

/** Keep the server's httpOnly session cookie aligned with Supabase Auth. */
export async function syncServerSession(
  accessToken?: string,
  refreshToken?: string
): Promise<void> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to establish the server session");
  }
}

export async function clearServerSession(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });
}

/**
 * Mirrors Supabase Auth token changes into the server cookie used by tRPC.
 * This covers a page reload and token refreshes, avoiding an expired backend
 * session while the browser still has a valid Supabase session.
 */
export async function startSupabaseSessionSync(): Promise<() => void> {
  await loadBrowserSupabaseConfig();

  const { data } = getBrowserSupabase().auth.onAuthStateChange(
    (event, session) => {
      if (
        session &&
        (event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED")
      ) {
        void syncServerSession(session.access_token, session.refresh_token).catch(
          error => console.error("[Auth] Server session sync failed", error)
        );
      }

      if (event === "SIGNED_OUT") {
        void clearServerSession();
      }
    }
  );

  return () => data.subscription.unsubscribe();
}

export function getBrowserSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set the server Supabase environment variables."
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export function hasBrowserSupabaseConfig(): boolean {
  return Boolean(url && anonKey);
}

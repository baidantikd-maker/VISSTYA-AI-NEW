import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

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
export function startSupabaseSessionSync(): () => void {
  if (!hasBrowserSupabaseConfig()) return () => undefined;

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
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env and restart the dev server."
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

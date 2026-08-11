import DarkVeil from "@/components/DarkVeil";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getBrowserSupabase,
  hasBrowserSupabaseConfig,
  syncServerSession,
} from "@/lib/supabase";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    try {
      if (!hasBrowserSupabaseConfig()) {
        throw new Error(
          "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
        );
      }

      const supabase = getBrowserSupabase();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() || undefined },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session?.access_token) {
          await syncServerSession(
            data.session.access_token,
            data.session.refresh_token
          );
          setLocation("/dashboard");
          return;
        }

        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (signInError) throw signInError;
      if (!data.session?.access_token) {
        throw new Error("No session returned from Supabase");
      }

      await syncServerSession(
        data.session.access_token,
        data.session.refresh_token
      );
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent dark:bg-[hsl(var(--background))]">
      {isDark && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          <DarkVeil
            scanlineIntensity={0.58}
            speed={1.1}
            scanlineFrequency={4}
          />
          <div className="absolute inset-0 bg-[hsl(var(--background))/70]" />
        </div>
      )}
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/85] backdrop-blur-md">
          <div className="container flex h-14 items-center justify-between">
            <button
              type="button"
              onClick={() => setLocation("/")}
              aria-label="Visstya AI home"
            >
              <Logo />
            </button>
            <span className="text-xs text-[hsl(var(--muted))]">
              Powered by Visstya AI · Evidence-based verification
            </span>
          </div>
        </header>

        <div className="container flex min-h-[70vh] max-w-md flex-col justify-center py-12">
          <div className="text-center">
            <p className="section-label eyebrow-glow">Account</p>
            <h1 className="section-title-glow mt-3 text-3xl md:text-4xl">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-3 text-sm text-[hsl(var(--muted))]">
              Use your email and password with Supabase Auth.
            </p>
          </div>

          <form onSubmit={submit} className="panel mt-8 space-y-4 p-6">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="login-name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Name
                </label>
                <input
                  id="login-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--foreground))]"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--foreground))]"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--foreground))]"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />
            </div>

            {error && (
              <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
            )}
            {info && (
              <p className="text-sm text-[hsl(var(--muted))]">{info}</p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[hsl(var(--muted))]">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

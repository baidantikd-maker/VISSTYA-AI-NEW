import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, History, Settings, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import DarkVeil from "./DarkVeil";
import { Logo } from "./Logo";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/verify", label: "Verify", icon: ShieldCheck },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const initials = (user?.name ?? "V")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeFor = (href: string) =>
    href === "/verify"
      ? location.startsWith("/verify")
      : location.startsWith(href);

  return (
    <div className="relative min-h-screen flex-col bg-[hsl(var(--background))]">
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
      <div className="relative z-10 flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/85] backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setLocation("/")}
              aria-label="Visstya AI home"
            >
              <Logo />
            </button>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeFor(item.href);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setLocation(item.href)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-[hsl(var(--secondary))] font-medium text-[hsl(var(--foreground))]"
                        : "text-[hsl(var(--muted))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex size-7 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-xs font-semibold text-[hsl(var(--foreground))]">
                {initials}
              </span>
              <span className="text-sm text-[hsl(var(--muted))]">
                {user?.name ?? "Guest Mode"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                void logout();
                setLocation("/");
              }}
              className="rounded-md px-3 py-1.5 text-sm text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-12">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))/90] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeFor(item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => setLocation(item.href)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  active
                    ? "font-medium text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted))]"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      </div>
    </div>
  );
}

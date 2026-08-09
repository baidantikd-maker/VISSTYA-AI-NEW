import { Logo } from "./Logo";
import { ArrowRight, Disc3, Menu, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "wouter";
import { WheelMenu } from "./WheelMenu";

const ANCHOR_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#modules", label: "Modules" },
  { href: "/#scale", label: "Trust scale" },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);

  const go = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      const onLanding = window.location.pathname === "/";
      if (onLanding) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        setLocation("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 80);
      }
    } else {
      setLocation(href);
    }
  };

  const isActive = (href: string) => location.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/85] backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="shrink-0"
            aria-label="Visstya AI home"
          >
            <Logo />
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {ANCHOR_LINKS.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
                className="hidden rounded-md px-3 py-1.5 text-sm text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] xl:block"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWheelOpen(true)}
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] md:inline-flex"
            aria-label="Open navigation wheel"
          >
            <Disc3 className="size-4" />
            Menu
          </button>
          <button
            type="button"
            onClick={() => setLocation("/dashboard")}
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))] lg:block"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setLocation("/verify")}
            className="hidden h-9 items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:opacity-90 active:scale-[0.98] md:inline-flex"
          >
            Verify Content
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setLocation("/settings")}
            className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-[hsl(var(--secondary))] active:scale-[0.97]"
            aria-label="Settings"
          >
            <Settings className="nav-settings-icon size-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-9 items-center justify-center rounded-md text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] md:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {ANCHOR_LINKS.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
                className="rounded-md px-3 py-2.5 text-left text-sm text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
              >
                {item.label}
              </button>
            ))}
            <div className="my-1 h-px bg-[hsl(var(--border))]" />
            <button
              type="button"
              onClick={() => setLocation("/verify")}
              className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:opacity-90"
            >
              Verify Content
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <WheelMenu open={wheelOpen} onClose={() => setWheelOpen(false)} />
    </header>
  );
}

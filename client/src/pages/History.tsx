import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { formatDate } from "@/lib/format";
import { STATUS_META, scoreToBand } from "@/lib/status";
import { cn } from "@/lib/utils";
import { mockStore } from "@/mock/store";
import type { StatusBand } from "@/mock/types";
import { ArrowRight, FileSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const FILTERS: Array<{ key: StatusBand | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "FALSE", label: "Low confidence" },
  { key: "AVERAGE", label: "Average" },
  { key: "TRUSTABLE", label: "Trustable" },
];

export default function History() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusBand | "ALL">("ALL");
  const [focused, setFocused] = useState(false);

  const reports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockStore.list().filter((r) => {
      if (filter !== "ALL" && r.statusBand !== filter) return false;
      if (!q) return true;
      const haystack = [
        r.claim.event,
        r.claim.location ?? "",
        r.claim.date ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter]);

  return (
    <AppShell>
      <div className="relative z-10">
          <div className="container max-w-5xl py-10 md:py-14">
            <div className="fade-in text-center">
              <p className="section-label eyebrow-glow">Archive</p>
              <h1 className="section-title-glow mt-3 text-balance text-3xl dark:text-4xl md:text-4xl md:dark:text-5xl">
                Verification history
              </h1>
          <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted))]">
            Every claim you've run through Visstya, with its evidence score.
          </p>
        </div>

        {/* Search + filters */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            {isDark ? (
              <div
                className={cn(
                  "flex h-11 w-full items-center gap-2 rounded-full border px-2 transition-all duration-300",
                  "border-white/15 bg-white/10 backdrop-blur-sm",
                  focused && "border-[hsl(261_88%_60%)]/60 bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    focused && "ml-auto"
                  )}
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, hsl(261 88% 72%), hsl(261 88% 60%))",
                  }}
                >
                  <Search className="size-4 text-white" strokeWidth={2.5} />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Search claims, locations or reports"
                  className="w-full bg-transparent text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted))]"
                />
                {focused && (
                  <span className="mr-1 h-4 w-0.5 shrink-0 animate-pulse rounded-full bg-[hsl(261_88%_60%)]" />
                )}
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted))]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search claims, locations or reports…"
                  className="h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted))] focus:border-[hsl(var(--foreground))]"
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  filter === f.key
                    ? "bg-[hsl(var(--primary))] font-medium text-[hsl(var(--primary-foreground))]"
                    : isDark
                      ? "text-[hsl(var(--muted))] hover:bg-[hsl(261_88%_90%)]/40 hover:text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="mt-6">
          {reports.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="size-7" strokeWidth={1.5} />}
              title="No verifications found"
              description={
                query || filter !== "ALL"
                  ? "Try a different search term or filter."
                  : "Run your first verification to build your evidence archive."
              }
            />
          ) : (
            <div
              className={cn(
                "divide-y divide-[hsl(var(--border))] overflow-hidden",
                isDark
                  ? "panel-border-only glass shadow-[0_0_18px_rgba(255,255,255,0.3),0_0_50px_rgba(255,255,255,0.12)]"
                  : "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-6px_rgba(16,24,40,0.12),0_20px_40px_-12px_rgba(16,24,40,0.14)]"
              )}
            >
              {reports.map((report) => {
                const band = scoreToBand(report.totalScore);
                const meta = STATUS_META[band];
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setLocation(`/report/${report.id}`)}
                    className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[hsl(var(--secondary))/40]"
                  >
                    <span
                      className={cn(
                        "hidden h-12 w-16 shrink-0 items-center justify-center rounded-md border text-[10px] font-medium sm:flex",
                        meta.bgClass,
                        meta.borderClass,
                        meta.textClass
                      )}
                    >
                      {report.media.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[hsl(var(--foreground))]">
                        {report.claim.event}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[hsl(var(--muted))]">
                        {[report.claim.location, report.claim.date]
                          .filter(Boolean)
                          .join(" · ") || "No context"}
                        {" · "}
                        {formatDate(report.createdAt)}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-2 md:flex">
                      <StatusBadge score={report.totalScore} size="sm" />
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={cn("block text-lg font-medium tabular-nums", isDark ? meta.textClass : "text-[hsl(var(--foreground))]")}>
                        {report.totalScore}
                      </span>
                      <span className={cn("block text-[10px]", isDark ? "text-white" : "text-[hsl(var(--muted))]")}>/ 100</span>
                    </span>
                    {isDark ? (
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98] sm:inline-flex">
                        Open Report
                        <ArrowRight className="size-3" />
                      </span>
                    ) : (
                      <span className="link-arrow hidden sm:inline-flex">
                        Open Report
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

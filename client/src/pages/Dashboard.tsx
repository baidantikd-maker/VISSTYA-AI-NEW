import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { formatDate } from "@/lib/format";
import { useMockReports } from "@/mock/useMockReports";
import { STATUS_META } from "@/lib/status";
import { ArrowRight, Plus } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={isDark ? "panel-border-only panel-border-dashed glass p-5" : "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-6px_rgba(16,24,40,0.12),0_20px_40px_-12px_rgba(16,24,40,0.14)]"}>
      <p className={isDark ? "text-sm font-bold uppercase tracking-wide text-white [text-shadow:0_0_12px_hsl(261_88%_60%_/_1),0_0_28px_hsl(261_88%_60%_/_0.7),0_0_48px_hsl(261_88%_60%_/_0.4)]" : "text-sm text-[hsl(var(--muted))]"}>{label}</p>
      <p className={`mt-2 text-3xl font-medium tabular-nums text-[hsl(var(--foreground))] ${className ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reports = useMockReports();

  const stats = useMemo(() => {
    return {
      total: reports.length,
      trustable: reports.filter((r) => r.statusBand === "TRUSTABLE").length,
      average: reports.filter((r) => r.statusBand === "AVERAGE").length,
      false: reports.filter((r) => r.statusBand === "FALSE").length,
    };
  }, [reports]);

  const recent = reports.slice(0, 5);

  return (
    <AppShell>
      <div className="relative z-10">
      <div className="container max-w-5xl py-10 md:py-14">
        <div className="fade-in text-center">
          <p className="section-label section-label-tone">Overview</p>
          <h1 className={`mt-3 text-balance ${isDark ? "text-4xl font-bold md:text-6xl" : "text-3xl md:text-4xl"}`}>
            {greeting()}, <span className="text-[hsl(var(--muted))]">researcher</span>
          </h1>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setLocation("/verify")}
              className={
                isDark
                  ? "inline-flex h-11 items-center gap-2 rounded-md border border-white/50 bg-white/10 px-6 text-base font-bold text-[hsl(var(--foreground))] shadow-[0_0_10px_rgba(255,255,255,0.35),0_0_22px_rgba(255,255,255,0.15)] backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-black active:scale-[0.98]"
                  : "inline-flex h-11 items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-5 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              }
            >
              <Plus className="size-4" />
              New Verification
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total verifications" value={stats.total} />
          <StatCard label="Trustable" value={stats.trustable} className={isDark ? "stat-number-trustable" : "text-trustable"} />
          <StatCard label="Average" value={stats.average} className={isDark ? "stat-number-average" : "text-average"} />
          <StatCard label="Low confidence" value={stats.false} className={isDark ? "stat-number-false" : "text-false"} />
        </div>

        {/* Recent */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className={isDark ? "text-2xl font-semibold text-white md:text-3xl" : "text-xl md:text-2xl"}>Recent verifications</h2>
            <button
              type="button"
              onClick={() => setLocation("/history")}
              className={
                isDark
                  ? "inline-flex h-9 items-center gap-2 rounded-md bg-[hsl(261_88%_60%)] px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-[hsl(261_88%_66%)] hover:shadow-[0_0_12px_hsl(261_88%_60%_/_0.6)] active:scale-[0.98]"
                  : "link-arrow"
              }
            >
              View all
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className={isDark ? "panel-border-only glass mt-5 divide-y divide-[hsl(var(--border))] overflow-hidden shadow-[0_0_18px_rgba(255,255,255,0.3),0_0_50px_rgba(255,255,255,0.12)]" : "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] mt-5 divide-y divide-[hsl(var(--border))] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-6px_rgba(16,24,40,0.12),0_20px_40px_-12px_rgba(16,24,40,0.14)]"}>
            {recent.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setLocation(`/report/${report.id}`)}
                className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[hsl(var(--secondary))/40]"
              >
                <span className="min-w-0 flex-1">
                  <span className={isDark ? "block truncate text-base font-medium text-white" : "block truncate text-sm font-medium text-[hsl(var(--foreground))]"}>
                    {report.claim.event}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[hsl(var(--muted))]">
                    {[report.claim.location, report.claim.date]
                      .filter(Boolean)
                      .join(" · ") || "No context"}{" "}
                    · {formatDate(report.createdAt)}
                  </span>
                </span>
                <StatusBadge score={report.totalScore} size="sm" />
                <span className={isDark ? `w-12 text-right text-lg font-medium tabular-nums ${STATUS_META[report.statusBand].textClass}` : "w-12 text-right text-lg font-medium tabular-nums text-[hsl(var(--foreground))]"}>
                  {report.totalScore}
                </span>
                <ArrowRight className="size-4 shrink-0 text-[hsl(var(--muted))] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

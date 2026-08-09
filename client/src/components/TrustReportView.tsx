import type { VerificationReport } from "@/mock/types";
import { toast } from "sonner";
import {
  FileDown,
  Link2,
  MapPin,
  Newspaper,
  ShieldAlert,
  CalendarDays,
} from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { MediaPreview } from "./MediaPreview";
import { ModuleCard } from "./ModuleCard";
import { ReportHeader } from "./ReportHeader";
import { SourceCard } from "./SourceCard";
import { TrustScale, TrustScore } from "./TrustScore";
import { scoreToBand } from "@/lib/status";
import { WarningBanner } from "./WarningBanner";

const MODULES: Array<{ key: "metadata" | "vision" | "weather" | "evidence"; title: string }> = [
  { key: "metadata", title: "Metadata" },
  { key: "vision", title: "Vision analysis" },
  { key: "weather", title: "Weather verification" },
  { key: "evidence", title: "Evidence corroboration" },
];

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[hsl(var(--muted))]">{icon}</span>
      <div>
        <p className="text-xs text-[hsl(var(--muted))]">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-[hsl(var(--foreground))]">{value}</p>
      </div>
    </div>
  );
}

export function TrustReportView({
  report,
  isPublic = false,
  onShare,
  onExport,
  onRerun,
}: {
  report: VerificationReport;
  isPublic?: boolean;
  onShare?: () => void;
  onExport?: () => void;
  onRerun?: () => void;
}) {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const band = scoreToBand(report.totalScore);
  const glowVar =
    band === "FALSE"
      ? "8 88% 60%"
      : band === "AVERAGE"
        ? "48 95% 62%"
        : "158 78% 58%";

  const outlineGlowButton =
    "inline-flex h-11 items-center gap-2 rounded-md px-6 transition-all duration-200 hover:bg-[hsl(var(--secondary))] active:scale-[0.98] " +
    (isDark
      ? "border border-white/50 text-base font-bold text-[hsl(var(--foreground))] shadow-[0_0_10px_rgba(255,255,255,0.35),0_0_22px_rgba(255,255,255,0.15)]"
      : "border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--foreground))]");

  const defaultShare = () => {
    const url = `${window.location.origin}/share/${report.shareToken}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Share link copied"))
      .catch(() => toast.info(url));
  };

  const defaultExport = () => {
    window.print();
  };

  const shareReport = onShare ?? defaultShare;
  const exportReport = onExport ?? defaultExport;
  const rerun = onRerun ?? (() => setLocation("/verify"));

  return (
    <div className="report-page print-area fade-in">
      <ReportHeader report={report} isPublic={isPublic} />

      {/* Media + claim summary */}
      <div className="grid gap-8 py-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="section-label mb-3 dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Media analysed</p>
          <MediaPreview media={report.media} size="lg" />
          <p className="mt-2 truncate text-xs text-[hsl(var(--muted))]">
            {report.media.fileName ?? "Media from URL"} · {report.media.kind}
            {report.media.mime ? ` · ${report.media.mime}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="section-label mb-3 dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Claim</p>
            <div
              className="panel-subtle space-y-4 p-4 dark:border-dotted dark:border-white/60 dark:bg-transparent dark:shadow-none"
              style={
                isDark
                  ? {
                      boxShadow:
                        "0 0 12px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.14), inset 0 0 8px rgba(255,255,255,0.08)",
                    }
                  : undefined
              }
            >
              <MetaRow icon={<Newspaper className="size-4" />} label="Claim made" value={report.claim.event} />
              {report.claim.location && (
                <MetaRow icon={<MapPin className="size-4" />} label="Location" value={report.claim.location} />
              )}
              {report.claim.date && (
                <MetaRow icon={<CalendarDays className="size-4" />} label="Claimed date" value={report.claim.date} />
              )}
            </div>
          </div>
          <div>
            <p className="section-label mb-3 dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Trust score</p>
            <div
              className="panel p-5 dark:border dark:border-white/60 dark:bg-transparent dark:shadow-none"
              style={
                isDark
                  ? {
                      boxShadow: `0 0 16px hsl(${glowVar} / 0.45), 0 0 40px hsl(${glowVar} / 0.22), inset 0 0 12px hsl(${glowVar} / 0.14)`,
                    }
                  : undefined
              }
            >
              <TrustScore score={report.totalScore} />
              <TrustScale score={report.totalScore} className="mt-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-y border-[hsl(var(--border))] py-8">
        <p className="section-label mb-3 dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Summary</p>
        <p className="max-w-3xl text-[15px] leading-relaxed text-[hsl(var(--foreground))]">
          {report.summary}
        </p>
        <WarningBanner title="What this report is" className="mt-5">
          Visstya rates how well evidence supports a claim — it does not declare
          ground truth. The verdict reflects the evidence available at analysis
          time and can change as new evidence emerges.
        </WarningBanner>
      </div>

      {/* Modules */}
      <div className="py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-label dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Analysis</p>
            <h2 className="mt-2 text-xl text-[hsl(var(--foreground))] md:text-2xl dark:text-white dark:[text-shadow:0_0_2px_hsl(270_90%_65%/0.6),0_0_10px_hsl(270_90%_65%/0.35),0_0_20px_hsl(270_90%_65%/0.15)]">How each evidence signal scored</h2>
          </div>
          <p className="hidden text-sm text-[hsl(var(--muted))] sm:block">
            Metadata /15 · Vision /25 · Weather /25 · Evidence /35
          </p>
        </div>
        <div className="space-y-3">
          {MODULES.map((m, i) => (
            <ModuleCard
              key={m.key}
              index={i + 1}
              title={m.title}
              module={report.modules[m.key]}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="border-t border-[hsl(var(--border))] py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-label dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Evidence</p>
            <h2 className="mt-2 text-xl text-[hsl(var(--foreground))] md:text-2xl dark:text-white dark:[text-shadow:0_0_2px_hsl(270_90%_65%/0.6),0_0_10px_hsl(270_90%_65%/0.35),0_0_20px_hsl(270_90%_65%/0.15)]">
              Sources examined ({report.sources.length})
            </h2>
          </div>
          <p className="hidden text-sm text-[hsl(var(--muted))] sm:block">
            Each source is dated and independently verifiable
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {report.sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-[hsl(var(--border))] py-8">
        <p className="section-label dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Sequence</p>
        <h2 className="mt-2 text-xl text-[hsl(var(--foreground))] md:text-2xl dark:text-white dark:[text-shadow:0_0_2px_hsl(270_90%_65%/0.6),0_0_10px_hsl(270_90%_65%/0.35),0_0_20px_hsl(270_90%_65%/0.15)]">Evidence timeline</h2>
        <div className="mt-6 max-w-2xl">
          <EvidenceTimeline events={report.timeline} />
        </div>
      </div>

      {/* Limitations */}
      <div className="border-t border-[hsl(var(--border))] py-8">
        <p className="section-label dark:font-extrabold dark:text-[hsl(261_88%_60%)]">Caveats</p>
        <h2 className="mt-2 text-xl text-[hsl(var(--foreground))] md:text-2xl dark:text-white dark:[text-shadow:0_0_2px_hsl(270_90%_65%/0.6),0_0_10px_hsl(270_90%_65%/0.35),0_0_20px_hsl(270_90%_65%/0.15)]">Important limitations</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {report.limitations.map((lim) => (
            <div key={lim.title} className="card-glow rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 dark:border-white/60 dark:bg-transparent dark:shadow-[0_0_6px_rgba(255,255,255,0.18),0_0_14px_rgba(255,255,255,0.08)]">
              <p className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
                <ShieldAlert className="size-4 text-average" />
                {lim.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted))]">
                {lim.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border))] py-8">
        <button type="button" onClick={exportReport} className={outlineGlowButton}>
          <FileDown className="size-4" />
          Export PDF
        </button>
        <button type="button" onClick={shareReport} className={outlineGlowButton}>
          <Link2 className="size-4" />
          Share Report
        </button>
        {isDark ? (
          <button
            type="button"
            onClick={rerun}
            className="ml-auto inline-flex shrink-0 items-center rounded-md bg-[hsl(261_88%_60%)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Run Again
          </button>
        ) : (
          <button
            type="button"
            onClick={rerun}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border border-[hsl(var(--border))] px-4 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))] active:scale-[0.98]"
          >
            Run Again
          </button>
        )}
      </div>
    </div>
  );
}

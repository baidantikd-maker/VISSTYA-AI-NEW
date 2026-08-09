import type { AnalysisItem, ModuleReport } from "@/mock/types";
import { scoreToBand } from "@/lib/status";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { ChevronDown, Flag } from "lucide-react";
import { useState } from "react";
import { ScoreBar } from "./ScoreBar";

const TONE_CLASS = {
  good: "text-trustable",
  warn: "text-average",
  bad: "text-false",
  neutral: "text-[hsl(var(--foreground))]",
} as const;

const BAR_STRONG_CLASS = {
  good: "bar-strong-success",
  warn: "bar-strong-average",
  bad: "bar-strong-false",
} as const;

export function ModuleCard({
  index,
  title,
  module,
  defaultOpen = false,
}: {
  index: number;
  title: string;
  module: ModuleReport;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const band = scoreToBand((module.score / module.max) * 100);
  const bandTone =
    band === "FALSE" ? "bad" : band === "AVERAGE" ? "warn" : "good";
  const toneClass = (tone: AnalysisItem["tone"]) =>
    TONE_CLASS[tone === "neutral" ? bandTone : tone];

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[hsl(var(--secondary))/30]"
        aria-expanded={open}
      >
        <span className="font-mono text-xs text-[hsl(var(--muted))]">
          {String(index).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-medium text-[hsl(var(--foreground))]">
            {title}
          </span>
          <span
            className={cn(
              "mt-0.5 block text-xs",
              isDark ? "font-semibold" : "text-[hsl(var(--muted))]",
              isDark && TONE_CLASS[bandTone]
            )}
          >
            {module.score} / {module.max} —{" "}
            {band === "FALSE"
              ? "weak support"
              : band === "AVERAGE"
                ? "partial support"
                : "strong support"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[hsl(var(--muted))] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[hsl(var(--border))] px-5 py-5">
          <ScoreBar label={title} score={module.score} max={module.max} className="mb-5" barClassName={BAR_STRONG_CLASS[bandTone]} />
          <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">
            {module.summary}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {module.items.map((item) =>
              isDark ? (
                <p
                  key={item.label}
                  className="col-span-full border-b border-[hsl(var(--border))]/60 pb-2 text-sm leading-relaxed"
                >
                  <span className="text-[hsl(var(--muted))]">{item.label}: </span>
                  <span className={cn("font-medium", toneClass(item.tone))}>
                    {item.value}
                  </span>
                </p>
              ) : (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 border-b border-[hsl(var(--border))]/60 pb-2 text-sm"
                >
                  <span className="text-[hsl(var(--muted))]">{item.label}</span>
                  <span className={cn("text-right font-medium", TONE_CLASS[item.tone])}>
                    {item.value}
                  </span>
                </div>
              )
            )}
          </div>

          {module.redFlags && module.redFlags.length > 0 && (
            <div className="mt-5 space-y-2 border-l-2 border-average pl-4">
              {module.redFlags.map((flag) => (
                <p
                  key={flag}
                  className="flex items-start gap-2 text-sm leading-relaxed text-average"
                >
                  <Flag className="mt-0.5 size-3.5 shrink-0" />
                  {flag}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

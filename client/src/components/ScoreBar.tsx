import { scoreToBand } from "@/lib/status";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ScoreBar({
  label,
  score,
  max,
  className,
  barClassName,
}: {
  label: string;
  score: number;
  max: number;
  className?: string;
  barClassName?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pct = Math.round((score / max) * 100);
  const meta = scoreToBand((score / max) * 100);
  const barColor =
    meta === "FALSE"
      ? isDark
        ? "scale-false"
        : "bg-false"
      : meta === "AVERAGE"
        ? isDark
          ? "scale-average"
          : "bg-average"
        : isDark
          ? "scale-trustable"
          : "bg-trustable";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-[hsl(var(--foreground))]">{label}</span>
        <span className="score-mark text-sm tabular-nums">
          {score}
          <span className="score-mark-suffix"> / {max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
        <div
          className={cn("h-full rounded-full", barColor, barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

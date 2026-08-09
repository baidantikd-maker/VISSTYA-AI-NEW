import type { Source } from "@/mock/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowUpRight, ExternalLink } from "lucide-react";

const LABEL_CLASS: Record<Source["label"], string> = {
  Supporting: "text-trustable",
  Contradicting: "text-false",
  Inconclusive: "text-average",
};

export function SourceCard({ source }: { source: Source }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-glow group block rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-colors hover:border-[hsl(var(--foreground))/20] dark:border-2 dark:border-dotted dark:border-white/80 dark:bg-transparent dark:shadow-[0_0_6px_rgba(255,255,255,0.18),0_0_14px_rgba(255,255,255,0.08)] dark:hover:border-solid dark:hover:border-white"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-[hsl(var(--foreground))]">
          {source.name}
          <ExternalLink className="size-3 text-[hsl(var(--muted))]" />
        </span>
        <span className={cn("shrink-0 text-xs font-medium", LABEL_CLASS[source.label])}>
          {source.label}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-[hsl(var(--foreground))]">
        {source.headline}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted))]">
        {source.snippet}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[hsl(var(--muted))]">
          {formatDate(source.publishedAt)} · {source.domain}
        </span>
        {isDark ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98]">
            Open source
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : (
          <span className="link-arrow text-[hsl(var(--foreground))]">
            Open source
            <ArrowUpRight className="size-3.5" />
          </span>
        )}
      </div>
    </a>
  );
}

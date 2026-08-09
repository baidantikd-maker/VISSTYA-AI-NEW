import { PROCESSING_STEPS } from "@/mock/engine";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export function VerificationProgress({
  doneSteps,
  generating = false,
}: {
  doneSteps: number;
  generating?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      <ol className="space-y-0">
        {PROCESSING_STEPS.map((step, i) => {
          const state = i < doneSteps ? "done" : i === doneSteps ? "active" : "pending";
          return (
            <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  state === "done" &&
                    (isDark
                      ? "border-transparent bg-[hsl(261_88%_60%)] text-white"
                      : "border-transparent bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"),
                  state === "active" && "border-[hsl(var(--foreground))]",
                  state === "pending" && "border-[hsl(var(--border))] text-[hsl(var(--muted))]"
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : state === "active" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="size-1.5 rounded-full bg-[hsl(var(--border))]" />
                )}
              </span>
              <div className="-mt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    state === "pending"
                      ? "text-[hsl(var(--muted))]"
                      : "text-[hsl(var(--foreground))]"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    state === "pending"
                      ? "text-[hsl(var(--muted))]/70"
                      : "text-[hsl(var(--muted))]"
                  )}
                >
                  {step.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {generating && (
        <p className="mt-6 text-sm text-[hsl(var(--muted))]">
          Scoring modules and assembling your report…
        </p>
      )}
    </div>
  );
}

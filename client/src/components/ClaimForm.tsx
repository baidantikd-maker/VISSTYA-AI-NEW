import type { ClaimContext } from "@/mock/types";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const EVENT_HELPER =
  "State the claim as precisely as you can. More context helps Visstya compare the content against external evidence.";

export function ClaimForm({
  value,
  onChange,
}: {
  value: ClaimContext;
  onChange: (claim: ClaimContext) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="claim-event"
          className={cn("mb-2 block", isDark && "text-base uppercase tracking-wide text-white")}
        >
          What is the claim?
        </Label>
        <textarea
          id="claim-event"
          value={value.event}
          onChange={(e) => onChange({ ...value, event: e.target.value })}
          placeholder="e.g. A video shows a flooded metro station in Mumbai after heavy rain"
          rows={3}
          className={cn(
            "w-full resize-none rounded-md border px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors",
            isDark
              ? "border-dashed border-white/60 bg-white/10 text-white placeholder:text-[hsl(var(--muted))] focus:border-solid focus:border-white shadow-[0_0_10px_rgba(255,255,255,0.25),0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-sm"
              : "border-[#D9DBDF] bg-[hsl(var(--card))] placeholder:text-[hsl(var(--muted))] focus:border-[#5967A0]"
          )}
        />
        <p
          className={cn(
            "mt-1.5 leading-relaxed",
            isDark
              ? "text-[13px] text-[hsl(261_60%_65%)]/50"
              : "text-xs text-[hsl(var(--muted))]"
          )}
        >
          {EVENT_HELPER}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label
            htmlFor="claim-location"
            className={cn("mb-2 block", isDark && "text-base uppercase tracking-wide text-white")}
          >
            Location{" "}
            <span className="normal-case text-[hsl(var(--muted))]">
              (Optional)
            </span>
          </Label>
          <input
            id="claim-location"
            value={value.location ?? ""}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            placeholder="e.g. Dharavi, Mumbai"
            className={cn(
            "h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors",
            isDark
              ? "border-dashed border-white/60 bg-white/10 text-white placeholder:text-[hsl(var(--muted))] focus:border-solid focus:border-white shadow-[0_0_10px_rgba(255,255,255,0.25),0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-sm"
                : "border-[#D9DBDF] bg-[hsl(var(--card))] placeholder:text-[hsl(var(--muted))] focus:border-[#5967A0]"
            )}
          />
        </div>
        <div>
          <Label
            htmlFor="claim-date"
            className={cn("mb-2 block", isDark && "text-base uppercase tracking-wide text-white")}
          >
            When is it claimed to have happened?{" "}
            <span className="normal-case text-[hsl(var(--muted))]">
              (Optional)
            </span>
          </Label>
          <input
            id="claim-date"
            type="date"
            value={value.date ?? ""}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className={cn(
            "h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors",
            isDark
              ? cn(
                  "border-dashed border-white/60 bg-white/10 [&::-webkit-calendar-picker-indicator]:invert focus:border-solid focus:border-white shadow-[0_0_10px_rgba(255,255,255,0.25),0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-sm",
                  value.date ? "text-white" : "text-[hsl(var(--muted))]"
                )
                : "border-[#D9DBDF] bg-[hsl(var(--card))] focus:border-[#5967A0]"
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          isDark
            ? "-ml-4 w-fit rounded-lg bg-[hsl(var(--secondary))/40] px-4 py-3"
            : "card-glow rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))/40] px-4 py-3"
        )}
      >
        <p
          className={cn(
            "leading-relaxed",
            isDark
              ? "text-[13px] text-[hsl(261_60%_65%)]/50"
              : "text-xs text-[hsl(var(--muted))]"
          )}
        >
          Visstya does not decide what is true. It gathers evidence — metadata,
          visual analysis, weather records and dated sources — and shows you how
          well the claim holds up.
        </p>
      </div>
    </div>
  );
}

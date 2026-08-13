import { AppShell } from "@/components/AppShell";
import { MediaPreview } from "@/components/MediaPreview";
import { VerificationProgress } from "@/components/VerificationProgress";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { verifyClaim, type VerifyApiResponse } from "@/lib/api";
import { adaptVerifyResponse } from "@/lib/reportAdapter";
import { PROCESSING_STEPS } from "@/mock/engine";
import { mockStore } from "@/mock/store";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { clearPendingInput, getPendingInput } from "./Verify";

const STEP_MS = 1300;

export default function Processing() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [input] = useState(() => getPendingInput());
  const [stepIndex, setStepIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultRef = useRef<VerifyApiResponse | null>(null);
  const fetchStartedRef = useRef(false);
  const fetchErrorRef = useRef<string | null>(null);
  const fetchDoneRef = useRef(false);

  // Kick off the real backend call once, independent of the step animation.
  useEffect(() => {
    if (!input || fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    verifyClaim(input)
      .then((response) => {
        resultRef.current = response;
      })
      .catch((err) => {
        fetchErrorRef.current =
          err instanceof Error ? err.message : "Verification failed";
      })
      .finally(() => {
        fetchDoneRef.current = true;
      });
  }, [input]);

  useEffect(() => {
    if (!input) {
      setLocation("/verify", { replace: true });
      return;
    }

    if (stepIndex < PROCESSING_STEPS.length) {
      const t = setTimeout(() => setStepIndex((i) => i + 1), STEP_MS);
      return () => clearTimeout(t);
    }

    // Animation finished — wait for the real fetch if it hasn't settled yet.
    setGenerating(true);

    const poll = setInterval(() => {
      if (!fetchDoneRef.current) return;
      clearInterval(poll);

      if (fetchErrorRef.current || !resultRef.current?.report) {
        setError(
          fetchErrorRef.current ??
            "The verification service returned no report."
        );
        return;
      }

      const report = adaptVerifyResponse(input, resultRef.current.report);
      mockStore.create(report);
      clearPendingInput();
      setLocation(`/report/${report.id}`, { replace: true });
    }, 150);

    return () => clearInterval(poll);
  }, [stepIndex, input, setLocation]);

  if (!input) return null;

  if (error) {
    return (
      <AppShell>
        <div className="container max-w-2xl py-16 text-center">
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Verification failed
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[hsl(var(--muted))]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setLocation("/verify")}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-[hsl(261_88%_60%)] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  }

  const done = stepIndex;

  return (
    <AppShell>
      <div className="container max-w-3xl py-10 md:py-16">
        <div className="fade-in text-center">
          <p className={cn("section-label", isDark && "eyebrow-glow")}>
            Analysis in progress
          </p>
          <h1
            className={cn(
              "mt-3 text-balance",
              isDark
                ? "section-title-glow text-4xl md:text-5xl"
                : "text-3xl md:text-4xl"
            )}
          >
            Building your evidence report
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted))]">
            Analyzing multiple evidence signals — metadata, vision, weather and
            dated sources. This usually takes under a minute.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="order-2 md:order-1">
            <MediaPreview media={input.media} size="sm" className="md:aspect-[4/3]" />
            <div className="card-glow mt-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 dark:border dark:border-white/60 dark:bg-transparent dark:shadow-[0_0_4px_rgba(255,255,255,0.2),0_0_10px_rgba(255,255,255,0.08)]">
              <p
                className={cn(
                  "text-xs",
                  isDark
                    ? "font-semibold uppercase tracking-wide text-[hsl(261_88%_60%)]"
                    : "text-[hsl(var(--muted))]"
                )}
              >
                Claim under analysis
              </p>
              <p className="mt-1 text-sm font-medium leading-snug text-[hsl(var(--foreground))]">
                {input.claim.event}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--muted))]">
                {[input.claim.location, input.claim.date].filter(Boolean).join(" · ") || "No context provided"}
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <VerificationProgress doneSteps={done} generating={generating} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
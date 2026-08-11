import { AppShell } from "@/components/AppShell";
import { ClaimForm } from "@/components/ClaimForm";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useTheme } from "@/contexts/ThemeContext";
import { useExifPreview } from "@/hooks/useExifPreview";
import { cn } from "@/lib/utils";
import type { AnalysisInput, ClaimContext, MediaInfo } from "@/mock/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const PENDING_KEY = "vistai.mock.pending";

export function setPendingInput(input: AnalysisInput) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
}

export function getPendingInput(): AnalysisInput | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisInput;
    return parsed.media && parsed.claim ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingInput() {
  sessionStorage.removeItem(PENDING_KEY);
}

export default function Verify() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [step, setStep] = useState<1 | 2>(1);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [claim, setClaim] = useState<ClaimContext>({ event: "" });

  const canProceedToContext = Boolean(media);
  const canAnalyze = canProceedToContext && claim.event.trim().length > 2;

  const exifSourceUrl =
    media?.kind === "image" && media.url ? media.url : undefined;
  const exifQuery = useExifPreview(exifSourceUrl);

  const submit = () => {
    if (!media || !canAnalyze) return;
    setPendingInput({
      media,
      claim: {
        event: claim.event.trim(),
        location: claim.location?.trim() || undefined,
        date: claim.date?.trim() || undefined,
      },
    });
    setLocation("/verify/processing");
  };

  return (
    <AppShell>
      <div className="relative z-10">
          <div className="container max-w-3xl py-10 md:py-16">
            <div className="fade-in text-center">
              <p className="section-label eyebrow-glow">New verification</p>
              <h1 className="section-title-glow mt-3 text-balance text-4xl md:text-5xl">
                Verify a piece of content
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted))]">
                Add the media, then tell us the claim being made about it.
                Visstya will compare it against evidence and show you how well
                it holds up.
              </p>
            </div>

        {/* Step indicator */}
        <div className="mt-8 flex items-center gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isDark
                    ? step >= s
                      ? "border-transparent bg-[hsl(261_88%_60%)] text-white"
                      : "border-white text-white"
                    : step >= s
                      ? "border-transparent bg-[#5967A0] text-white"
                      : "border-[#E4E5E7] text-[#6B6F76]"
                )}
              >
                {s}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isDark
                    ? cn(
                        "font-medium text-[hsl(261_88%_60%)]",
                        step < s && "opacity-80"
                      )
                    : step >= s
                      ? "font-medium text-[#202124]"
                      : "text-[#6B6F76]"
                )}
              >
                {s === 1 ? "Add content" : "Claim context"}
              </span>
              {s === 1 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    isDark
                      ? "bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.7),0_0_12px_rgba(255,255,255,0.35)]"
                      : "bg-[#D9DBDF]"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10">
          {step === 1 ? (
            <div className="scale-in">
              <UploadDropzone value={media} onChange={setMedia} />
              <div className="mt-6 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-sm text-[hsl(var(--foreground))] dark:border-white/40 dark:bg-[rgba(255,255,255,0.04)]">
                <p className="section-label mb-3">EXIF metadata preview</p>
                {!media ? (
                  <p className="text-[hsl(var(--muted))]">Upload an image to inspect EXIF metadata.</p>
                ) : media.kind !== "image" ? (
                  <p className="text-[hsl(var(--muted))]">EXIF preview is only available for images.</p>
                ) : exifQuery.isLoading ? (
                  <p className="text-[hsl(var(--muted))]">Reading EXIF metadata from the image...</p>
                ) : exifQuery.isError ? (
                  <p className="text-[hsl(var(--muted))]">Unable to parse EXIF metadata for this image.</p>
                ) : exifQuery.data ? (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted))]">Source</p>
                    <p className="truncate text-sm text-[hsl(var(--foreground))]">{exifQuery.data.source}</p>
                    {Object.keys(exifQuery.data.tags).length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(exifQuery.data.tags).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="rounded-2xl bg-[hsl(var(--border))/10] p-3 dark:bg-white/5">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--muted))]">{key}</p>
                            <p className="mt-1 text-sm font-medium text-[hsl(var(--foreground))] truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[hsl(var(--muted))]">No EXIF tags were detected on this image.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[hsl(var(--muted))]">EXIF data will appear here when a public image URL is selected.</p>
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={!canProceedToContext}
                  onClick={() => setStep(2)}
                  className={cn(
                    "inline-flex h-11 items-center rounded-md px-6 transition-opacity hover:opacity-90 disabled:pointer-events-none",
                    isDark
                      ? "justify-center bg-[hsl(261_88%_60%)] text-base font-bold text-white disabled:opacity-40"
                      : "gap-2 rounded-lg bg-[#5967A0] text-sm font-medium text-white disabled:bg-[#E9EAEE] disabled:text-[#9AA0A8]"
                  )}
                >
                  Continue
                  {!isDark && <ArrowRight className="size-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="scale-in">
              <ClaimForm value={claim} onChange={setClaim} />
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-[hsl(var(--muted))] transition-colors hover:text-[hsl(var(--foreground))]"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canAnalyze}
                  onClick={submit}
                  className={cn(
                    "inline-flex h-11 items-center rounded-md px-6 transition-opacity hover:opacity-90 disabled:pointer-events-none",
                    isDark
                      ? "justify-center bg-[hsl(261_88%_60%)] text-base font-bold text-white disabled:opacity-40"
                      : "gap-2 rounded-lg bg-[#5967A0] text-sm font-medium text-white disabled:bg-[#E9EAEE] disabled:text-[#9AA0A8]"
                  )}
                >
                  Analyze Evidence
                  {!isDark && <ArrowRight className="size-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </AppShell>
  );
}

import DarkVeil from "@/components/DarkVeil";
import { Logo } from "@/components/Logo";
import { ErrorState } from "@/components/States";
import { TrustReportView } from "@/components/TrustReportView";
import { useTheme } from "@/contexts/ThemeContext";
import { mockStore } from "@/mock/store";
import { useRoute } from "wouter";

export default function Share() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token ? String(params.token) : null;
  const report = token ? mockStore.getByShareToken(token) : undefined;
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen bg-transparent dark:bg-[hsl(var(--background))]">
      {isDark && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          <DarkVeil
            scanlineIntensity={0.58}
            speed={1.1}
            scanlineFrequency={4}
          />
          <div className="absolute inset-0 bg-[hsl(var(--background))/70]" />
        </div>
      )}
      <div className="relative z-10">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/85] backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Logo />
          <span className="text-xs text-[hsl(var(--muted))]">
            Powered by Visstya AI · Evidence-based verification
          </span>
        </div>
      </header>

      <main className="container max-w-5xl py-10 md:py-14">
        {report ? (
          <TrustReportView report={report} isPublic />
        ) : (
          <ErrorState
            title="Shared report not found"
            description="This share link does not match any report. The link may be expired or incorrect."
          />
        )}
      </main>
      </div>
    </div>
  );
}

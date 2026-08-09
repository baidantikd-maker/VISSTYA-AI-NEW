import type { VerificationReport } from "@/mock/types";
import { formatDateTime } from "@/lib/format";
import {
  CalendarDays,
  ClipboardCheck,
  Link2,
  MapPin,
} from "lucide-react";

export function ReportHeader({
  report,
  isPublic = false,
}: {
  report: VerificationReport;
  isPublic?: boolean;
}) {
  return (
    <div className="border-b border-[hsl(var(--border))] pb-8">
      {isPublic && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs text-[hsl(var(--muted))]">
          <Link2 className="size-3.5" />
          Shared verification report
        </p>
      )}
      <p className="section-label dark:font-extrabold dark:text-[hsl(261_88%_60%)]">
        Trust Report
      </p>
      <h1 className="mt-3 max-w-3xl text-balance text-2xl leading-tight text-[hsl(var(--foreground))] md:text-[2rem] dark:text-white dark:[text-shadow:0_0_2px_hsl(270_90%_65%/0.6),0_0_10px_hsl(270_90%_65%/0.35),0_0_20px_hsl(270_90%_65%/0.15)]">
        {report.claim.event}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[hsl(var(--muted))]">
        {report.claim.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {report.claim.location}
          </span>
        )}
        {report.claim.date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {report.claim.date}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <ClipboardCheck className="size-4" />
          Analysed {formatDateTime(report.createdAt)}
        </span>
      </div>
    </div>
  );
}

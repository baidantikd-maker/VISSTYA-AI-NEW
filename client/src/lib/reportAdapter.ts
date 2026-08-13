import type { VerifyApiResponse } from "./api";
import type {
  AnalysisInput,
  Limitation,
  ModuleReport,
  Source,
  StatusBand,
  VerificationReport,
} from "@/mock/types";

function bandToStatus(band: "HIGH" | "MEDIUM" | "LOW"): StatusBand {
  switch (band) {
    case "HIGH":
      return "TRUSTABLE";
    case "MEDIUM":
      return "AVERAGE";
    case "LOW":
      return "FALSE";
  }
}

function adaptModule(
  m: NonNullable<VerifyApiResponse["report"]>["modules"]["metadata"]
): ModuleReport {
  return {
    score: m.score,
    max: m.maxScore,
    summary: m.summary,
    items: m.findings.map((f) => ({
      label: f.label,
      value: f.value,
      tone: f.tone,
    })),
    redFlags: m.warnings.length > 0 ? m.warnings : undefined,
  };
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function adaptSources(evidenceData: Record<string, unknown>): Source[] {
  const rawSources = Array.isArray(evidenceData.sources)
    ? (evidenceData.sources as Array<{
        title: string;
        url: string;
        publisher?: string;
        publishedAt?: string;
        snippet?: string;
        relation: "supporting" | "contradicting" | "inconclusive";
      }>)
    : [];

  return rawSources.map((s, index) => ({
    id: `s${index}`,
    name: s.publisher ?? domainFromUrl(s.url),
    domain: domainFromUrl(s.url),
    headline: s.title,
    publishedAt: s.publishedAt ?? new Date().toISOString(),
    label:
      s.relation === "supporting"
        ? "Supporting"
        : s.relation === "contradicting"
          ? "Contradicting"
          : "Inconclusive",
    snippet: s.snippet ?? "",
    url: s.url,
  }));
}

function adaptLimitations(limitations: string[]): Limitation[] {
  return limitations.map((detail) => ({
    title: "What to know",
    detail,
  }));
}

export function adaptVerifyResponse(
  input: AnalysisInput,
  apiReport: NonNullable<VerifyApiResponse["report"]>
): VerificationReport {
  const now = Date.now();

  return {
    id: now,
    shareToken: Math.random().toString(36).slice(2, 12),
    media: input.media,
    claim: input.claim,
    totalScore: apiReport.scoring.percentage,
    statusBand: bandToStatus(apiReport.verdict),
    summary: apiReport.summary,
    modules: {
      metadata: adaptModule(apiReport.modules.metadata),
      vision: adaptModule(apiReport.modules.vision),
      weather: adaptModule(apiReport.modules.weather),
      evidence: adaptModule(apiReport.modules.evidence),
    },
    sources: adaptSources(
      apiReport.modules.evidence.data as Record<string, unknown>
    ),
    timeline: [
      {
        at: new Date(now).toISOString(),
        label: "Report generated",
        detail: "Trust engine completed analysis",
      },
    ],
    limitations: adaptLimitations(apiReport.limitations),
    createdAt: new Date(now).toISOString(),
  };
}
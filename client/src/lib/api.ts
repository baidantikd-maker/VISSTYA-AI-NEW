import type { AnalysisInput } from "@/mock/types";

interface VerifyApiModuleFinding {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

interface VerifyApiModuleResult {
  score: number;
  maxScore: number;
  summary: string;
  findings: VerifyApiModuleFinding[];
  missing: string[];
  warnings: string[];
  data: Record<string, unknown>;
}

export interface VerifyApiResponse {
  ok: boolean;
  report?: {
    verdict: "HIGH" | "MEDIUM" | "LOW";
    summary: string;
    keyFindings: string[];
    modules: {
      metadata: VerifyApiModuleResult;
      vision: VerifyApiModuleResult;
      weather: VerifyApiModuleResult;
      evidence: VerifyApiModuleResult;
    };
    scoring: {
      totalScore: number;
      maxScore: number;
      percentage: number;
      band: "HIGH" | "MEDIUM" | "LOW";
      missing: string[];
    };
    limitations: string[];
  };
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function verifyClaim(
  input: AnalysisInput
): Promise<VerifyApiResponse> {
  const response = await fetch(`${API_BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media: input.media,
      claim: input.claim,
    }),
  });

  const data = (await response.json()) as VerifyApiResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "Verification request failed");
  }

  return data;
}
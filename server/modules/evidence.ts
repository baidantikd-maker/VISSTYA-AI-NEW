import { env } from "../env.js";
import type {
  ClaimInput,
  ModuleFinding,
  ModuleResult,
} from "../types.js";

/**
 * Evidence verification module
 *
 * Purpose:
 * - Look for independent, dated sources related to the claim.
 * - Determine whether the available evidence supports,
 *   contradicts, or fails to establish the claim.
 *
 * This module deliberately does NOT invent evidence.
 * Until a real evidence/search provider is connected,
 * missing information is reported explicitly.
 */

interface EvidenceSource {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  snippet?: string;
  relation: "supporting" | "contradicting" | "inconclusive";
}

interface EvidenceData {
  query: string;
  sources: EvidenceSource[];
  supportingCount: number;
  contradictingCount: number;
  inconclusiveCount: number;
}

/**
 * Build a search query from the user's claim.
 */
function buildEvidenceQuery(claim: ClaimInput): string {
  const parts = [
    claim.event,
    claim.location,
    claim.date,
  ].filter(Boolean);

  return parts.join(" ");
}

/**
 * Fetch evidence sources from the external provider.
 *
 * IMPORTANT:
 * Missing key or a provider failure both degrade to an
 * empty source list — never throw out of this function.
 */
async function fetchEvidenceSources(
  _query: string
): Promise<EvidenceSource[]> {
  if (!env.evidenceProviderKey) {
    return [];
  }

  try {
    // real provider call goes here once you have the key
    // const results = await callEvidenceAPI(env.evidenceProviderKey, query);
    // return results;
    return [];
  } catch (error) {
    console.error("Evidence provider call failed:", error);
    return [];
  }
}

/**
 * Analyse evidence for a claim.
 *
 * IMPORTANT:
 * The real external evidence API/search provider will be
 * connected inside this function later.
 */
export async function analyzeEvidence(
  claim: ClaimInput
): Promise<ModuleResult> {
  const query = buildEvidenceQuery(claim);

  const findings: ModuleFinding[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  /**
   * -------------------------------------------------------
   * REAL EVIDENCE PROVIDER WILL GO HERE
   * -------------------------------------------------------
   *
   * Example future flow:
   *
   * const sources = await searchEvidence(query);
   *
   * Then classify each source as:
   * - supporting
   * - contradicting
   * - inconclusive
   *
   * We are NOT putting fake sources here.
   */

  const sources: EvidenceSource[] = await fetchEvidenceSources(query);

  /**
   * No real evidence provider has been connected yet.
   */
  if (sources.length === 0) {
    missing.push(
      "Independent dated sources could not be retrieved."
    );

    missing.push(
      "No external reporting is currently available for corroboration."
    );

    warnings.push(
      "Evidence verification is incomplete because the external evidence provider is not connected."
    );

    findings.push({
      label: "Independent sources",
      value: "Not retrieved",
      tone: "neutral",
    });

    findings.push({
      label: "Supporting evidence",
      value: "Not established",
      tone: "neutral",
    });

    findings.push({
      label: "Contradicting evidence",
      value: "Not established",
      tone: "neutral",
    });

    return {
      score: 0,
      maxScore: 35,

      summary:
        "Independent evidence could not yet be retrieved, so the claim cannot be corroborated or contradicted by external sources.",

      findings,

      missing,

      warnings,

      data: {
        query,
        sources,
        supportingCount: 0,
        contradictingCount: 0,
        inconclusiveCount: 0,
      } satisfies EvidenceData,
    };
  }

  /**
   * -------------------------------------------------------
   * Evidence scoring
   * -------------------------------------------------------
   *
   * Once real sources are available:
   *
   * - supporting sources increase the score
   * - contradicting sources decrease the score
   * - inconclusive sources provide context but little score
   */

  const supportingCount = sources.filter(
    (source) => source.relation === "supporting"
  ).length;

  const contradictingCount = sources.filter(
    (source) => source.relation === "contradicting"
  ).length;

  const inconclusiveCount = sources.filter(
    (source) => source.relation === "inconclusive"
  ).length;

  const totalSources = sources.length;

  let score = 0;

  if (totalSources > 0) {
    const supportingWeight = supportingCount * 1;
    const contradictingWeight = contradictingCount * -1;
    const netEvidence = supportingWeight + contradictingWeight;

    /**
     * Convert the evidence balance into a 0–35 score.
     *
     * This is intentionally conservative:
     * a few sources should not automatically produce
     * a near-perfect trust score.
     */
    const normalized =
      (netEvidence + totalSources) /
      (2 * totalSources);

    score = Math.round(normalized * 35);
  }

  /**
   * Findings shown independently in the Evidence box
   * on the frontend.
   */
  findings.push({
    label: "Independent sources",
    value: `${totalSources} retrieved`,
    tone: totalSources > 0 ? "good" : "neutral",
  });

  findings.push({
    label: "Supporting sources",
    value: `${supportingCount}`,
    tone: supportingCount > 0 ? "good" : "neutral",
  });

  findings.push({
    label: "Contradicting sources",
    value: `${contradictingCount}`,
    tone: contradictingCount > 0 ? "bad" : "neutral",
  });

  if (inconclusiveCount > 0) {
    findings.push({
      label: "Inconclusive sources",
      value: `${inconclusiveCount}`,
      tone: "warn",
    });
  }

  /**
   * Missing information is important because display.ts
   * will later use it to create the content-centric summary.
   */
  if (supportingCount === 0) {
    missing.push(
      "No independent source currently confirms the claim."
    );
  }

  if (contradictingCount === 0) {
    missing.push(
      "No independent source currently contradicts the claim."
    );
  }

  /**
   * Final human-readable module summary.
   */
  let summary: string;

  if (contradictingCount > supportingCount) {
    summary =
      "Available evidence contains more contradicting sources than supporting sources.";
  } else if (supportingCount > contradictingCount) {
    summary =
      "Available evidence contains more supporting sources than contradicting sources.";
  } else {
    summary =
      "Available evidence is mixed or inconclusive.";
  }

  return {
    score,
    maxScore: 35,

    summary,

    findings,

    missing,

    warnings,

    data: {
      query,
      sources,
      supportingCount,
      contradictingCount,
      inconclusiveCount,
    } satisfies EvidenceData,
  };
}

export default analyzeEvidence;
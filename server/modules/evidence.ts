import { env } from "../env.js";

const GEMINI_MODEL = "gemini-3.6-flash";

type Stance = "supporting" | "contradicting" | "inconclusive";

/**
 * Classify each source's stance toward the claim using Gemini.
 * Falls back to "inconclusive" for every source on any failure —
 * never throws, never invents a stance it can't justify.
 */
async function classifyStances(
  claim: ClaimInput,
  sources: Array<{ title: string; snippet?: string }>
): Promise<Stance[]> {
  const fallback: Stance[] = sources.map(() => "inconclusive");

  if (!env.visionProviderKey || sources.length === 0) {
    return fallback;
  }

  const sourceList = sources
    .map(
      (s, i) =>
        `[${i}] Title: ${s.title}\nSnippet: ${s.snippet ?? "(no snippet)"}`
    )
    .join("\n\n");

  const prompt = `You are a fact-checking assistant. A claim is being verified: "${claim.event}"${claim.location ? ` (location: ${claim.location})` : ""}${claim.date ? ` (date: ${claim.date})` : ""}.

Below are ${sources.length} search results found while researching this claim. For EACH one, classify whether it SUPPORTS the claim, CONTRADICTS the claim, or is INCONCLUSIVE (off-topic, too vague, or about a different event).

${sourceList}

Respond with ONLY a JSON array of ${sources.length} strings, in order, each one of exactly: "supporting", "contradicting", "inconclusive".`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.visionProviderKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `Stance classification request failed with status ${response.status}`
      );
      return fallback;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallback;

    const parsed = JSON.parse(text) as unknown;

    if (
      !Array.isArray(parsed) ||
      parsed.length !== sources.length ||
      !parsed.every((v) =>
        ["supporting", "contradicting", "inconclusive"].includes(v as string)
      )
    ) {
      console.error("Stance classification response did not match expected shape");
      return fallback;
    }

    return parsed as Stance[];
  } catch (error) {
    console.error("Stance classification failed:", error);
    return fallback;
  }
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

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
/**
 * Fetch evidence sources from Tavily.
 *
 * HONESTY NOTE: Tavily returns relevant results, not a stance
 * classification. Every source is tagged "inconclusive" until real
 * supporting/contradicting classification is built — we don't
 * fabricate a verdict we haven't actually determined.
 */
async function fetchEvidenceSources(
  query: string,
  claim: ClaimInput
): Promise<EvidenceSource[]> {
  if (!env.evidenceProviderKey) {
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.evidenceProviderKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        topic: "news",
        max_results: 6,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily request failed with status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as { results?: TavilyResult[] };
    const results = data.results ?? [];

    if (results.length === 0) {
      return [];
    }

    const draftSources: Omit<EvidenceSource, "relation">[] = results.map(
      (r) => ({
        title: r.title,
        url: r.url,
        publisher: domainFromUrl(r.url),
        publishedAt: r.published_date,
        snippet: r.content,
      })
    );

    const stances = await classifyStances(claim, draftSources);

    return draftSources.map((s, i) => ({
      ...s,
      relation: stances[i] ?? "inconclusive",
    }));
  } catch (error) {
    console.error("Evidence provider call failed:", error);
    return [];
  }
}

/**
 * Analyse evidence for a claim. */
export async function analyzeEvidence(
  claim: ClaimInput
): Promise<ModuleResult> {
  const query = buildEvidenceQuery(claim);

  const findings: ModuleFinding[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  /**

   
   * Then Classify each source as:
   * - supporting
   * - contradicting
   * - inconclusive
   *
  
   */

  const sources: EvidenceSource[] = await fetchEvidenceSources(query, claim);

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
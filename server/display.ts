import type {
  ClaimInput,
  DisplayResult,
  ModuleResults,
  ScoringResult,
  TrustBand,
} from "./types.js";

/**
 * display.ts
 *
 * Converts the raw verification results into the final
 * human-readable report.
 *
 * This file does NOT:
 * - call external APIs
 * - inspect the media
 * - calculate module scores
 *
 * It explains the results produced by the verification
 * modules and scoring engine.
 */

/**
 * Convert the internal trust band into natural language.
 */
function verdictLabel(band: TrustBand): string {
  switch (band) {
    case "HIGH":
      return "strongly supported";

    case "MEDIUM":
      return "partially supported";

    case "LOW":
      return "not sufficiently supported";

    default:
      return "uncertain";
  }
}

/**
 * Collect the strongest findings from all modules.
 *
 * These are used to build a summary around actual evidence,
 * rather than around the numerical score.
 */
function collectImportantFindings(
  modules: ModuleResults
): string[] {
  const findings: string[] = [];

  const allModules = [
    modules.metadata,
    modules.vision,
    modules.weather,
    modules.evidence,
  ];

  for (const module of allModules) {
    for (const finding of module.findings) {
      if (
        finding.tone === "good" ||
        finding.tone === "bad" ||
        finding.tone === "warn"
      ) {
        findings.push(
          `${finding.label}: ${finding.value}`
        );
      }
    }
  }

  return findings;
}

/**
 * Collect warnings from every module.
 */
function collectWarnings(
  modules: ModuleResults
): string[] {
  return Array.from(
    new Set([
      ...modules.metadata.warnings,
      ...modules.vision.warnings,
      ...modules.weather.warnings,
      ...modules.evidence.warnings,
    ])
  );
}

/**
 * Create the main content-centric summary.
 */
function buildSummary(
  claim: ClaimInput,
  modules: ModuleResults,
  scoring: ScoringResult
): string {
  const claimText = claim.event.trim();

  const verdict = verdictLabel(scoring.band);

  const importantFindings =
    collectImportantFindings(modules);

  const missing = scoring.missing;

  const warnings = collectWarnings(modules);

  /**
   * Start with the overall evidence interpretation.
   */
  let summary =
    `The claim that "${claimText}" is ${verdict} based on the evidence currently available.`;

  /**
   * Add the most relevant findings.
   *
   * We deliberately describe findings rather than
   * exposing the score as the main explanation.
   */
  if (importantFindings.length > 0) {
    const selectedFindings =
      importantFindings.slice(0, 4);

    summary +=
      ` Key findings include ${selectedFindings.join(
        "; "
      )}.`;
  }

  /**
   * Explain limitations.
   */
  if (missing.length > 0) {
    const selectedMissing =
      missing.slice(0, 3);

    summary +=
      ` Verification is limited because ${selectedMissing.join(
        "; "
      ).toLowerCase()}.`;
  }

  /**
   * Mention warnings when they materially affect
   * confidence in the result.
   */
  if (warnings.length > 0) {
    const selectedWarnings =
      warnings.slice(0, 2);

    summary +=
      ` Important caveats: ${selectedWarnings.join(
        "; "
      )}.`;
  }

  return summary;
}

/**
 * Build limitations for the final report.
 */
function buildLimitations(
  modules: ModuleResults,
  scoring: ScoringResult
): string[] {
  const limitations = new Set<string>();

  /**
   * Missing information from scoring.
   */
  for (const item of scoring.missing) {
    limitations.add(item);
  }

  /**
   * Module warnings.
   */
  const warnings = collectWarnings(modules);

  for (const warning of warnings) {
    limitations.add(warning);
  }

  /**
   * Generic limitation that prevents the UI from
   * presenting the result as absolute truth.
   */
  limitations.add(
    "The assessment reflects the evidence available to the verification engine and can change if new evidence becomes available."
  );

  return Array.from(limitations);
}

/**
 * Generate the final display result.
 */
export function buildDisplayResult(
  claim: ClaimInput,
  modules: ModuleResults,
  scoring: ScoringResult
): DisplayResult {
  const summary = buildSummary(
    claim,
    modules,
    scoring
  );
  const keyFindings =
    collectImportantFindings(modules).slice(0, 4);

  const limitations =
    buildLimitations(
      modules,
      scoring
    );

  return {
    verdict: scoring.band,

    summary,

    keyFindings,

    modules,

    scoring,

    limitations,
  };
}

export default buildDisplayResult;
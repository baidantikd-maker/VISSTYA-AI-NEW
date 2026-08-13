import type {
  ModuleResults,
  ScoringResult,
  TrustBand,
} from "./types.js";

/**
 * Maximum score contributed by each verification module.
 *
 * These weights represent the importance of each signal
 * in the overall verification assessment.
 */
const MODULE_MAX_SCORES = {
  metadata: 15,
  vision: 25,
  weather: 25,
  evidence: 35,
} as const;

/**
 * Determine the final trust band from the normalized score.
 *
 * HIGH:
 * Strong overall evidence support.
 *
 * MEDIUM:
 * Mixed or incomplete evidence.
 *
 * LOW:
 * Weak evidence or significant contradictions.
 */
function getTrustBand(score: number): TrustBand {
  if (score >= 75) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * Make sure a module score stays inside its
 * allowed range.
 *
 * This protects the scoring engine if a module
 * accidentally returns an invalid score.
 */
function clampScore(score: number, maxScore: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(
    Math.max(score, 0),
    maxScore
  );
}

/**
 * Calculate the combined verification score.
 *
 * This function does NOT:
 * - call APIs
 * - inspect media
 * - search the web
 * - generate the final summary
 *
 * It only combines the results produced by
 * metadata, vision, weather and evidence.
 */
export function calculateScore(
  modules: ModuleResults
): ScoringResult {
  /**
   * -------------------------------------------------------
   * 1. Normalize individual module scores
   * -------------------------------------------------------
   */

  const metadataScore = clampScore( modules.metadata.score,  modules.metadata.maxScore );

  const visionScore = clampScore( modules.vision.score, modules.vision.maxScore);

  const weatherScore = clampScore( modules.weather.score, modules.weather.maxScore);

  const evidenceScore = clampScore( modules.evidence.score, modules.evidence.maxScore);

  /**
   * -------------------------------------------------------
   * 2. Calculate total
   * -------------------------------------------------------
   *
   * Maximum possible:
   *
   * 15 + 25 + 25 + 35 = 100
   */

  const totalScore = metadataScore + visionScore + weatherScore + evidenceScore;

  const maxScore = modules.metadata.maxScore + modules.vision.maxScore + modules.weather.maxScore + modules.evidence.maxScore;

  /**
   * -------------------------------------------------------
   * 3. Calculate normalized percentage
   * -------------------------------------------------------
   *
   * This is technically redundant because the current
   * maximum is 100, but keeping it makes the engine safer
   * if the weights change .
   */

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  /**
   * -------------------------------------------------------
   * 4. Determine final trust band
   * -------------------------------------------------------
   */

  const band = getTrustBand(percentage);

  /**
   * -------------------------------------------------------
   * 5. Combine missing information
   * -------------------------------------------------------
   *
   * Each module independently reports what it could not
   * establish.
   *
   * display.ts will later use this collection to explain
   * why the result is limited or uncertain.
   */

  const missing = Array.from(
    new Set([
      ...modules.metadata.missing,
      ...modules.vision.missing,
      ...modules.weather.missing,
      ...modules.evidence.missing,
    ])
  );

  /**
   * -------------------------------------------------------
   * 6. Return the complete scoring result
   * -------------------------------------------------------
   */

  return {
    totalScore,
    maxScore,
    percentage,
    band,

    moduleScores: {
      metadata: metadataScore,
      vision: visionScore,
      weather: weatherScore,
      evidence: evidenceScore,
    },

    missing,
  };
}

export default calculateScore;
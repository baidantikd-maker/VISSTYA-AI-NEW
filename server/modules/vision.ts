import { env } from "../env.js";
import type {
  ClaimInput,
  MediaInput,
  ModuleResult,
} from "../types.js";

/**
 * Vision verification module.
 *
 * Responsibility:
 * - Analyze what is visually present in the media.
 * - Compare visual observations with the user's claim.
 * - Identify visual inconsistencies or uncertainty.
 * - Return findings, missing information and a module score.
 *
 * The final truth verdict is NOT decided here.
 */

interface VisionObservation {
  sceneDescription: string;
  claimConsistency: "consistent" | "inconsistent" | "uncertain";
  manipulationIndicators: string[];
  generationIndicators: string[];
  visualCues: string[];
  confidence: number;
}

/**
 * Gemini/provider boundary.
 *
 * We keep the actual AI provider isolated here.
 * When the Gemini API is connected, this function
 * will send the media + claim to the model and return
 * structured observations.
 *
 * For now it returns null rather than pretending
 * that an AI analysis happened.
 */
async function analyzeWithVisionProvider(
  media: MediaInput,
  claim: ClaimInput
): Promise<VisionObservation | null> {
  if (!env.visionProviderKey) {
    // No key configured — stay in stub mode, don't throw.
    return null;
  }

  try {
    // real provider call goes here once you have the key
    // const result = await callVisionAPI(env.visionProviderKey, media, claim);
    // return result;
    return null;
  } catch (error) {
    console.error("Vision provider call failed:", error);
    // Swallow the error — degrade to stub mode, never let a
    // provider outage crash /api/verify.
    return null;
  }
}

/**
 * Main vision analysis function.
 */
export async function analyzeVision(
  media: MediaInput,
  claim: ClaimInput
): Promise<ModuleResult> {
  const findings: ModuleResult["findings"] = [];
  const missing: string[] = [];
  const warnings: string[] = [];

  /**
   * Basic media validation.
   */
  if (!media.url) {
    missing.push(
      "Accessible media payload for visual analysis"
    );
  }

  if (media.kind !== "image") {
    missing.push(
      "Image-based visual analysis; video analysis is not implemented yet"
    );
  }

  /**
   * Ask the vision provider for observations.
   *
   * Currently this returns null because Gemini
   * has not been connected yet.
   */
  const observation = await analyzeWithVisionProvider(
    media,
    claim
  );

  /**
   * No provider result yet.
   *
   * This is intentionally represented as
   * "not analyzed" rather than "false".
   */
  if (!observation) {
    findings.push({
      label: "Scene analysis",
      value: "Vision analysis not yet connected",
      tone: "warn",
    });

    findings.push({
      label: "Claim consistency",
      value: "Undetermined",
      tone: "neutral",
    });

    findings.push({
      label: "Manipulation indicators",
      value: "Undetermined",
      tone: "neutral",
    });

    findings.push({
      label: "AI-generation indicators",
      value: "Undetermined",
      tone: "neutral",
    });

    missing.push(
      "AI-assisted visual scene analysis"
    );

    missing.push(
      "Visual comparison between the media and the claim"
    );

    missing.push(
      "Reliable manipulation/artifact assessment"
    );

    warnings.push(
      "Vision provider is not connected yet"
    );

    /**
     * Since the visual evidence has not actually
     * been analyzed, give it zero verified points.
     *
     * This prevents the system from treating
     * missing analysis as positive evidence.
     */
    return {
      score: 0,
      maxScore: 25,
      summary:
        "Visual evidence could not yet be assessed because the vision analysis provider is not connected.",
      findings,
      missing,
      warnings,
      data: {
        analyzed: false,
        provider: "not-connected",
        mediaKind: media.kind,
        claim: claim.event,
      },
    };
  }

  /**
   * If the provider returns a real observation,
   * convert it into structured findings.
   */

  findings.push({
    label: "Scene description",
    value: observation.sceneDescription,
    tone: "neutral",
  });

  /**
   * Claim consistency.
   */
  if (observation.claimConsistency === "consistent") {
    findings.push({
      label: "Claim consistency",
      value: "Visually consistent with the claim",
      tone: "good",
    });
  } else if (
    observation.claimConsistency === "inconsistent"
  ) {
    findings.push({
      label: "Claim consistency",
      value: "Visual details conflict with the claim",
      tone: "bad",
    });
  } else {
    findings.push({
      label: "Claim consistency",
      value: "Cannot be determined confidently",
      tone: "warn",
    });

    missing.push(
      "Clear visual evidence connecting the media to the claim"
    );
  }

  /**
   * Manipulation indicators.
   */
  if (observation.manipulationIndicators.length === 0) {
    findings.push({
      label: "Manipulation indicators",
      value: "No obvious indicators detected",
      tone: "good",
    });
  } else {
    findings.push({
      label: "Manipulation indicators",
      value:
        observation.manipulationIndicators.join("; "),
      tone: "warn",
    });

    warnings.push(
      ...observation.manipulationIndicators
    );
  }

  /**
   * AI-generation indicators.
   */
  if (observation.generationIndicators.length === 0) {
    findings.push({
      label: "AI-generation indicators",
      value: "No obvious indicators detected",
      tone: "good",
    });
  } else {
    findings.push({
      label: "AI-generation indicators",
      value:
        observation.generationIndicators.join("; "),
      tone: "warn",
    });

    warnings.push(
      ...observation.generationIndicators
    );
  }

  /**
   * Additional visual cues.
   */
  if (observation.visualCues.length > 0) {
    findings.push({
      label: "Visual cues",
      value: observation.visualCues.join("; "),
      tone: "neutral",
    });
  } else {
    missing.push(
      "Additional visual cues useful for independent verification"
    );
  }

  /**
   * Score the visual analysis.
   *
   * Maximum = 25.
   *
   * This is deliberately simple for now.
   * Once Gemini is connected, we can define
   * more rigorous scoring rules based on
   * structured observations.
   */
  let score = 0;

  /**
   * Strong claim consistency.
   */
  if (observation.claimConsistency === "consistent") {
    score += 10;
  }

  /**
   * No manipulation indicators.
   */
  if (
    observation.manipulationIndicators.length === 0
  ) {
    score += 5;
  }

  /**
   * No obvious AI-generation indicators.
   */
  if (
    observation.generationIndicators.length === 0
  ) {
    score += 5;
  }

  /**
   * Confidence contribution.
   */
  if (observation.confidence >= 0.8) {
    score += 5;
  } else if (observation.confidence >= 0.6) {
    score += 3;
  } else if (observation.confidence >= 0.4) {
    score += 1;
  }

  score = Math.min(score, 25);

  /**
   * Generate a module-level summary.
   */
  let summary: string;

  if (score >= 20) {
    summary =
      "Visual analysis strongly supports consistency between the media and the claim.";
  } else if (score >= 12) {
    summary =
      "Visual analysis provides some support, but important visual uncertainties remain.";
  } else {
    summary =
      "Visual analysis found limited support or inconsistencies with the claim.";
  }

  return {
    score,
    maxScore: 25,
    summary,
    findings,
    missing,
    warnings,
    data: {
      analyzed: true,
      provider: "vision-provider",
      observation,
    },
  };
}
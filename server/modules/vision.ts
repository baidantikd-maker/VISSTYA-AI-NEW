import { env } from "../env.js";


const GEMINI_MODEL = "gemini-3.6-flash";

interface ImageData {
  mimeType: string;
  base64: string;
}
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
 * Extract base64 image bytes + MIME type from a MediaInput.
 *
 * Supports data: URLs (base64 already embedded — what the client
 * currently sends) and http(s) URLs (fetched and encoded server-side).
 * Returns null for anything else (e.g. a browser-local blob: URL,
 * which the server cannot read).
 */
async function getImageData(media: MediaInput): Promise<ImageData | null> {
  if (!media.url) return null;

  if (media.url.startsWith("data:")) {
    const match = media.url.match(/^data:([^;,]+)(?:;[^,]*)?,(.*)$/s);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
  }

  if (/^https?:\/\//i.test(media.url)) {
    try {
      const response = await fetch(media.url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType =
        response.headers.get("content-type") ?? media.mimeType ?? "image/jpeg";
      return { mimeType, base64 };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Call Gemini to analyze the image against the claim.
 * Returns null on any failure — never throws out of this function.
 */
async function callGeminiVision(
  imageData: ImageData,
  claim: ClaimInput
): Promise<VisionObservation | null> {
  const prompt = `You are analyzing an image for a misinformation-verification system.

Claim being made about this image: "${claim.event}"
Claimed location: ${claim.location ?? "not specified"}
Claimed date: ${claim.date ?? "not specified"}

Analyze the image and respond with ONLY a JSON object (no other text) with these exact fields:
- sceneDescription: string — one or two sentences describing what is visible
- claimConsistency: "consistent" | "inconsistent" | "uncertain" — whether the image plausibly matches the claim
- manipulationIndicators: string[] — specific signs of digital editing/manipulation; empty array if none found
- generationIndicators: string[] — specific signs the image may be AI-generated; empty array if none found
- visualCues: string[] — other visual details relevant to verification
- confidence: number — your confidence in this assessment, between 0 and 1`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.visionProviderKey ?? "",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: imageData.mimeType,
                  data: imageData.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    console.error(`Gemini vision request failed with status ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as Partial<VisionObservation>;

    if (
      typeof parsed.sceneDescription !== "string" ||
      !["consistent", "inconsistent", "uncertain"].includes(
        parsed.claimConsistency as string
      ) ||
      !Array.isArray(parsed.manipulationIndicators) ||
      !Array.isArray(parsed.generationIndicators) ||
      !Array.isArray(parsed.visualCues) ||
      typeof parsed.confidence !== "number"
    ) {
      console.error("Gemini vision response did not match expected shape");
      return null;
    }

    return parsed as VisionObservation;
  } catch (error) {
    console.error("Failed to parse Gemini vision response:", error);
    return null;
  }
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
    return null;
  }

  try {
    const imageData = await getImageData(media);
    if (!imageData) return null;

    return await callGeminiVision(imageData, claim);
  } catch (error) {
    console.error("Vision provider call failed:", error);
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
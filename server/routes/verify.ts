import { Router } from "express";

import type {
  ClaimInput,
  MediaInput,
  VerificationRequest,
} from "../types.js";

import { analyzeMetadata } from "../modules/metadata.js";
import { analyzeVision } from "../modules/vision.js";
import analyzeWeather from "../modules/weather.js";
import analyzeEvidence from "../modules/evidence.js";

import { calculateScore } from "../scoring.js";
import { buildDisplayResult } from "../display.js";

const router = Router();

/**
 * POST /api/verify
 *
 * Main verification pipeline.
 *
 * Flow:
 *
 * Request
 *   ↓
 * Metadata
 *   ↓
 * Vision
 *   ↓
 * Weather
 *   ↓
 * Evidence
 *   ↓
 * Scoring
 *   ↓
 * Display
 *   ↓
 * Final report
 */
router.post("/", async (req, res) => {
  try {
    const { media, claim } =
      req.body as Partial<VerificationRequest>;

    /**
     * 1. Validate media
     */
    if (!media) {
      return res.status(400).json({
        ok: false,
        error: "Media is required",
      });
    }

    /**
     * 2. Validate claim
     */
    if (!claim) {
      return res.status(400).json({
        ok: false,
        error: "Claim information is required",
      });
    }

    /**
     * 3. Validate event
     */
    if (
      !claim.event ||
      typeof claim.event !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Claim event is required",
      });
    }

    /**
     * Convert validated request into the types
     * expected by the verification modules.
     */
    const mediaInput = media as MediaInput;
    const claimInput = claim as ClaimInput;

    /**
     * 4. Run all four modules.
     *
     * They are independent, so they can run
     * concurrently.
     */
    const [
      metadata,
      vision,
      weather,
      evidence,
    ] = await Promise.all([
      analyzeMetadata(mediaInput, claimInput),
      analyzeVision(mediaInput, claimInput),
      analyzeWeather(claimInput),
      analyzeEvidence(claimInput),
    ]);

    /**
     * 5. Collect module results.
     */
    const modules = {
      metadata,
      vision,
      weather,
      evidence,
    };

    /**
     * 6. Calculate the overall score.
     *
     * scoring.ts only combines module results.
     */
    const scoring = calculateScore(modules);

    /**
     * 7. Build the final human-readable report.
     *
     * display.ts creates the content-centric summary
     * and preserves the individual module information.
     */
    const report = buildDisplayResult(
      claimInput,
      modules,
      scoring
    );

    /**
     * 8. Send the final report to the frontend.
     */
    return res.status(200).json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error(
      "Verification pipeline error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Verification pipeline failed",
    });
  }
});

export default router;
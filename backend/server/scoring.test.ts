import { describe, expect, it } from "vitest";
import {
  calculateTotalScore,
  clamp,
  normalizeModuleScore,
  scoreToBand,
  BAND_THRESHOLDS,
  MODULE_WEIGHTS,
  TOTAL_MAX_SCORE,
} from "../shared/scoring";

const MAX = TOTAL_MAX_SCORE;

describe("clamp", () => {
  it("bounds values to the inclusive min/max", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe("normalizeModuleScore", () => {
  it("clamps each module score into its weight range", () => {
    expect(normalizeModuleScore(99, "metadata")).toBe(MODULE_WEIGHTS.metadata);
    expect(normalizeModuleScore(-3, "vision")).toBe(0);
    expect(normalizeModuleScore(10, "weather")).toBe(10);
  });
});

describe("calculateTotalScore", () => {
  const emptyModules = {
    metadata: { score: 0, maxScore: MODULE_WEIGHTS.metadata },
    vision: { score: 0, maxScore: MODULE_WEIGHTS.vision },
    weather: { score: 0, maxScore: MODULE_WEIGHTS.weather },
    evidence: { score: 0, maxScore: MODULE_WEIGHTS.evidence },
  };

  it("sums normalized module scores", () => {
    const result = calculateTotalScore({
      metadata: { score: 10, maxScore: MODULE_WEIGHTS.metadata },
      vision: { score: 20, maxScore: MODULE_WEIGHTS.vision },
      weather: { score: 20, maxScore: MODULE_WEIGHTS.weather },
      evidence: { score: 30, maxScore: MODULE_WEIGHTS.evidence },
    });
    expect(result).toBe(80);
  });

  it("never exceeds the total maximum", () => {
    const result = calculateTotalScore({
      metadata: { score: 15, maxScore: MODULE_WEIGHTS.metadata },
      vision: { score: 25, maxScore: MODULE_WEIGHTS.vision },
      weather: { score: 25, maxScore: MODULE_WEIGHTS.weather },
      evidence: { score: 35, maxScore: MODULE_WEIGHTS.evidence },
    });
    expect(result).toBe(MAX);
  });

  it("clamps negative module scores to zero", () => {
    const result = calculateTotalScore({
      ...emptyModules,
      vision: { score: -10, maxScore: MODULE_WEIGHTS.vision },
    });
    expect(result).toBe(0);
  });
});

describe("scoreToBand", () => {
  it("maps the FALSE band below the threshold", () => {
    expect(scoreToBand(0)).toBe("FALSE");
    expect(scoreToBand(BAND_THRESHOLDS.FALSE_MAX - 1)).toBe("FALSE");
  });

  it("maps the AVERAGE band between thresholds (inclusive)", () => {
    expect(scoreToBand(BAND_THRESHOLDS.AVERAGE_MIN)).toBe("AVERAGE");
    expect(scoreToBand(BAND_THRESHOLDS.AVERAGE_MAX - 1)).toBe("AVERAGE");
  });

  it("maps the TRUSTABLE band at and above its threshold", () => {
    expect(scoreToBand(BAND_THRESHOLDS.TRUSTABLE_MIN)).toBe("TRUSTABLE");
    expect(scoreToBand(MAX)).toBe("TRUSTABLE");
  });

  it("tolerates out-of-range inputs", () => {
    expect(scoreToBand(-100)).toBe("FALSE");
    expect(scoreToBand(10_000)).toBe("TRUSTABLE");
  });
});

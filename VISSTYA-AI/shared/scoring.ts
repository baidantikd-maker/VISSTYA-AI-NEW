export type StatusBand = "FALSE" | "AVERAGE" | "TRUSTABLE";

export const MODULE_WEIGHTS = {
  metadata: 15,
  vision: 25,
  weather: 25,
  evidence: 35,
} as const;

export const TOTAL_MAX_SCORE =
  MODULE_WEIGHTS.metadata +
  MODULE_WEIGHTS.vision +
  MODULE_WEIGHTS.weather +
  MODULE_WEIGHTS.evidence;

export const BAND_THRESHOLDS = {
  FALSE_MAX: 40,
  AVERAGE_MIN: 40,
  AVERAGE_MAX: 80,
  TRUSTABLE_MIN: 80,
} as const;

export const SCALE_SEGMENTS: Array<{
  from: number;
  to: number;
  band: StatusBand;
}> = [
  { from: 0, to: BAND_THRESHOLDS.FALSE_MAX, band: "FALSE" },
  {
    from: BAND_THRESHOLDS.AVERAGE_MIN,
    to: BAND_THRESHOLDS.AVERAGE_MAX,
    band: "AVERAGE",
  },
  { from: BAND_THRESHOLDS.TRUSTABLE_MIN, to: 100, band: "TRUSTABLE" },
];

export interface ModuleScoreResult {
  score: number;
  maxScore: number;
}

export interface ModuleScores {
  metadata: ModuleScoreResult;
  vision: ModuleScoreResult;
  weather: ModuleScoreResult;
  evidence: ModuleScoreResult;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeModuleScore(
  rawScore: number,
  moduleKey: keyof typeof MODULE_WEIGHTS
): number {
  const max = MODULE_WEIGHTS[moduleKey];
  return clamp(rawScore, 0, max);
}

export function calculateTotalScore(modules: ModuleScores): number {
  const normalized = [
    normalizeModuleScore(modules.metadata.score, "metadata"),
    normalizeModuleScore(modules.vision.score, "vision"),
    normalizeModuleScore(modules.weather.score, "weather"),
    normalizeModuleScore(modules.evidence.score, "evidence"),
  ];
  const sum = normalized.reduce((acc, s) => acc + s, 0);
  return clamp(sum, 0, TOTAL_MAX_SCORE);
}

export function scoreToBand(score: number): StatusBand {
  const clamped = clamp(score, 0, TOTAL_MAX_SCORE);
  if (clamped >= BAND_THRESHOLDS.TRUSTABLE_MIN) return "TRUSTABLE";
  if (clamped >= BAND_THRESHOLDS.AVERAGE_MIN) return "AVERAGE";
  return "FALSE";
}

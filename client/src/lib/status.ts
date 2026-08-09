import type { StatusBand } from "@/mock/types";

export interface StatusMeta {
  band: StatusBand;
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
  barClass: string;
}

export const STATUS_META: Record<StatusBand, StatusMeta> = {
  FALSE: {
    band: "FALSE",
    label: "LOW CONFIDENCE",
    textClass: "text-false",
    bgClass: "bg-false",
    borderClass: "border-false",
    dotClass: "bg-false",
    barClass: "bg-false",
  },
  AVERAGE: {
    band: "AVERAGE",
    label: "AVERAGE",
    textClass: "text-average",
    bgClass: "bg-average",
    borderClass: "border-average",
    dotClass: "bg-average",
    barClass: "bg-average",
  },
  TRUSTABLE: {
    band: "TRUSTABLE",
    label: "TRUSTABLE",
    textClass: "text-trustable",
    bgClass: "bg-trustable",
    borderClass: "border-trustable",
    dotClass: "bg-trustable",
    barClass: "bg-trustable",
  },
};

export function scoreToBand(score: number): StatusBand {
  if (score >= 80) return "TRUSTABLE";
  if (score >= 40) return "AVERAGE";
  return "FALSE";
}

export function bandFromMeta(meta: StatusMeta): StatusBand {
  return meta.band;
}

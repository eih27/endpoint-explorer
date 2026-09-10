import type { StudyConfig, VisitDef } from "./types";

export const VISITS: VisitDef[] = [
  { key: "bl", label: "Baseline", short: "BL", week: 0 },
  { key: "w1", label: "Week 1", short: "W1", week: 1 },
  { key: "w2", label: "Week 2", short: "W2", week: 2 },
  { key: "w4", label: "Week 4", short: "W4", week: 4 },
  { key: "w6", label: "Week 6", short: "W6", week: 6 },
  { key: "w8", label: "Week 8", short: "W8", week: 8 },
];

/** Post-baseline visits, in order. */
export const POST_VISITS = VISITS.slice(1);

// Fractional change vectors are indexed to POST_VISITS: [w1, w2, w4, w6, w8].
// Negative numbers mean symptom scores went down (improved).

export const STUDIES: StudyConfig[] = [
  {
    id: "aurora-201",
    code: "AURORA-201",
    indication: "Major Depressive Disorder",
    scaleName: "Montgomery–Åsberg Depression Rating Scale",
    scaleAcronym: "MADRS",
    scaleRange: [0, 60],
    targetN: 132,
    seed: "aurora-201-v1",
    baseline: { mean: 31.4, sd: 4.6 },
    treatmentAllocation: 0.5,
    dropoutHazard: [0.012, 0.022, 0.04, 0.05, 0.055],
    placeboDropoutMultiplier: 1.22,
    variabilityBreakWeek: 4,
    variabilityInflation: 1.4,
    arms: {
      treatment: {
        meanFractionalChange: [-0.06, -0.13, -0.27, -0.38, -0.47],
        noiseFraction: 0.11,
      },
      placebo: {
        meanFractionalChange: [-0.05, -0.12, -0.19, -0.24, -0.29],
        noiseFraction: 0.12,
      },
    },
  },
  {
    id: "calm-102",
    code: "CALM-102",
    indication: "Generalized Anxiety Disorder",
    scaleName: "Hamilton Anxiety Rating Scale",
    scaleAcronym: "HAM-A",
    scaleRange: [0, 56],
    targetN: 118,
    seed: "calm-102-v1",
    baseline: { mean: 25.8, sd: 3.9 },
    treatmentAllocation: 0.5,
    dropoutHazard: [0.008, 0.014, 0.02, 0.026, 0.03],
    placeboDropoutMultiplier: 1.15,
    variabilityBreakWeek: 4,
    variabilityInflation: 1.32,
    arms: {
      treatment: {
        meanFractionalChange: [-0.09, -0.17, -0.28, -0.35, -0.4],
        noiseFraction: 0.11,
      },
      placebo: {
        meanFractionalChange: [-0.08, -0.16, -0.22, -0.27, -0.31],
        noiseFraction: 0.12,
      },
    },
  },
  {
    id: "focus-301",
    code: "FOCUS-301",
    indication: "Attention-Deficit / Hyperactivity Disorder",
    scaleName: "ADHD Rating Scale-5 (investigator-rated)",
    scaleAcronym: "ADHD-RS-5",
    scaleRange: [0, 54],
    targetN: 126,
    seed: "focus-301-v1",
    baseline: { mean: 38.2, sd: 5.1 },
    treatmentAllocation: 0.52,
    dropoutHazard: [0.012, 0.018, 0.028, 0.034, 0.042],
    placeboDropoutMultiplier: 1.2,
    variabilityBreakWeek: 4,
    variabilityInflation: 1.45,
    arms: {
      treatment: {
        meanFractionalChange: [-0.08, -0.16, -0.31, -0.4, -0.5],
        noiseFraction: 0.12,
      },
      placebo: {
        meanFractionalChange: [-0.04, -0.08, -0.12, -0.15, -0.18],
        noiseFraction: 0.13,
      },
    },
  },
];

export function getStudyConfig(id: string): StudyConfig {
  return STUDIES.find((s) => s.id === id) ?? STUDIES[0];
}

export const SITES = ["Site 01", "Site 02", "Site 03", "Site 04", "Site 05", "Site 06"];

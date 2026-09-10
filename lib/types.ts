export type Arm = "treatment" | "placebo";

export type ParticipantStatus = "completed" | "discontinued";

export interface VisitDef {
  /** Machine key, e.g. "w4". */
  key: string;
  /** Display label, e.g. "Week 4". */
  label: string;
  /** Short label for dense axes, e.g. "W4". */
  short: string;
  /** Weeks since baseline (baseline = 0). */
  week: number;
}

export interface StudyConfig {
  id: string;
  code: string;
  indication: string;
  /** Outcome scale metadata. Higher score = more symptom burden for all demo scales. */
  scaleName: string;
  scaleAcronym: string;
  scaleRange: [number, number];
  /** Roughly how many participants to synthesize. */
  targetN: number;
  seed: string;
  baseline: { mean: number; sd: number };
  /** Fraction of enrolled assigned to treatment. */
  treatmentAllocation: number;
  /** Per-visit multiplicative dropout hazard, indexed by visit (baseline excluded). */
  dropoutHazard: number[];
  /** Extra hazard multiplier applied to the placebo arm (1 = no difference). */
  placeboDropoutMultiplier: number;
  arms: Record<Arm, ArmTrajectory>;
  /** SD inflation applied to visit noise for weeks strictly after this week. */
  variabilityBreakWeek: number;
  variabilityInflation: number;
}

export interface ArmTrajectory {
  /**
   * Expected change from baseline at each visit (baseline excluded), as a
   * fraction of baseline score. Negative = improvement.
   */
  meanFractionalChange: number[];
  /** Per-visit residual SD as a fraction of baseline score. */
  noiseFraction: number;
}

export interface Participant {
  id: string;
  studyId: string;
  arm: Arm;
  site: string;
  baseline: number;
  /** Observed score at each visit key; null = missed visit / discontinued. */
  scores: Record<string, number | null>;
  visitsCompleted: number;
  status: ParticipantStatus;
  /** Last visit key with an observed score. */
  lastVisitKey: string;
}

export interface Study {
  config: StudyConfig;
  visits: VisitDef[];
  participants: Participant[];
}

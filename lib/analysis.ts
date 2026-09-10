import type { Arm, Participant, Study, VisitDef } from "./types";

// ---------------------------------------------------------------------------
// Small statistical helpers. Everything here is deterministic and descriptive;
// no inference, no p-values, no significance testing.
// ---------------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function sem(xs: number[]): number {
  if (xs.length < 2) return 0;
  return sd(xs) / Math.sqrt(xs.length);
}

export function round(x: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

function observedAt(p: Participant, key: string): number | null {
  const v = p.scores[key];
  return typeof v === "number" ? v : null;
}

// ---------------------------------------------------------------------------
// Per-visit, per-arm aggregates
// ---------------------------------------------------------------------------

export interface VisitArmStat {
  visitKey: string;
  visitLabel: string;
  week: number;
  arm: Arm;
  n: number;
  meanScore: number;
  sdScore: number;
  semScore: number;
  meanChange: number; // vs each participant's own baseline
  sdChange: number;
  semChange: number;
  meanPctChange: number; // percent of baseline
}

export interface TrajectoryPoint {
  visitKey: string;
  visitLabel: string;
  short: string;
  week: number;
  treatmentMean: number;
  treatmentChange: number;
  treatmentPct: number;
  treatmentN: number;
  treatmentLow: number; // mean - 1.96 SEM (score)
  treatmentHigh: number;
  treatmentChangeLow: number;
  treatmentChangeHigh: number;
  placeboMean: number;
  placeboChange: number;
  placeboPct: number;
  placeboN: number;
  placeboLow: number;
  placeboHigh: number;
  placeboChangeLow: number;
  placeboChangeHigh: number;
}

export function visitArmStats(study: Study): VisitArmStat[] {
  const out: VisitArmStat[] = [];
  for (const visit of study.visits) {
    for (const arm of ["treatment", "placebo"] as Arm[]) {
      const rows = study.participants.filter((p) => p.arm === arm);
      const scores: number[] = [];
      const changes: number[] = [];
      const pcts: number[] = [];
      for (const p of rows) {
        const s = observedAt(p, visit.key);
        if (s === null) continue;
        scores.push(s);
        changes.push(s - p.baseline);
        if (p.baseline !== 0) pcts.push(((s - p.baseline) / p.baseline) * 100);
      }
      out.push({
        visitKey: visit.key,
        visitLabel: visit.label,
        week: visit.week,
        arm,
        n: scores.length,
        meanScore: round(mean(scores), 2),
        sdScore: round(sd(scores), 2),
        semScore: round(sem(scores), 3),
        meanChange: round(mean(changes), 2),
        sdChange: round(sd(changes), 2),
        semChange: round(sem(changes), 3),
        meanPctChange: round(mean(pcts), 2),
      });
    }
  }
  return out;
}

export function trajectory(study: Study): TrajectoryPoint[] {
  const stats = visitArmStats(study);
  const byKey = (key: string, arm: Arm) =>
    stats.find((s) => s.visitKey === key && s.arm === arm)!;

  return study.visits.map((visit) => {
    const t = byKey(visit.key, "treatment");
    const p = byKey(visit.key, "placebo");
    const z = 1.96;
    return {
      visitKey: visit.key,
      visitLabel: visit.label,
      short: visit.short,
      week: visit.week,
      treatmentMean: t.meanScore,
      treatmentChange: t.meanChange,
      treatmentPct: t.meanPctChange,
      treatmentN: t.n,
      treatmentLow: round(t.meanScore - z * t.semScore, 2),
      treatmentHigh: round(t.meanScore + z * t.semScore, 2),
      treatmentChangeLow: round(t.meanChange - z * t.semChange, 2),
      treatmentChangeHigh: round(t.meanChange + z * t.semChange, 2),
      placeboMean: p.meanScore,
      placeboChange: p.meanChange,
      placeboPct: p.meanPctChange,
      placeboN: p.n,
      placeboLow: round(p.meanScore - z * p.semScore, 2),
      placeboHigh: round(p.meanScore + z * p.semScore, 2),
      placeboChangeLow: round(p.meanChange - z * p.semChange, 2),
      placeboChangeHigh: round(p.meanChange + z * p.semChange, 2),
    };
  });
}

// ---------------------------------------------------------------------------
// Top-level study summary
// ---------------------------------------------------------------------------

export interface StudySummary {
  enrolled: number;
  treatmentN: number;
  placeboN: number;
  completionRate: number; // fraction completing Week 8
  meanBaseline: number;
  meanChangeTreatment: number;
  meanChangePlacebo: number;
  diffAtWeek8: number; // treatment change minus placebo change (negative favors treatment)
}

export function studySummary(study: Study): StudySummary {
  const last = study.visits[study.visits.length - 1].key;
  const stats = visitArmStats(study);
  const tLast = stats.find((s) => s.visitKey === last && s.arm === "treatment")!;
  const pLast = stats.find((s) => s.visitKey === last && s.arm === "placebo")!;
  const enrolled = study.participants.length;
  const completed = study.participants.filter(
    (p) => typeof p.scores[last] === "number",
  ).length;

  return {
    enrolled,
    treatmentN: study.participants.filter((p) => p.arm === "treatment").length,
    placeboN: study.participants.filter((p) => p.arm === "placebo").length,
    completionRate: round(completed / enrolled, 3),
    meanBaseline: round(mean(study.participants.map((p) => p.baseline)), 1),
    meanChangeTreatment: tLast.meanChange,
    meanChangePlacebo: pLast.meanChange,
    diffAtWeek8: round(tLast.meanChange - pLast.meanChange, 2),
  };
}

// ---------------------------------------------------------------------------
// Endpoint health signals — deterministic observations, templated language.
// ---------------------------------------------------------------------------

export interface HealthSignal {
  id: "separation" | "placebo" | "missingness" | "variability";
  title: string;
  observation: string;
  metricLabel: string;
  metricValue: string;
  tone: "neutral" | "watch";
}

export function healthSignals(study: Study): HealthSignal[] {
  const traj = trajectory(study);

  // A. Separation: first post-baseline visit where treatment change is at least
  //    1.5 points better than placebo, provided the gap does not later close.
  const gaps = traj
    .filter((t) => t.week > 0)
    .map((t) => ({ week: t.week, label: t.visitLabel, gap: round(t.placeboChange - t.treatmentChange, 2) }));
  const week8Gap = gaps[gaps.length - 1]?.gap ?? 0;
  let separationWeek: string | null = null;
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i].gap >= 1.5) {
      const staysOpen = gaps.slice(i).every((g) => g.gap >= gaps[i].gap - 1.0);
      if (staysOpen) {
        separationWeek = gaps[i].label;
        break;
      }
    }
  }
  const separation: HealthSignal = {
    id: "separation",
    title: "Treatment–placebo separation",
    observation: separationWeek
      ? `Mean change first separates by ≥1.5 points around ${separationWeek}, widening to ${Math.abs(
          week8Gap,
        ).toFixed(1)} points by Week 8.`
      : `Mean change stays within ~1.5 points between arms through Week 8 (${Math.abs(
          week8Gap,
        ).toFixed(1)}-point gap at Week 8).`,
    metricLabel: "Gap at Week 8",
    metricValue: `${Math.abs(week8Gap).toFixed(1)} pts`,
    tone: separationWeek ? "neutral" : "watch",
  };

  // B. Placebo response: percent improvement in placebo mean score, Baseline -> Week 2.
  const plBase = traj[0].placeboMean;
  const plW2 = traj.find((t) => t.week === 2)!.placeboMean;
  const plW8 = traj[traj.length - 1].placeboMean;
  const earlyPlaceboPct = round(((plBase - plW2) / plBase) * 100, 1);
  const fullPlaceboPct = round(((plBase - plW8) / plBase) * 100, 1);
  const earlyShare = round((earlyPlaceboPct / Math.max(fullPlaceboPct, 0.01)) * 100, 0);
  const placebo: HealthSignal = {
    id: "placebo",
    title: "Placebo response",
    observation: `Placebo mean score improves ${earlyPlaceboPct.toFixed(
      1,
    )}% by Week 2 — about ${earlyShare}% of its full ${fullPlaceboPct.toFixed(
      1,
    )}% improvement by Week 8.`,
    metricLabel: "Placebo improvement by Week 2",
    metricValue: `${earlyPlaceboPct.toFixed(1)}%`,
    tone: earlyShare >= 45 ? "watch" : "neutral",
  };

  // C. Missingness: completion at baseline vs Week 8.
  const w8 = traj[traj.length - 1];
  const baseN = traj[0].treatmentN + traj[0].placeboN;
  const w8N = w8.treatmentN + w8.placeboN;
  const completionW8 = round((w8N / baseN) * 100, 0);
  const missingness: HealthSignal = {
    id: "missingness",
    title: "Missing data",
    observation: `Observed records fall from 100% at baseline (${baseN}) to ${completionW8}% at Week 8 (${w8N}). ${attritionByArmSentence(study)}`,
    metricLabel: "Records at Week 8",
    metricValue: `${completionW8}%`,
    tone: completionW8 <= 82 ? "watch" : "neutral",
  };

  // D. Variability: SD of change before vs after the variability break week.
  const changeSd = (week: number, arm: Arm) => {
    const key = study.visits.find((v) => v.week === week)!.key;
    const xs: number[] = [];
    for (const p of study.participants) {
      if (p.arm !== arm) continue;
      const s = p.scores[key];
      if (typeof s === "number") xs.push(s - p.baseline);
    }
    return sd(xs);
  };
  const preSd = round(mean([changeSd(2, "treatment"), changeSd(2, "placebo")]), 1);
  const postSd = round(mean([changeSd(8, "treatment"), changeSd(8, "placebo")]), 1);
  const ratio = round(postSd / Math.max(preSd, 0.01), 2);
  const variability: HealthSignal = {
    id: "variability",
    title: "Participant-level variability",
    observation: `SD of change from baseline widens from ${preSd.toFixed(
      1,
    )} points at Week 2 to ${postSd.toFixed(1)} points at Week 8 (${ratio.toFixed(
      2,
    )}×), most of the increase appearing after Week 4.`,
    metricLabel: "SD of change, Wk2 → Wk8",
    metricValue: `${preSd.toFixed(1)} → ${postSd.toFixed(1)}`,
    tone: ratio >= 1.3 ? "watch" : "neutral",
  };

  return [separation, placebo, missingness, variability];
}

export function attritionRate(study: Study, arm: Arm): number {
  const last = study.visits[study.visits.length - 1].key;
  const rows = study.participants.filter((p) => p.arm === arm);
  const done = rows.filter((p) => typeof p.scores[last] === "number").length;
  return round((1 - done / rows.length) * 100, 0);
}

function attritionByArmSentence(study: Study): string {
  const t = attritionRate(study, "treatment");
  const p = attritionRate(study, "placebo");
  const gap = Math.abs(p - t);
  if (gap <= 3) {
    return `Attrition is comparable between arms (${t}% treatment, ${p}% placebo).`;
  }
  const higher = p > t ? "Placebo" : "Treatment";
  return `${higher} attrition runs ${gap} points higher (${t}% treatment vs ${p}% placebo).`;
}

// ---------------------------------------------------------------------------
// Week 8 participant-level change distribution
// ---------------------------------------------------------------------------

export interface DistributionBin {
  label: string;
  rangeStart: number;
  treatment: number;
  placebo: number;
}

export interface DistributionResult {
  bins: DistributionBin[];
  treatmentMean: number;
  placeboMean: number;
  treatmentValues: number[];
  placeboValues: number[];
  binWidth: number;
}

export function week8Distribution(study: Study): DistributionResult {
  const last = study.visits[study.visits.length - 1].key;
  const collect = (arm: Arm) =>
    study.participants
      .filter((p) => p.arm === arm && typeof p.scores[last] === "number")
      .map((p) => (p.scores[last] as number) - p.baseline);

  const treatmentValues = collect("treatment");
  const placeboValues = collect("placebo");
  const all = [...treatmentValues, ...placeboValues];
  const lo = Math.floor(Math.min(...all) / 4) * 4;
  const hi = Math.ceil(Math.max(...all) / 4) * 4;
  const binWidth = 4;

  const bins: DistributionBin[] = [];
  for (let start = lo; start < hi; start += binWidth) {
    const inBin = (xs: number[]) =>
      xs.filter((x) => x >= start && x < start + binWidth).length;
    bins.push({
      label: `${start} to ${start + binWidth}`,
      rangeStart: start,
      treatment: inBin(treatmentValues),
      placebo: inBin(placeboValues),
    });
  }

  return {
    bins,
    treatmentMean: round(mean(treatmentValues), 1),
    placeboMean: round(mean(placeboValues), 1),
    treatmentValues,
    placeboValues,
    binWidth,
  };
}

// ---------------------------------------------------------------------------
// Placebo response explorer
// ---------------------------------------------------------------------------

export type PlaceboWindow = "early" | "full";

export interface PlaceboThresholdRow {
  threshold: number; // 10, 20, 30
  earlyPct: number;
  fullPct: number;
}

export function placeboResponse(study: Study): {
  rows: PlaceboThresholdRow[];
  earlyN: number;
  fullN: number;
} {
  const placebo = study.participants.filter((p) => p.arm === "placebo");
  const w2 = "w2";
  const w8 = "w8";

  const improvedBy = (key: string, pct: number) => {
    const eligible = placebo.filter((p) => typeof p.scores[key] === "number");
    const hit = eligible.filter((p) => {
      const s = p.scores[key] as number;
      return p.baseline > 0 && (p.baseline - s) / p.baseline >= pct / 100;
    });
    return { pct: eligible.length ? (hit.length / eligible.length) * 100 : 0, n: eligible.length };
  };

  const rows: PlaceboThresholdRow[] = [10, 20, 30].map((t) => ({
    threshold: t,
    earlyPct: round(improvedBy(w2, t).pct, 0),
    fullPct: round(improvedBy(w8, t).pct, 0),
  }));

  return {
    rows,
    earlyN: improvedBy(w2, 10).n,
    fullN: improvedBy(w8, 10).n,
  };
}

// ---------------------------------------------------------------------------
// Retention / missing-data funnel
// ---------------------------------------------------------------------------

export type RetentionScope = "overall" | "treatment" | "placebo";

export interface RetentionStep {
  visitKey: string;
  visitLabel: string;
  short: string;
  count: number;
  pct: number;
}

export function retention(study: Study, scope: RetentionScope): RetentionStep[] {
  const pool =
    scope === "overall"
      ? study.participants
      : study.participants.filter((p) => p.arm === scope);
  const base = pool.length;
  const funnelVisits = study.visits.filter(
    (v) => v.key === "bl" || v.week === 2 || v.week === 4 || v.week === 6 || v.week === 8,
  );
  return funnelVisits.map((v) => {
    const count = pool.filter((p) => typeof p.scores[v.key] === "number").length;
    return {
      visitKey: v.key,
      visitLabel: v.label,
      short: v.short,
      count,
      pct: round((count / base) * 100, 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Endpoint definition comparison
// ---------------------------------------------------------------------------

export type EndpointDefinition = "raw" | "change" | "pct";

export interface EndpointDefinitionSeriesPoint {
  short: string;
  visitLabel: string;
  week: number;
  treatment: number;
  placebo: number;
  unit: string;
}

export function endpointDefinitionSeries(
  study: Study,
  def: EndpointDefinition,
): { points: EndpointDefinitionSeriesPoint[]; unit: string; week8Gap: number } {
  const traj = trajectory(study);
  const unit = def === "raw" ? "points" : def === "change" ? "points vs baseline" : "% of baseline";
  const points = traj.map((t) => {
    if (def === "raw") {
      return {
        short: t.short,
        visitLabel: t.visitLabel,
        week: t.week,
        treatment: t.treatmentMean,
        placebo: t.placeboMean,
        unit,
      };
    }
    if (def === "change") {
      return {
        short: t.short,
        visitLabel: t.visitLabel,
        week: t.week,
        treatment: t.treatmentChange,
        placebo: t.placeboChange,
        unit,
      };
    }
    return {
      short: t.short,
      visitLabel: t.visitLabel,
      week: t.week,
      treatment: t.treatmentPct,
      placebo: t.placeboPct,
      unit,
    };
  });
  const last = points[points.length - 1];
  return { points, unit, week8Gap: round(last.treatment - last.placebo, 2) };
}

// ---------------------------------------------------------------------------
// Individual participant trajectory (for the drawer)
// ---------------------------------------------------------------------------

export interface ParticipantPoint {
  short: string;
  visitLabel: string;
  week: number;
  score: number | null;
  armMean: number;
}

export function participantTrajectory(
  study: Study,
  participant: Participant,
): ParticipantPoint[] {
  const stats = visitArmStats(study);
  return study.visits.map((v) => {
    const armStat = stats.find((s) => s.visitKey === v.key && s.arm === participant.arm)!;
    const raw = participant.scores[v.key];
    return {
      short: v.short,
      visitLabel: v.label,
      week: v.week,
      score: typeof raw === "number" ? raw : null,
      armMean: armStat.meanScore,
    };
  });
}

export function participantChange(study: Study, p: Participant): number | null {
  const last = study.visits[study.visits.length - 1].key;
  const s = p.scores[last];
  if (typeof s !== "number") return null;
  return round(s - p.baseline, 1);
}

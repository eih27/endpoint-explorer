import { gaussian, hashSeed, mulberry32 } from "./rng";
import { POST_VISITS, SITES, VISITS, getStudyConfig } from "./studies";
import type { Arm, Participant, Study } from "./types";

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Build the full synthetic dataset for a study. Deterministic given the study id.
 *
 * Model per participant:
 *  - baseline score  = study baseline mean + N(0, sd), clamped to scale
 *  - random responder intercept scales the arm's expected trajectory (some
 *    participants respond much more than others)
 *  - observed score at visit v = baseline * (1 + expectedFractionalChange[v] * responder)
 *      + N(0, noise), where noise SD inflates after the variability break week
 *  - dropout: at each post-baseline visit a hazard (higher in later weeks, and
 *    optionally higher in placebo) determines whether the participant stops
 *    attending; all subsequent visits are null.
 */
export function generateStudy(studyId: string): Study {
  const config = getStudyConfig(studyId);
  const rand = mulberry32(hashSeed(config.seed));

  const nTreatment = Math.round(config.targetN * config.treatmentAllocation);
  const participants: Participant[] = [];

  for (let i = 0; i < config.targetN; i++) {
    const arm: Arm = i < nTreatment ? "treatment" : "placebo";
    const armCfg = config.arms[arm];

    const baseline = clamp(
      config.baseline.mean + gaussian(rand) * config.baseline.sd,
      config.scaleRange[0] + 4,
      config.scaleRange[1],
    );

    // Responder multiplier: centered near 1, mildly right-skewed so a minority
    // respond strongly and a minority barely move. Bounded so the expected
    // trajectory never implies a below-floor score.
    const responder = clamp(0.9 + gaussian(rand) * 0.4 + Math.max(0, gaussian(rand)) * 0.18, 0.2, 1.7);

    // Persistent per-participant offset (a "level" effect that carries across
    // every visit) plus a persistent slope tilt. These make an individual's
    // visit-to-visit path smooth and correlated rather than a random zigzag.
    const levelOffset = gaussian(rand) * baseline * 0.05;
    const slopeTilt = gaussian(rand) * baseline * 0.012;

    // Decide dropout visit index (within POST_VISITS) up front.
    let dropoutIndex = POST_VISITS.length; // no dropout
    const hazardMult = arm === "placebo" ? config.placeboDropoutMultiplier : 1;
    for (let v = 0; v < POST_VISITS.length; v++) {
      const hazard = clamp(config.dropoutHazard[v] * hazardMult, 0, 0.5);
      if (rand() < hazard) {
        dropoutIndex = v;
        break;
      }
    }

    const scores: Record<string, number | null> = { bl: round1(baseline) };
    let visitsCompleted = 1;
    let lastVisitKey = "bl";

    // AR(1) measurement residual: each visit's error is mostly a carry-over of
    // the previous visit's error plus a small fresh shock. This keeps an
    // individual's path smooth (no implausible visit-to-visit swings) while the
    // marginal spread still widens over time.
    const rho = 0.68;
    let residual = 0;

    for (let v = 0; v < POST_VISITS.length; v++) {
      const visit = POST_VISITS[v];
      if (v >= dropoutIndex) {
        scores[visit.key] = null;
        continue;
      }

      const expected = armCfg.meanFractionalChange[v] * responder;
      let noiseSd = baseline * armCfg.noiseFraction;
      if (visit.week > config.variabilityBreakWeek) {
        noiseSd *= config.variabilityInflation;
      }
      residual = rho * residual + Math.sqrt(1 - rho * rho) * gaussian(rand) * noiseSd;
      const raw =
        baseline * (1 + expected) + levelOffset + slopeTilt * visit.week + residual;
      scores[visit.key] = round1(
        clamp(raw, config.scaleRange[0] + 1, config.scaleRange[1]),
      );
      visitsCompleted += 1;
      lastVisitKey = visit.key;
    }

    participants.push({
      id: `${config.code.split("-")[0]}-${String(i + 1).padStart(3, "0")}`,
      studyId: config.id,
      arm,
      site: SITES[Math.floor(rand() * SITES.length)],
      baseline: round1(baseline),
      scores,
      visitsCompleted,
      status: dropoutIndex < POST_VISITS.length ? "discontinued" : "completed",
      lastVisitKey,
    });
  }

  return { config, visits: VISITS, participants };
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

const cache = new Map<string, Study>();

/** Memoized accessor so repeated renders reuse the same dataset object. */
export function getStudy(studyId: string): Study {
  const existing = cache.get(studyId);
  if (existing) return existing;
  const built = generateStudy(studyId);
  cache.set(studyId, built);
  return built;
}

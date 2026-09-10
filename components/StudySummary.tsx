"use client";

import type { StudySummary as Summary } from "@/lib/analysis";
import type { StudyConfig } from "@/lib/types";
import { signed } from "@/lib/format";

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 first:pl-0">
      <div className="text-2xs font-medium uppercase tracking-[0.1em] text-ink-faint">{label}</div>
      <div className="text-xl font-semibold tabular-nums tracking-tight text-ink">{value}</div>
      {sub ? <div className="text-2xs text-ink-faint">{sub}</div> : null}
    </div>
  );
}

export function StudySummary({
  summary,
  config,
}: {
  summary: Summary;
  config: StudyConfig;
}) {
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="grid grid-cols-2 divide-line sm:grid-cols-3 sm:divide-x lg:grid-cols-5 lg:divide-x [&>*]:border-b [&>*]:border-line sm:[&>*]:border-b-0 lg:[&>*]:border-b-0">
        <Stat
          label="Participants enrolled"
          value={String(summary.enrolled)}
          sub={`${summary.treatmentN} treatment · ${summary.placeboN} placebo`}
        />
        <Stat
          label="Completion rate"
          value={`${Math.round(summary.completionRate * 100)}%`}
          sub="observed at Week 8"
        />
        <Stat
          label="Mean baseline"
          value={summary.meanBaseline.toFixed(1)}
          sub={`${config.scaleAcronym} · scale ${config.scaleRange[0]}–${config.scaleRange[1]}`}
        />
        <Stat
          label="Mean change (treatment)"
          value={signed(summary.meanChangeTreatment, 1)}
          sub={`placebo ${signed(summary.meanChangePlacebo, 1)}`}
        />
        <Stat
          label="T vs P difference, Wk 8"
          value={`${signed(summary.diffAtWeek8, 1)} pts`}
          sub="descriptive; not a significance test"
        />
      </div>
    </div>
  );
}

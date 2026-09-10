"use client";

import { Panel, SegmentedControl } from "@/components/ui/primitives";
import type { RetentionScope, RetentionStep } from "@/lib/analysis";

export function MissingDataView({
  scope,
  onScopeChange,
  steps,
  treatmentSteps,
  placeboSteps,
}: {
  scope: RetentionScope;
  onScopeChange: (s: RetentionScope) => void;
  steps: RetentionStep[];
  treatmentSteps: RetentionStep[];
  placeboSteps: RetentionStep[];
}) {
  const tDrop = 100 - (treatmentSteps[treatmentSteps.length - 1]?.pct ?? 100);
  const pDrop = 100 - (placeboSteps[placeboSteps.length - 1]?.pct ?? 100);
  const diff = Math.abs(tDrop - pDrop);

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<RetentionScope>
          ariaLabel="Retention scope"
          options={[
            { value: "overall", label: "Overall" },
            { value: "treatment", label: "Treatment" },
            { value: "placebo", label: "Placebo" },
          ]}
          value={scope}
          onChange={onScopeChange}
        />
        <span className="text-2xs text-ink-faint">Bars scaled to each visit&rsquo;s retained %</span>
      </div>

      <div className="space-y-2.5">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].count : s.count;
          const lost = prev - s.count;
          return (
            <div key={s.visitKey} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-xs font-medium text-ink-soft">{s.visitLabel}</div>
              <div className="relative h-8 flex-1 overflow-hidden rounded bg-canvas">
                <div
                  className="flex h-full items-center rounded bg-treatment/15 px-2 transition-[width] duration-500"
                  style={{ width: `${s.pct}%` }}
                >
                  <span className="text-2xs font-medium tabular-nums text-ink">
                    {s.count} · {s.pct}%
                  </span>
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-2xs text-ink-faint">
                {i === 0 ? "—" : lost > 0 ? `−${lost}` : "0"}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
        {diff > 3
          ? `Attrition differs by arm: ${pDrop}% of placebo vs ${tDrop}% of treatment participants have no Week 8 record (${diff}-point gap).`
          : `Attrition is comparable by arm: ${tDrop}% of treatment vs ${pDrop}% of placebo participants have no Week 8 record.`}
      </p>
    </Panel>
  );
}

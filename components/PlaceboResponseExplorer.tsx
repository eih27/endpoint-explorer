"use client";

import { Panel, SegmentedControl } from "@/components/ui/primitives";
import type { PlaceboThresholdRow, PlaceboWindow } from "@/lib/analysis";
import { useState } from "react";

export function PlaceboResponseExplorer({
  rows,
  earlyN,
  fullN,
}: {
  rows: PlaceboThresholdRow[];
  earlyN: number;
  fullN: number;
}) {
  const [win, setWin] = useState<PlaceboWindow>("early");
  const n = win === "early" ? earlyN : fullN;

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<PlaceboWindow>
          ariaLabel="Response window"
          options={[
            { value: "early", label: "Early response · BL → Wk 2" },
            { value: "full", label: "Full study · BL → Wk 8" },
          ]}
          value={win}
          onChange={setWin}
        />
        <span className="text-2xs text-ink-faint">{n} placebo participants with data in window</span>
      </div>

      <div className="space-y-3">
        {rows.map((r) => {
          const value = win === "early" ? r.earlyPct : r.fullPct;
          return (
            <div key={r.threshold} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-xs text-ink-soft">
                Improved <span className="font-medium text-ink">{r.threshold}%+</span>
              </div>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-canvas">
                <div
                  className="h-full rounded bg-placebo/70 transition-[width] duration-500"
                  style={{ width: `${value}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs font-medium tabular-nums text-ink">
                  {value}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
        Exploring how response patterns change depending on the threshold used. Higher thresholds and
        the shorter window both narrow the group counted as &ldquo;responders.&rdquo; These cut points
        are illustrative, not validated clinical thresholds.
      </p>
    </Panel>
  );
}

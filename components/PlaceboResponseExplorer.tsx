"use client";

import { TooltipShell } from "@/components/ChartTooltip";
import { Panel, SegmentedControl } from "@/components/ui/primitives";
import { placeboResponseCurve, type PlaceboWindow } from "@/lib/analysis";
import type { Study } from "@/lib/types";
import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRESETS = [10, 20, 30];

export function PlaceboResponseExplorer({ study }: { study: Study }) {
  const [win, setWin] = useState<PlaceboWindow>("early");
  const [threshold, setThreshold] = useState(20);

  const { curve, n } = useMemo(() => placeboResponseCurve(study, win), [study, win]);
  const current = curve[threshold];

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

      <div className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <div>
          <div className="text-2xs font-medium uppercase tracking-[0.1em] text-ink-faint">
            Improvement threshold
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-ink">
            ≥ {threshold}%
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="mt-3 w-full accent-placebo"
            aria-label="Improvement threshold percent"
          />
          <div className="mt-1 flex justify-between text-2xs text-ink-faint">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setThreshold(p)}
                className={`rounded-full border px-2 py-0.5 text-2xs font-medium transition-colors ${
                  threshold === p
                    ? "border-placebo/30 bg-placebo/10 text-placebo"
                    : "border-line text-ink-faint hover:text-ink-soft"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm text-ink-soft">
            <span className="text-2xl font-semibold tabular-nums text-ink">{current.pct}%</span> of
            placebo participants improved by at least{" "}
            <span className="font-medium text-ink">{threshold}%</span> from baseline
            {win === "early" ? " by Week 2" : " by Week 8"}.
          </div>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curve} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#eeeeec" vertical={false} />
                <XAxis
                  dataKey="threshold"
                  tickLine={false}
                  axisLine={{ stroke: "#e6e6e3" }}
                  tickMargin={6}
                  ticks={[0, 10, 20, 30, 40, 50]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tickMargin={6}
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const r = payload[0].payload as { threshold: number; pct: number };
                    return (
                      <TooltipShell
                        title={`≥ ${r.threshold}% improvement`}
                        rows={[{ label: "Placebo participants", value: `${r.pct}%`, color: "#9a6b3f" }]}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="#9a6b3f"
                  strokeWidth={2}
                  fill="#9a6b3f"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                  dot={false}
                />
                <ReferenceDot
                  x={threshold}
                  y={current.pct}
                  r={4.5}
                  fill="#9a6b3f"
                  stroke="#fff"
                  strokeWidth={1.5}
                  isFront
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
        Drag the threshold to see how the &ldquo;responder&rdquo; share falls as the bar gets higher
        — a small change in where you draw the line can move the number a lot. Exploratory only;
        these are not validated clinical thresholds.
      </p>
    </Panel>
  );
}

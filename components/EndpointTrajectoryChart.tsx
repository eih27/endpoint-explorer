"use client";

import { TooltipShell } from "@/components/ChartTooltip";
import { LegendDot, Panel, SegmentedControl } from "@/components/ui/primitives";
import type { TrajectoryPoint } from "@/lib/analysis";
import type { StudyConfig } from "@/lib/types";
import { signed } from "@/lib/format";
import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Mode = "mean" | "change";

interface Row {
  short: string;
  visitLabel: string;
  week: number;
  tMean: number;
  pMean: number;
  tN: number;
  pN: number;
  tBand: [number, number];
  pBand: [number, number];
}

export function EndpointTrajectoryChart({
  traj,
  config,
  showBand,
  onToggleBand,
}: {
  traj: TrajectoryPoint[];
  config: StudyConfig;
  showBand: boolean;
  onToggleBand: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("mean");

  const rows: Row[] = useMemo(
    () =>
      traj.map((t) => ({
        short: t.short,
        visitLabel: t.visitLabel,
        week: t.week,
        tMean: mode === "mean" ? t.treatmentMean : t.treatmentChange,
        pMean: mode === "mean" ? t.placeboMean : t.placeboChange,
        tN: t.treatmentN,
        pN: t.placeboN,
        tBand:
          mode === "mean"
            ? [t.treatmentLow, t.treatmentHigh]
            : [t.treatmentChangeLow, t.treatmentChangeHigh],
        pBand:
          mode === "mean"
            ? [t.placeboLow, t.placeboHigh]
            : [t.placeboChangeLow, t.placeboChangeHigh],
      })),
    [traj, mode],
  );

  const last = traj[traj.length - 1];
  // Report the same separation metric in both views: difference in mean change
  // from baseline at Week 8. This matches the study-summary card.
  const separation = last.treatmentChange - last.placeboChange;

  const yLabel =
    mode === "mean" ? `${config.scaleAcronym} mean score` : "Mean change from baseline";

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <LegendDot arm="treatment" /> Treatment
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot arm="placebo" /> Placebo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-ink-faint">
            <input
              type="checkbox"
              checked={showBand}
              onChange={(e) => onToggleBand(e.target.checked)}
              className="h-3 w-3 accent-treatment"
            />
            95% band (± 1.96 SEM)
          </label>
          <SegmentedControl<Mode>
            ariaLabel="Endpoint view"
            options={[
              { value: "mean", label: "Mean score" },
              { value: "change", label: "Change from baseline" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="#eeeeec" vertical={false} />
            <XAxis
              dataKey="short"
              tickLine={false}
              axisLine={{ stroke: "#e6e6e3" }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickMargin={6}
              domain={mode === "change" ? ["dataMin - 2", 2] : ["auto", "auto"]}
            />
            <Tooltip
              cursor={{ stroke: "#d4d4d0", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const r = payload[0].payload as Row;
                return (
                  <TooltipShell
                    title={r.visitLabel}
                    rows={[
                      {
                        label: "Treatment",
                        value:
                          mode === "mean" ? r.tMean.toFixed(1) : signed(r.tMean, 1),
                        color: "#2f6f6a",
                      },
                      {
                        label: "Placebo",
                        value:
                          mode === "mean" ? r.pMean.toFixed(1) : signed(r.pMean, 1),
                        color: "#9a6b3f",
                      },
                      {
                        label: "Gap (T − P)",
                        value: signed(r.tMean - r.pMean, 1),
                        muted: true,
                      },
                    ]}
                    footer={`n = ${r.tN} treatment · ${r.pN} placebo observed`}
                  />
                );
              }}
            />
            {showBand ? (
              <Area
                type="monotone"
                dataKey="pBand"
                stroke="none"
                fill="#9a6b3f"
                fillOpacity={0.1}
                isAnimationActive={false}
                activeDot={false}
              />
            ) : null}
            {showBand ? (
              <Area
                type="monotone"
                dataKey="tBand"
                stroke="none"
                fill="#2f6f6a"
                fillOpacity={0.12}
                isAnimationActive={false}
                activeDot={false}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="pMean"
              stroke="#9a6b3f"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#9a6b3f", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tMean"
              stroke="#2f6f6a"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#2f6f6a", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-ink-soft">
          {yLabel}. At Week 8, treatment and placebo differ by{" "}
          <span className="font-medium text-ink">{signed(separation, 1)} points</span> in mean change
          from baseline.
        </p>
        <span className="text-2xs text-ink-faint">Sample size shown in tooltip at each visit</span>
      </div>
    </Panel>
  );
}

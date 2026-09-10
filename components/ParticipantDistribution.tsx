"use client";

import { TooltipShell } from "@/components/ChartTooltip";
import { LegendDot, Panel } from "@/components/ui/primitives";
import type { DistributionResult } from "@/lib/analysis";
import { signed } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ParticipantDistribution({
  dist,
  scaleAcronym,
}: {
  dist: DistributionResult;
  scaleAcronym: string;
}) {
  const data = dist.bins.map((b) => ({
    ...b,
    mid: b.rangeStart + dist.binWidth / 2,
    label: `${b.rangeStart} to ${b.rangeStart + dist.binWidth}`,
  }));

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
        <div className="text-2xs text-ink-faint">
          Mean change: <span className="font-medium text-treatment">{signed(dist.treatmentMean, 1)}</span>
          {"  ·  "}
          <span className="font-medium text-placebo">{signed(dist.placeboMean, 1)}</span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 16, left: 4 }} barGap={1}>
            <CartesianGrid stroke="#eeeeec" vertical={false} />
            <XAxis
              dataKey="mid"
              tickLine={false}
              axisLine={{ stroke: "#e6e6e3" }}
              tickMargin={8}
              label={{
                value: `Change from baseline at Week 8  (${scaleAcronym} points)`,
                position: "bottom",
                offset: 2,
                style: { fontSize: 11, fill: "#767676" },
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              tickMargin={6}
              label={{
                value: "Participants",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#767676" },
              }}
            />
            <ReferenceLine x={0} stroke="#d4d4d0" strokeDasharray="3 3" />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const r = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipShell
                    title={`Change ${r.label} pts`}
                    rows={[
                      { label: "Treatment", value: `${r.treatment}`, color: "#2f6f6a" },
                      { label: "Placebo", value: `${r.placebo}`, color: "#9a6b3f" },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="treatment" fill="#2f6f6a" fillOpacity={0.85} isAnimationActive={false} />
            <Bar dataKey="placebo" fill="#9a6b3f" fillOpacity={0.8} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
        Similar averages can contain very different response patterns. Each arm here spans large
        improvements, minimal change, and some worsening.
      </p>
    </Panel>
  );
}

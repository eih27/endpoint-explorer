"use client";

import { TooltipShell } from "@/components/ChartTooltip";
import { LegendDot, Panel, SegmentedControl } from "@/components/ui/primitives";
import type { EndpointDefinition } from "@/lib/analysis";
import { endpointDefinitionSeries } from "@/lib/analysis";
import { signed } from "@/lib/format";
import type { Study } from "@/lib/types";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFS: { value: EndpointDefinition; label: string; blurb: string }[] = [
  { value: "raw", label: "Raw score", blurb: "Mean scale score at each visit." },
  { value: "change", label: "Change from baseline", blurb: "Mean points gained or lost vs each participant's own baseline." },
  { value: "pct", label: "% change from baseline", blurb: "Mean change expressed as a percent of each participant's baseline." },
];

export function EndpointDefinitionCompare({ study }: { study: Study }) {
  const [def, setDef] = useState<EndpointDefinition>("change");
  const { points, unit, week8Gap } = useMemo(
    () => endpointDefinitionSeries(study, def),
    [study, def],
  );
  const meta = DEFS.find((d) => d.value === def)!;

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<EndpointDefinition>
          ariaLabel="Endpoint definition"
          options={DEFS.map((d) => ({ value: d.value, label: d.label }))}
          value={def}
          onChange={setDef}
        />
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <LegendDot arm="treatment" /> Treatment
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot arm="placebo" /> Placebo
          </span>
        </div>
      </div>

      <p className="mb-3 text-xs text-ink-faint">{meta.blurb}</p>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="#eeeeec" vertical={false} />
            <XAxis dataKey="short" tickLine={false} axisLine={{ stroke: "#e6e6e3" }} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickMargin={6}
              tickFormatter={(v) => (def === "pct" ? `${v}%` : `${v}`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const r = payload[0].payload as (typeof points)[number];
                const fmt = (n: number) =>
                  def === "raw" ? n.toFixed(1) : def === "pct" ? `${signed(n, 1)}%` : signed(n, 1);
                return (
                  <TooltipShell
                    title={r.visitLabel}
                    rows={[
                      { label: "Treatment", value: fmt(r.treatment), color: "#2f6f6a" },
                      { label: "Placebo", value: fmt(r.placebo), color: "#9a6b3f" },
                      { label: "Gap (T − P)", value: fmt(r.treatment - r.placebo), muted: true },
                    ]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="placebo"
              stroke="#9a6b3f"
              strokeWidth={2}
              dot={{ r: 2.5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="treatment"
              stroke="#2f6f6a"
              strokeWidth={2}
              dot={{ r: 2.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-xs text-ink-soft">
          Week 8 treatment–placebo gap under this definition:{" "}
          <span className="font-medium text-ink">
            {def === "pct" ? `${signed(week8Gap, 1)}%` : `${signed(week8Gap, 1)} ${unit}`}
          </span>
          .
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          How a measurement is defined can change what is easy&mdash;or difficult&mdash;to see. This
          view does not imply that any one definition is scientifically superior.
        </p>
      </div>
    </Panel>
  );
}

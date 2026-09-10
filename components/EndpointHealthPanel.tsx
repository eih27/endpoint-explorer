"use client";

import { Badge } from "@/components/ui/primitives";
import type { HealthSignal } from "@/lib/analysis";
import { ArrowDownRight, Layers, TrendingDown, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<HealthSignal["id"], LucideIcon> = {
  separation: Layers,
  placebo: TrendingDown,
  missingness: ArrowDownRight,
  variability: Users,
};

export function EndpointHealthPanel({ signals }: { signals: HealthSignal[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
      {signals.map((s) => {
        const Icon = ICONS[s.id];
        return (
          <div key={s.id} className="flex flex-col gap-2 bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              </div>
              <Badge tone={s.tone === "watch" ? "watch" : "neutral"}>
                {s.tone === "watch" ? "Worth a look" : "Observed"}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">{s.observation}</p>
            <div className="mt-auto flex items-baseline gap-2 pt-1">
              <span className="text-2xs uppercase tracking-[0.1em] text-ink-faint">
                {s.metricLabel}
              </span>
              <span className="text-sm font-semibold tabular-nums text-ink">{s.metricValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

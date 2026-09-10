"use client";

import { TooltipShell } from "@/components/ChartTooltip";
import { Badge } from "@/components/ui/primitives";
import { participantTrajectory } from "@/lib/analysis";
import { signed } from "@/lib/format";
import type { Participant, Study } from "@/lib/types";
import { X } from "lucide-react";
import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ParticipantDrawer({
  study,
  participant,
  onClose,
}: {
  study: Study;
  participant: Participant | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = participant !== null;
  const points = participant ? participantTrajectory(study, participant) : [];
  const lastObserved = participant
    ? [...points].reverse().find((p) => p.score !== null)
    : undefined;
  const change =
    participant && lastObserved ? lastObserved.score! - participant.baseline : null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/20 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-8px_0_28px_rgba(0,0,0,0.08)] transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Participant detail"
      >
        {participant ? (
          <>
            <div className="flex items-start justify-between border-b border-line px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-sm font-semibold text-ink">{participant.id}</h3>
                  <Badge tone={participant.arm === "treatment" ? "arm-t" : "arm-p"}>
                    {participant.arm}
                  </Badge>
                </div>
                <p className="mt-0.5 text-2xs text-ink-faint">
                  {participant.site} · {participant.visitsCompleted} of {study.visits.length} visits ·{" "}
                  {participant.status}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-ink"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
              {[
                { label: "Baseline", value: participant.baseline.toFixed(1) },
                {
                  label: lastObserved ? lastObserved.visitLabel : "Last visit",
                  value: lastObserved ? lastObserved.score!.toFixed(1) : "—",
                },
                { label: "Change", value: change === null ? "—" : signed(change, 1) },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3">
                  <div className="text-2xs uppercase tracking-[0.1em] text-ink-faint">{s.label}</div>
                  <div className="text-base font-semibold tabular-nums text-ink">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-ink">Score trajectory</h4>
                <span className="text-2xs text-ink-faint">vs {participant.arm} arm mean</span>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                    <CartesianGrid stroke="#eeeeec" vertical={false} />
                    <XAxis
                      dataKey="short"
                      tickLine={false}
                      axisLine={{ stroke: "#e6e6e3" }}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} width={32} tickMargin={6} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const r = payload[0].payload as (typeof points)[number];
                        return (
                          <TooltipShell
                            title={r.visitLabel}
                            rows={[
                              {
                                label: "This participant",
                                value: r.score === null ? "missed" : r.score.toFixed(1),
                                color: participant.arm === "treatment" ? "#2f6f6a" : "#9a6b3f",
                              },
                              { label: "Arm mean", value: r.armMean.toFixed(1), muted: true },
                            ]}
                          />
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="armMean"
                      stroke="#c9c9c5"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={participant.arm === "treatment" ? "#2f6f6a" : "#9a6b3f"}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <table className="mt-4 w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-2xs uppercase tracking-[0.08em] text-ink-faint">
                    <th className="py-1.5 font-medium">Visit</th>
                    <th className="py-1.5 text-right font-medium">Score</th>
                    <th className="py-1.5 text-right font-medium">Δ baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.short} className="border-b border-line/60">
                      <td className="py-1.5 text-ink-soft">{p.visitLabel}</td>
                      <td className="py-1.5 text-right tabular-nums text-ink">
                        {p.score === null ? (
                          <span className="text-ink-faint">missed</span>
                        ) : (
                          p.score.toFixed(1)
                        )}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-ink-soft">
                        {p.score === null ? "—" : signed(p.score - participant.baseline, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line px-5 py-3 text-2xs text-ink-faint">
              Synthetic participant record. Individual trajectories are generated, not observed.
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}

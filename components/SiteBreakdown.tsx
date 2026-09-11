"use client";

import { Badge, Panel } from "@/components/ui/primitives";
import type { SiteRow } from "@/lib/analysis";
import { signed } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export function SiteBreakdown({ rows }: { rows: SiteRow[] }) {
  const flaggedCount = rows.filter((r) => r.flags.length > 0).length;

  return (
    <Panel padded={false}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-2xs text-ink-faint">{rows.length} sites · ~{Math.round(rows.reduce((a, r) => a + r.n, 0) / rows.length)} participants/site on average</span>
        <span className="text-2xs text-ink-faint">
          {flaggedCount > 0 ? `${flaggedCount} flagged for a closer look` : "No sites flagged"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left text-2xs uppercase tracking-[0.08em] text-ink-faint">
              <th className="px-5 py-2.5 font-medium">Site</th>
              <th className="px-4 py-2.5 text-right font-medium">N</th>
              <th className="px-4 py-2.5 text-right font-medium">Completion</th>
              <th className="px-4 py-2.5 text-right font-medium">Mean baseline</th>
              <th className="px-4 py-2.5 text-right font-medium">Mean change</th>
              <th className="px-5 py-2.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.site} className="border-b border-line/60 last:border-b-0">
                <td className="px-5 py-2.5 font-medium text-ink">{r.site}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">{r.n}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                  {r.completionPct}%
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                  {r.meanBaseline.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-ink">
                  {r.meanChange === null ? "—" : signed(r.meanChange, 1)}
                </td>
                <td className="px-5 py-2.5">
                  {r.flags.length === 0 ? (
                    <span className="text-ink-faint">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {r.flags.map((f) => (
                        <Badge key={f} tone="watch">
                          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} />
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">
        Flags compare each site&rsquo;s completion and mean change to the study-wide figure using a
        simple deviation check (1.5× the standard error of a same-size sample) — a prompt to look
        closer, not a statistical test or a finding about site conduct. Samples per site are small,
        so some spread is expected by chance.
      </p>
    </Panel>
  );
}

"use client";

import { Badge, Panel, SegmentedControl } from "@/components/ui/primitives";
import { participantChange } from "@/lib/analysis";
import { signed } from "@/lib/format";
import type { Arm, Participant, Study } from "@/lib/types";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey = "id" | "arm" | "baseline" | "week8" | "change" | "visits" | "status";
type Dir = "asc" | "desc";
type ArmFilter = "all" | Arm;
type StatusFilter = "all" | "completed" | "discontinued";

export function ParticipantExplorer({
  study,
  onSelect,
}: {
  study: Study;
  onSelect: (p: Participant) => void;
}) {
  const lastKey = study.visits[study.visits.length - 1].key;
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [dir, setDir] = useState<Dir>("asc");
  const [armFilter, setArmFilter] = useState<ArmFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const enriched = study.participants.map((p) => {
      const w8 = p.scores[lastKey];
      return {
        p,
        week8: typeof w8 === "number" ? w8 : null,
        change: participantChange(study, p),
      };
    });

    const filtered = enriched.filter((r) => {
      if (armFilter !== "all" && r.p.arm !== armFilter) return false;
      if (statusFilter !== "all" && r.p.status !== statusFilter) return false;
      if (query && !r.p.id.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });

    const val = (r: (typeof enriched)[number]): string | number => {
      switch (sortKey) {
        case "id":
          return r.p.id;
        case "arm":
          return r.p.arm;
        case "baseline":
          return r.p.baseline;
        case "week8":
          return r.week8 ?? Number.POSITIVE_INFINITY;
        case "change":
          return r.change ?? Number.POSITIVE_INFINITY;
        case "visits":
          return r.p.visitsCompleted;
        case "status":
          return r.p.status;
      }
    };

    filtered.sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [study, lastKey, armFilter, statusFilter, query, sortKey, dir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(key === "id" || key === "arm" || key === "status" ? "asc" : "asc");
    }
  }

  const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "id", label: "Participant" },
    { key: "arm", label: "Arm" },
    { key: "baseline", label: "Baseline", numeric: true },
    { key: "week8", label: "Week 8", numeric: true },
    { key: "change", label: "Change", numeric: true },
    { key: "visits", label: "Visits", numeric: true },
    { key: "status", label: "Status" },
  ];

  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by ID…"
            className="w-44 rounded-md border border-line bg-canvas py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-ink-faint focus:border-line-strong focus:outline-none"
          />
        </div>
        <SegmentedControl<ArmFilter>
          size="sm"
          ariaLabel="Arm filter"
          options={[
            { value: "all", label: "All arms" },
            { value: "treatment", label: "Treatment" },
            { value: "placebo", label: "Placebo" },
          ]}
          value={armFilter}
          onChange={setArmFilter}
        />
        <SegmentedControl<StatusFilter>
          size="sm"
          ariaLabel="Status filter"
          options={[
            { value: "all", label: "Any status" },
            { value: "completed", label: "Completed" },
            { value: "discontinued", label: "Discontinued" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <span className="ml-auto text-2xs text-ink-faint">{rows.length} participants</span>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-ink-faint">
          No participants match these filters.
        </div>
      ) : (
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-line text-left text-2xs uppercase tracking-[0.08em] text-ink-faint">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-2.5 font-medium ${c.numeric ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 hover:text-ink ${
                        sortKey === c.key ? "text-ink" : ""
                      } ${c.numeric ? "flex-row-reverse" : ""}`}
                    >
                      {c.label}
                      {sortKey === c.key ? (
                        dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, week8, change }) => (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(p);
                  }}
                  className="cursor-pointer border-b border-line/60 outline-none transition-colors hover:bg-canvas focus:bg-canvas"
                >
                  <td className="px-4 py-2.5 font-mono text-ink">{p.id}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={p.arm === "treatment" ? "arm-t" : "arm-p"}>{p.arm}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                    {p.baseline.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                    {week8 === null ? <span className="text-ink-faint">—</span> : week8.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-ink">
                    {change === null ? <span className="text-ink-faint">—</span> : signed(change, 1)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                    {p.visitsCompleted}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        p.status === "discontinued" ? "text-placebo" : "text-ink-soft"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-line p-4 text-xs text-ink-soft">
        Select any row to move from the aggregate measurement to that individual&rsquo;s visit-by-visit
        behavior.
      </p>
    </Panel>
  );
}

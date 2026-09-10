"use client";

import type { ReactNode } from "react";

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  muted?: boolean;
}

export function TooltipShell({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: TooltipRow[];
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-[180px] rounded-md border border-line bg-surface px-3 py-2.5 text-xs shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <div className="mb-1.5 font-semibold text-ink">{title}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-soft">
              {r.color ? (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
              ) : null}
              {r.label}
            </span>
            <span
              className={r.muted ? "tabular-nums text-ink-faint" : "tabular-nums font-medium text-ink"}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {footer ? (
        <div className="mt-2 border-t border-line pt-1.5 text-2xs text-ink-faint">{footer}</div>
      ) : null}
    </div>
  );
}

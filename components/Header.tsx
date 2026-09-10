"use client";

import { STUDIES } from "@/lib/studies";
import { Activity, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Header({
  studyId,
  onStudyChange,
}: {
  studyId: string;
  onStudyChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = STUDIES.find((s) => s.id === studyId) ?? STUDIES[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface">
            <Activity className="h-4 w-4 text-treatment" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-ink">Endpoint Explorer</h1>
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-2xs font-medium text-ink-faint">
                Synthetic demo data
              </span>
            </div>
            <p className="text-xs text-ink-soft">Understand how your trial endpoint is behaving.</p>
          </div>
        </div>

        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-line-strong sm:w-[290px]"
          >
            <span className="flex flex-col">
              <span className="font-semibold text-ink">{active.code}</span>
              <span className="text-2xs text-ink-faint">{active.indication}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open ? (
            <ul
              role="listbox"
              className="absolute right-0 z-40 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:w-[290px]"
            >
              {STUDIES.map((s) => {
                const selected = s.id === studyId;
                return (
                  <li key={s.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onStudyChange(s.id);
                        setOpen(false);
                      }}
                      className={`flex w-full flex-col px-3 py-2.5 text-left transition-colors hover:bg-canvas ${
                        selected ? "bg-canvas" : ""
                      }`}
                    >
                      <span className="text-xs font-semibold text-ink">{s.code}</span>
                      <span className="text-2xs text-ink-faint">
                        {s.indication} · {s.scaleAcronym}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </header>
  );
}

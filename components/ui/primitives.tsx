"use client";

import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  question,
  children,
  aside,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  question?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="mb-1 text-2xs font-medium uppercase tracking-[0.14em] text-ink-faint">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          {question ? (
            <p className="mt-1 text-sm text-ink-soft">{question}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-card border border-line bg-surface",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border border-line bg-canvas p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "rounded-[5px] font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-2xs" : "px-3 py-1.5 text-xs",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-ink-faint hover:text-ink-soft",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "watch" | "arm-t" | "arm-p";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium",
        tone === "neutral" && "border-line bg-canvas text-ink-faint",
        tone === "watch" && "border-placebo/30 bg-placebo/10 text-placebo",
        tone === "arm-t" && "border-treatment/30 bg-treatment/10 text-treatment",
        tone === "arm-p" && "border-placebo/30 bg-placebo/10 text-placebo",
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("ee-skeleton rounded", className)} />;
}

export function LegendDot({ arm }: { arm: "treatment" | "placebo" }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: arm === "treatment" ? "#2f6f6a" : "#9a6b3f" }}
    />
  );
}

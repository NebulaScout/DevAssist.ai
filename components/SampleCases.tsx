"use client";

import { AlertTriangle, Settings2 } from "lucide-react";

import { sampleCases, type SampleCase } from "@/lib/sample-data";

type SampleCasesProps = {
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  onSelect: (sampleCase: SampleCase) => void;
};

export function SampleCases({
  className,
  compact = false,
  disabled = false,
  onSelect,
}: SampleCasesProps) {
  return (
    <section aria-labelledby="sample-cases-heading" className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="sample-cases-heading"
          className="text-xs font-medium text-slate-400"
        >
          Try a sample
        </h2>
        <span className="text-[11px] text-slate-600">Loads input and mode</span>
      </div>

      <div
        className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}
      >
        {sampleCases.map((sampleCase) => {
          const Icon = sampleCase.type === "error" ? AlertTriangle : Settings2;

          return (
            <button
              key={sampleCase.buttonLabel}
              type="button"
              onClick={() => onSelect(sampleCase)}
              disabled={disabled}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left transition hover:border-blue-400/30 hover:bg-blue-400/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sampleCase.type === "error" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-300"}`}
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-slate-300">
                  {sampleCase.buttonLabel}
                </span>
                <span className="mt-0.5 block text-[11px] capitalize text-slate-600">
                  {sampleCase.type}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

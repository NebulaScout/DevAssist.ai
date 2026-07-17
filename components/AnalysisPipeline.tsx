import { Check, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PipelineStep } from "@/lib/agent-pipeline"

export type AnalysisPipelineStatus = PipelineStep | "complete"

type AnalysisPipelineProps = {
  status: AnalysisPipelineStatus | null
  className?: string
}

const steps: Array<{
  id: PipelineStep
  label: string
  description: string
}> = [
  {
    id: "analyzing",
    label: "Analyzing",
    description: "Tracing the root cause",
  },
  {
    id: "generating_fix",
    label: "Generating fix",
    description: "Preparing the smallest safe change",
  },
  {
    id: "explaining",
    label: "Explaining",
    description: "Turning the fix into a learning moment",
  },
]

const progressCopy: Record<AnalysisPipelineStatus, string> = {
  analyzing: "Reading your input and isolating the likely root cause.",
  generating_fix: "Drafting a focused, copy-ready fix.",
  explaining: "Verifying the change and explaining why it works.",
  complete: "Your diagnosis, fix, and explanation are ready.",
}

export function AnalysisPipeline({ status, className }: AnalysisPipelineProps) {
  if (!status) {
    return null
  }

  const activeIndex = steps.findIndex((step) => step.id === status)

  return (
    <section
      className={cn(
        "rounded-2xl border border-blue-400/20 bg-blue-400/[0.05] p-4 sm:p-5",
        className,
      )}
      aria-label="Analysis progress"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue-300">Agent workflow</p>
          <p className="mt-1 text-sm text-slate-300">
            {progressCopy[status]}
          </p>
        </div>
        {status !== "complete" && <LoaderCircle className="size-5 animate-spin text-blue-300" aria-hidden="true" />}
      </div>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const isComplete = status === "complete" || index < activeIndex
          const isActive = index === activeIndex

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                isComplete && "border-emerald-400/20 bg-emerald-400/[0.08]",
                isActive && "border-blue-400/30 bg-blue-400/[0.1]",
                !isComplete && !isActive && "border-white/[0.08] bg-white/[0.025]",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isComplete && "border-emerald-400/30 bg-emerald-400/20 text-emerald-300",
                  isActive && "border-blue-400/40 bg-blue-400/20 text-blue-200",
                  !isComplete && !isActive && "border-white/[0.1] text-slate-500",
                )}
              >
                {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isComplete && "text-emerald-200",
                    isActive && "text-blue-100",
                    !isComplete && !isActive && "text-slate-500",
                  )}
                >
                  {step.label}{isActive ? "…" : ""}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

type CodeDiffViewerProps = {
  className?: string
  fixed: string
  original: string
}

type CodePanelProps = {
  code: string
  label: string
  tone: "fixed" | "original"
}

function CodePanel({ code, label, tone }: CodePanelProps) {
  const isOriginal = tone === "original"
  const Icon = isOriginal ? Minus : Check
  const lines = code.split("\n")

  return (
    <section
      aria-label={`${label} code`}
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border",
        isOriginal
          ? "border-rose-400/15 bg-rose-400/[0.04]"
          : "border-emerald-400/15 bg-emerald-400/[0.04]"
      )}
    >
      <header className="flex items-center gap-2 border-b border-inherit px-4 py-2.5">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-md",
            isOriginal ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"
          )}
        >
          <Icon size={13} />
        </span>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      </header>

      <pre className="max-h-[420px] overflow-auto py-3 font-mono text-xs leading-6">
        <code>
          {lines.map((line, index) => (
            <span key={`${index}-${line}`} className="flex min-w-max px-4">
              <span className="mr-4 w-5 shrink-0 select-none text-right text-slate-600">{index + 1}</span>
              <span className={isOriginal ? "text-rose-100" : "text-emerald-100"}>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </section>
  )
}

export function CodeDiffViewer({ className, fixed, original }: CodeDiffViewerProps) {
  return (
    <section className={cn("grid gap-4 lg:grid-cols-2", className)} aria-label="Code changes">
      <CodePanel code={original} label="Original" tone="original" />
      <CodePanel code={fixed} label="Fixed" tone="fixed" />
    </section>
  )
}

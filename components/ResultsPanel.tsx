"use client"

import { Braces, CircleHelp, FileCode2, Lightbulb } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Analysis, Explanation, Fix } from "@/lib/types"

type ResultsPanelProps = {
  result: {
    analysis: Analysis
    fix: Fix
    explanation: Explanation
  }
}

const tabClassName =
  "h-9 px-3 text-xs text-slate-400 data-active:bg-white/[0.1] data-active:text-white"

function CodeBlock({ code, label, tone }: { code: string; label: string; tone: "before" | "after" }) {
  const toneClasses =
    tone === "before"
      ? "border-rose-400/15 bg-rose-400/[0.04] text-rose-100"
      : "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100"

  return (
    <section className={`overflow-hidden rounded-xl border ${toneClasses}`}>
      <p className="border-b border-inherit px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-current/70">
        {label}
      </p>
      <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs leading-6 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </section>
  )
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const { analysis, fix, explanation } = result

  return (
    <section
      className="rounded-2xl border border-white/[0.1] bg-[#0e131d] p-3 shadow-2xl shadow-black/20 sm:p-4"
      aria-label="Analysis results"
    >
      <Tabs defaultValue="root-cause">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-white/[0.05] p-1">
          <TabsTrigger value="root-cause" className={tabClassName}>
            <CircleHelp size={14} /> Root Cause
          </TabsTrigger>
          <TabsTrigger value="fix-steps" className={tabClassName}>
            <Braces size={14} /> Fix Steps
          </TabsTrigger>
          <TabsTrigger value="diff" className={tabClassName}>
            <FileCode2 size={14} /> Diff
          </TabsTrigger>
          <TabsTrigger value="why-it-works" className={tabClassName}>
            <Lightbulb size={14} /> Why It Works
          </TabsTrigger>
        </TabsList>

        <TabsContent value="root-cause" className="pt-5">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="w-fit rounded-lg border border-blue-400/20 bg-blue-400/[0.08] px-3 py-1.5 text-xs font-medium capitalize text-blue-300">
              {analysis.inputType} input
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Affected area</p>
              <p className="mt-1 font-mono text-xs text-slate-300">{analysis.affectedArea}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Root cause</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{analysis.rootCause}</p>
          </div>
        </TabsContent>

        <TabsContent value="fix-steps" className="pt-5">
          <ol className="space-y-3">
            {fix.fixSteps.map((step, index) => (
              <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-6 text-slate-200">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-400/10 text-xs font-medium text-blue-300">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {fix.changeSummary.length > 0 && (
            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Changed</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                {fix.changeSummary.map((change) => (
                  <li key={change} className="flex gap-2">
                    <span className="text-emerald-400">+</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="diff" className="pt-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock code={fix.originalCode} label="Original" tone="before" />
            <CodeBlock code={fix.fixedCode} label="Fixed" tone="after" />
          </div>
        </TabsContent>

        <TabsContent value="why-it-works" className="pt-5">
          <p className="text-sm leading-7 text-slate-200">{explanation.whyItWorks}</p>
          {explanation.conceptsToLearn.length > 0 && (
            <div className="mt-6 border-t border-white/[0.08] pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Concepts to learn</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {explanation.conceptsToLearn.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-xs text-violet-200"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}

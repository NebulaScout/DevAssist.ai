"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  FileCode2,
  GitBranch,
  Layers3,
  Lightbulb,
  Sparkles,
  Terminal,
} from "lucide-react"

import { AnalysisPipeline, type AnalysisPipelineStatus } from "@/components/AnalysisPipeline"
import { ResultsPanel } from "@/components/ResultsPanel"
import type { Analysis, Explanation, Fix } from "@/lib/types"

type InputMode = "error" | "config"

type AnalysisResult = {
  analysis: Analysis
  fix: Fix
  explanation: Explanation
}

const sampleError = `Error: Cannot find module '@/lib/db'
  at Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
  at Module._load (node:internal/modules/cjs/loader:1056:27)

Import trace:
  ./app/api/users/route.ts`

const workflow = [
  { icon: CircleHelp, label: "Analyze", detail: "Root cause & impact" },
  { icon: Braces, label: "Generate fix", detail: "Code & config changes" },
  { icon: Lightbulb, label: "Explain", detail: "Plain-language reasoning" },
]

const pipelineStatuses: AnalysisPipelineStatus[] = [
  "analyzing",
  "generating_fix",
  "explaining",
  "complete",
]

function isPipelineStatus(value: unknown): value is AnalysisPipelineStatus {
  return typeof value === "string" && pipelineStatuses.includes(value as AnalysisPipelineStatus)
}

export default function Home() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<InputMode>("error")
  const [status, setStatus] = useState<AnalysisPipelineStatus | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  async function handleAnalyze() {
    if (!input.trim() || isAnalyzing) {
      return
    }

    setError(null)
    setResult(null)
    setStatus("analyzing")
    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "Unable to analyze input")
      }

      if (!response.body) {
        throw new Error("Analysis stream was not available")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let receivedResult = false

      const handleEvent = (eventBlock: string) => {
        const eventName = eventBlock
          .split("\n")
          .find((line) => line.startsWith("event:"))
          ?.slice("event:".length)
          .trim()
        const data = eventBlock
          .split("\n")
          .find((line) => line.startsWith("data:"))
          ?.slice("data:".length)
          .trim()

        if (!eventName || !data) {
          return
        }

        const payload = JSON.parse(data) as { error?: string; status?: unknown }

        if (eventName === "progress" && isPipelineStatus(payload.status)) {
          setStatus(payload.status)
        }

        if (eventName === "result") {
          setResult(payload as AnalysisResult)
          setStatus("complete")
          receivedResult = true
        }

        if (eventName === "error") {
          throw new Error(payload.error ?? "Unable to analyze input")
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })

        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""
        events.forEach(handleEvent)

        if (done) {
          if (buffer) {
            handleEvent(buffer)
          }
          break
        }
      }

      if (!receivedResult) {
        throw new Error("Analysis finished without a result")
      }
    } catch (caughtError) {
      setStatus(null)
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyze input")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(41,98,255,0.13),transparent_65%)]" />

      <header className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between border-b border-white/[0.07] px-5 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="DevAssist home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <Sparkles size={18} strokeWidth={2.3} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">DevAssist<span className="text-blue-400">.ai</span></span>
        </a>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="hidden items-center gap-2 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Systems operational</span>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-slate-300 transition hover:border-white/20 hover:text-white">
            Docs <ArrowUpRight size={13} />
          </button>
        </div>
      </header>

      <section id="top" className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300">
            <GitBranch size={13} /> Your AI pair programmer
          </div>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-6xl">Ship with confidence.</h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-slate-400 sm:text-base">
            Paste an error or configuration. DevAssist traces the root cause, writes the fix, and explains exactly why it works.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <div className="rounded-2xl border border-white/[0.1] bg-[#0e131d]/90 p-2 shadow-2xl shadow-black/20 backdrop-blur sm:p-3">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-3 pb-3 sm:px-4">
              <div className="flex items-center gap-1 rounded-lg bg-white/[0.05] p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode("error")}
                  aria-pressed={mode === "error"}
                  className={`rounded-md px-3 py-1.5 transition ${mode === "error" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Error log
                </button>
                <button
                  type="button"
                  onClick={() => setMode("config")}
                  aria-pressed={mode === "config"}
                  className={`rounded-md px-3 py-1.5 transition ${mode === "config" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Config
                </button>
              </div>
              <button
                type="button"
                onClick={() => setInput(sampleError)}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Terminal size={13} /> Try a sample <ArrowUpRight size={12} />
              </button>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={mode === "error" ? "Paste your error or stack trace here..." : "Paste your config here..."}
              aria-label="Error or configuration input"
              disabled={isAnalyzing}
              className="min-h-[210px] w-full resize-y bg-transparent px-3 py-5 font-mono text-[13px] leading-6 text-slate-300 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
              spellCheck={false}
            />

            <div className="flex flex-col gap-3 border-t border-white/[0.07] px-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5"><FileCode2 size={13} /> Supports logs, JSON, YAML &amp; code</span>
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
              >
                {isAnalyzing ? "Analyzing…" : "Analyze"} <ArrowUpRight size={15} />
              </button>
            </div>
          </div>

          <AnalysisPipeline status={status} className="mt-5" />

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {workflow.map(({ icon: Icon, label, detail }, index) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400"><Icon size={14} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300">{index + 1}. {label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-600">{detail}</p>
                </div>
                {index < workflow.length - 1 && <span className="ml-auto hidden text-slate-700 sm:block">→</span>}
              </div>
            ))}
          </div>
        </div>

        <section className="mx-auto mt-20 max-w-4xl" aria-labelledby="results-heading">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">Workspace</p>
              <h2 id="results-heading" className="text-lg font-medium tracking-[-0.02em] text-slate-200">Analysis results</h2>
            </div>
            <button className="flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-400">Latest <ChevronDown size={13} /></button>
          </div>

          {result ? (
            <ResultsPanel result={result} />
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-6 py-5 text-sm text-rose-200">
              {error}
            </div>
          ) : (
            <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-600"><Layers3 size={20} /></span>
              <p className="text-sm font-medium text-slate-400">Your analysis will appear here</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">Run an analysis to see the root cause, suggested changes, and a clear explanation.</p>
            </div>
          )}
        </section>

        <footer className="mx-auto mt-16 flex max-w-4xl items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-slate-700">
          <span>Built for developers, by developers.</span>
          <span className="flex items-center gap-1.5"><Check size={12} /> Private by default</span>
        </footer>
      </section>
    </main>
  )
}

"use client"

import { ArrowUpRight, Bug, FileCode2, SlidersHorizontal } from "lucide-react"

export type InputMode = "error" | "config"

type InputPanelProps = {
  input: string
  isAnalyzing: boolean
  mode: InputMode
  onAnalyze: () => void
  onInputChange: (input: string) => void
  onModeChange: (mode: InputMode) => void
}

export function InputPanel({
  input,
  isAnalyzing,
  mode,
  onAnalyze,
  onInputChange,
  onModeChange,
}: InputPanelProps) {
  return (
    <section className="rounded-2xl border border-white/[0.1] bg-[#0e131d]/90 p-2 shadow-2xl shadow-black/20 backdrop-blur sm:p-3" aria-label="Analysis input">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 pb-3 sm:px-4">
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.05] p-1 text-xs font-medium" aria-label="Input mode">
          <button
            type="button"
            onClick={() => onModeChange("error")}
            aria-pressed={mode === "error"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${mode === "error" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Bug size={13} /> Debug Error
          </button>
          <button
            type="button"
            onClick={() => onModeChange("config")}
            aria-pressed={mode === "config"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${mode === "config" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
          >
            <SlidersHorizontal size={13} /> Explain Config
          </button>
        </div>
      </div>

      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={mode === "error" ? "Paste your error or stack trace here..." : "Paste your config here..."}
        aria-label={mode === "error" ? "Error input" : "Configuration input"}
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
          onClick={onAnalyze}
          disabled={!input.trim() || isAnalyzing}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
        >
          {isAnalyzing ? "Analyzing…" : "Analyze"} <ArrowUpRight size={15} />
        </button>
      </div>
    </section>
  )
}

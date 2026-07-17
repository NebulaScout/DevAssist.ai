"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  GitBranch,
  Layers3,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import {
  AnalysisPipeline,
  type AnalysisPipelineStatus,
} from "@/components/AnalysisPipeline";
import { InputPanel, type InputMode } from "@/components/InputPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SampleCases } from "@/components/SampleCases";
import type { SampleCase } from "@/lib/sample-data";
import type { Analysis, Explanation, Fix } from "@/lib/types";

type AnalysisResult = {
  analysis: Analysis;
  fix: Fix;
  explanation: Explanation;
};

type AnalysisErrorCode =
  | "api_key_missing"
  | "configuration_error"
  | "rate_limited"
  | "analysis_failed";

type AnalysisErrorPayload = {
  code?: AnalysisErrorCode;
  error?: string;
  message?: string;
  status?: unknown;
};

type ErrorState = {
  description: string;
  title: string;
};

class AnalysisRequestError extends Error {
  code?: AnalysisErrorCode;

  constructor(payload: AnalysisErrorPayload) {
    super(
      payload.message ?? payload.error ?? "We could not complete the analysis.",
    );
    this.code = payload.code;
  }
}

const workflow = [
  { icon: CircleHelp, label: "Analyze", detail: "Root cause & impact" },
  { icon: Braces, label: "Generate fix", detail: "Code & config changes" },
  { icon: Lightbulb, label: "Explain", detail: "Plain-language reasoning" },
];

const pipelineStatuses: AnalysisPipelineStatus[] = [
  "analyzing",
  "generating_fix",
  "explaining",
  "complete",
];

function isPipelineStatus(value: unknown): value is AnalysisPipelineStatus {
  return (
    typeof value === "string" &&
    pipelineStatuses.includes(value as AnalysisPipelineStatus)
  );
}

function getErrorState(error: unknown): ErrorState {
  if (error instanceof AnalysisRequestError) {
    if (error.code === "api_key_missing") {
      return {
        title: "API key missing",
        description:
          "Add your provider key to .env.local, restart the server, then run the analysis again.",
      };
    }

    if (error.code === "rate_limited") {
      return {
        title: "Rate limit reached",
        description:
          "Your AI provider needs a moment. Wait a few seconds, then try again.",
      };
    }

    if (error.code === "configuration_error") {
      return {
        title: "AI configuration needs attention",
        description:
          "Check AI_PROVIDER and AI_MODEL in .env.local, then try again.",
      };
    }
  }

  return {
    title: "Analysis unavailable",
    description:
      "We could not complete the analysis. Your input is still here. Please try again.",
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<InputMode>("error");
  const [status, setStatus] = useState<AnalysisPipelineStatus | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function handleSampleSelect(sampleCase: SampleCase) {
    setInput(sampleCase.content);
    setMode(sampleCase.type);
    setStatus(null);
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!input.trim() || isAnalyzing) {
      return;
    }

    setError(null);
    setResult(null);
    setStatus("analyzing");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      });

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as AnalysisErrorPayload;
        throw new AnalysisRequestError(payload);
      }

      if (!response.body) {
        throw new Error("Analysis stream was not available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedResult = false;

      const handleEvent = (eventBlock: string) => {
        const eventName = eventBlock
          .split("\n")
          .find((line) => line.startsWith("event:"))
          ?.slice("event:".length)
          .trim();
        const data = eventBlock
          .split("\n")
          .find((line) => line.startsWith("data:"))
          ?.slice("data:".length)
          .trim();

        if (!eventName || !data) {
          return;
        }

        const payload = JSON.parse(data) as AnalysisErrorPayload;

        if (eventName === "progress" && isPipelineStatus(payload.status)) {
          setStatus(payload.status);
        }

        if (eventName === "result") {
          setResult(payload as AnalysisResult);
          setStatus("complete");
          receivedResult = true;
        }

        if (eventName === "error") {
          throw new AnalysisRequestError(payload);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach(handleEvent);

        if (done) {
          if (buffer) {
            handleEvent(buffer);
          }
          break;
        }
      }

      if (!receivedResult) {
        throw new Error("Analysis finished without a result");
      }
    } catch (caughtError) {
      setStatus(null);
      setError(getErrorState(caughtError));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b12] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(41,98,255,0.13),transparent_65%)]" />

      <header className="relative mx-auto flex h-[76px] max-w-7xl items-center justify-between border-b border-white/[0.07] px-5 lg:px-8">
        <a
          href="#top"
          className="flex items-center gap-3"
          aria-label="DevAssist home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <Sparkles size={18} strokeWidth={2.3} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">
            DevAssist<span className="text-blue-400">.ai</span>
          </span>
        </a>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Systems
            operational
          </span>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-slate-300 transition hover:border-white/20 hover:text-white">
            Docs <ArrowUpRight size={13} />
          </button>
        </div>
      </header>

      <section
        id="top"
        className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:pt-16 lg:px-8 lg:pt-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300">
            <GitBranch size={13} /> Your AI pair programmer
          </div>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            Ship with confidence.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-slate-400 sm:text-base">
            Paste an error or configuration. DevAssist traces the root cause,
            writes the fix, and explains exactly why it works.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl lg:mt-12">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] xl:items-start">
            <InputPanel
              input={input}
              isAnalyzing={isAnalyzing}
              mode={mode}
              onAnalyze={handleAnalyze}
              onInputChange={setInput}
              onModeChange={setMode}
            />

            <SampleCases
              onSelect={handleSampleSelect}
              disabled={isAnalyzing}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-4"
              compact
            />
          </div>

          <AnalysisPipeline status={status} className="mt-5" />

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {workflow.map(({ icon: Icon, label, detail }, index) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400">
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300">
                    {index + 1}. {label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-600">
                    {detail}
                  </p>
                </div>
                {index < workflow.length - 1 && (
                  <span className="ml-auto hidden text-slate-700 sm:block">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <section
          className="mx-auto mt-16 max-w-5xl lg:mt-20"
          aria-labelledby="results-heading"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                Workspace
              </p>
              <h2
                id="results-heading"
                className="text-lg font-medium tracking-[-0.02em] text-slate-200"
              >
                Analysis results
              </h2>
            </div>
            <button className="flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-400">
              Latest <ChevronDown size={13} />
            </button>
          </div>

          {result ? (
            <ResultsPanel result={result} />
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-6 py-5"
            >
              <p className="text-sm font-medium text-rose-100">{error.title}</p>
              <p className="mt-1 text-sm leading-6 text-rose-200/80">
                {error.description}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-600">
                <Layers3 size={20} />
              </span>
              <p className="text-sm font-medium text-slate-400">
                Ready when you are
              </p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                Paste an error or configuration above, or choose a sample case
                to see the diagnosis, fix, and explanation here.
              </p>
            </div>
          )}
        </section>

        <footer className="mx-auto mt-16 flex max-w-4xl items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-slate-700">
          <span>Built for developers, by developers.</span>
          <span className="flex items-center gap-1.5">
            <Check size={12} /> Private by default
          </span>
        </footer>
      </section>
    </main>
  );
}

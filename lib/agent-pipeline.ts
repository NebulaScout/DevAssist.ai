import { generateStructuredOutput } from "@/lib/llm";
import { analyzePrompt, explainPrompt, fixPrompt } from "@/lib/prompts";
import {
  analysisSchema,
  type Analysis,
  explanationSchema,
  type Explanation,
  fixSchema,
  type Fix,
} from "@/lib/types";

export type PipelineStep = "analyzing" | "generating_fix" | "explaining";

export type AgentPipelineResult = {
  analysis: Analysis;
  fix: Fix;
  explanation: Explanation;
};

export type AgentPipelineOptions = {
  model?: string;
  onStep?: (step: PipelineStep) => void | Promise<void>;
};

export async function runAgentPipeline(
  developerInput: string,
  { model, onStep }: AgentPipelineOptions = {},
): Promise<AgentPipelineResult> {
  await onStep?.("analyzing");
  const analysis = await generateStructuredOutput({
    instructions: analyzePrompt,
    input: developerInput,
    model,
    schema: analysisSchema,
  });

  await onStep?.("generating_fix");
  const fix = await generateStructuredOutput({
    instructions: fixPrompt,
    input: JSON.stringify({ developerInput, analysis }),
    model,
    schema: fixSchema,
  });

  await onStep?.("explaining");
  const explanation = await generateStructuredOutput({
    instructions: explainPrompt,
    input: JSON.stringify({ analysis, fix }),
    model,
    schema: explanationSchema,
  });

  return { analysis, fix, explanation };
}

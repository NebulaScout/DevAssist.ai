import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

import { analyzePrompt, explainPrompt, fixPrompt } from "@/lib/prompts"
import {
  analysisSchema,
  type Analysis,
  explanationSchema,
  type Explanation,
  fixSchema,
  type Fix,
} from "@/lib/types"

export const AGENT_PIPELINE_MODEL = "gpt-5.6"

export type PipelineStep = "analyzing" | "generating_fix" | "explaining"

export type AgentPipelineResult = {
  analysis: Analysis
  fix: Fix
  explanation: Explanation
}

export type AgentPipelineOptions = {
  model?: string
  onStep?: (step: PipelineStep) => void | Promise<void>
}

export async function runAgentPipeline(
  developerInput: string,
  { model = AGENT_PIPELINE_MODEL, onStep }: AgentPipelineOptions = {},
): Promise<AgentPipelineResult> {
  const client = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"],
  })

  await onStep?.("analyzing")
  const analysisResponse = await client.responses.parse({
    model,
    instructions: analyzePrompt,
    input: developerInput,
    text: {
      format: zodTextFormat(analysisSchema, "root_cause_analysis"),
    },
  })
  const analysis = analysisSchema.parse(analysisResponse.output_parsed)

  await onStep?.("generating_fix")
  const fixResponse = await client.responses.parse({
    model,
    instructions: fixPrompt,
    input: JSON.stringify({ developerInput, analysis }),
    text: {
      format: zodTextFormat(fixSchema, "generated_fix"),
    },
  })
  const fix = fixSchema.parse(fixResponse.output_parsed)

  await onStep?.("explaining")
  const explanationResponse = await client.responses.parse({
    model,
    instructions: explainPrompt,
    input: JSON.stringify({ analysis, fix }),
    text: {
      format: zodTextFormat(explanationSchema, "fix_explanation"),
    },
  })
  const explanation = explanationSchema.parse(explanationResponse.output_parsed)

  return { analysis, fix, explanation }
}

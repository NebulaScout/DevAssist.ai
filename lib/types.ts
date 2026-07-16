import { z } from "zod"

/** Validated output from the root-cause analysis agent. */
export const analysisSchema = z.object({
  inputType: z.enum(["error", "config", "log"]),
  rootCause: z.string(),
  affectedArea: z.string(),
})

/** Validated output from the fix-generation agent. */
export const fixSchema = z.object({
  fixSteps: z.array(z.string()),
  originalCode: z.string(),
  fixedCode: z.string(),
  changeSummary: z.array(z.string()),
})

/** Validated output from the explanation agent. */
export const explanationSchema = z.object({
  whyItWorks: z.string(),
  conceptsToLearn: z.array(z.string()),
})

export type Analysis = z.infer<typeof analysisSchema>
export type Fix = z.infer<typeof fixSchema>
export type Explanation = z.infer<typeof explanationSchema>

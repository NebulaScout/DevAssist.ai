import OpenAI from "openai";
import { z } from "zod";

const providerSchema = z.enum(["groq", "openai"]);

type StructuredOutputRequest<T> = {
  instructions: string;
  input: string;
  model?: string;
  schema: z.ZodType<T>;
};

export type LlmConfiguration = {
  model: string;
  provider: z.infer<typeof providerSchema>;
};

const providerDefaults = {
  groq: {
    apiKeyName: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  openai: {
    apiKeyName: "OPENAI_API_KEY",
    model: "gpt-5-mini",
  },
} as const;

function getConfiguration(): LlmConfiguration & { apiKey: string; baseURL?: string } {
  const providerResult = providerSchema.safeParse(
    (process.env["AI_PROVIDER"] ?? "groq").toLowerCase(),
  );

  if (!providerResult.success) {
    throw new Error("AI_PROVIDER must be either 'groq' or 'openai'");
  }

  const provider = providerResult.data;
  const defaults = providerDefaults[provider];
  const apiKey = process.env[defaults.apiKeyName];

  if (!apiKey) {
    throw new Error(`${defaults.apiKeyName} is not configured`);
  }

  return {
    apiKey,
    baseURL: "baseURL" in defaults ? defaults.baseURL : undefined,
    model: process.env["AI_MODEL"] ?? defaults.model,
    provider,
  };
}

export function getLlmConfiguration(): LlmConfiguration {
  const configuration = getConfiguration();
  return {
    model: configuration.model,
    provider: configuration.provider,
  };
}

/**
 * Produces JSON through an OpenAI-compatible Chat Completions endpoint, then
 * validates it with the caller's Zod schema. Invalid model output is retried once.
 */
export async function generateStructuredOutput<T>({
  instructions,
  input,
  model: modelOverride,
  schema,
}: StructuredOutputRequest<T>): Promise<T> {
  const { apiKey, baseURL, model } = getConfiguration();
  const client = new OpenAI({ apiKey, baseURL });
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await client.chat.completions.create({
      model: modelOverride ?? model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message.content;

    if (!content) {
      lastError = new Error("The model returned an empty response");
      continue;
    }

    try {
      return schema.parse(JSON.parse(content));
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error("The model returned invalid structured output", {
    cause: lastError,
  });
}

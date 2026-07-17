import { z } from "zod";

import { runAgentPipeline } from "@/lib/agent-pipeline";
import { getLlmConfiguration } from "@/lib/llm";

const encoder = new TextEncoder();

type AnalysisErrorCode = "api_key_missing" | "configuration_error" | "rate_limited" | "analysis_failed";

type AnalysisError = {
  code: AnalysisErrorCode;
  error: string;
  message: string;
};

const analyzeRequestSchema = z.object({
  input: z
    .string()
    .refine((value) => value.trim().length > 0, "Input must not be empty"),
  mode: z.enum(["error", "config", "log"]),
});

function getAnalysisError(error: unknown): AnalysisError {
  const message = error instanceof Error ? error.message : "";
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;

  if (message.includes("API_KEY") && message.includes("not configured")) {
    return {
      code: "api_key_missing",
      error: "API key missing",
      message: "Add your AI provider API key to .env.local, then restart the development server.",
    };
  }

  if (status === 429 || /rate limit|too many requests/i.test(message)) {
    return {
      code: "rate_limited",
      error: "Rate limit reached",
      message: "Your AI provider is receiving too many requests. Wait a moment, then try again.",
    };
  }

  if (message.includes("AI_PROVIDER")) {
    return {
      code: "configuration_error",
      error: "AI configuration needs attention",
      message: "Check AI_PROVIDER and AI_MODEL in .env.local, then try again.",
    };
  }

  return {
    code: "analysis_failed",
    error: "Analysis unavailable",
    message: "We could not complete the analysis. Your input is still here—please try again.",
  };
}

export async function POST(request: Request) {
  try {
    getLlmConfiguration();
  } catch (error) {
    return Response.json(getAnalysisError(error), { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsedRequest = analyzeRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return Response.json(
      {
        error: "Invalid analysis request",
        details: z.treeifyError(parsedRequest.error),
      },
      { status: 400 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const result = await runAgentPipeline(parsedRequest.data.input, {
          onStep: (status) => send("progress", { status }),
        });

        send("result", { mode: parsedRequest.data.mode, ...result });
      } catch (error) {
        console.error("Agent pipeline failed", error);
        send("error", getAnalysisError(error));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

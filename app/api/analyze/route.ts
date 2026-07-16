import { z } from "zod";

import { runAgentPipeline } from "@/lib/agent-pipeline";

const encoder = new TextEncoder();

const analyzeRequestSchema = z.object({
  input: z
    .string()
    .refine((value) => value.trim().length > 0, "Input must not be empty"),
  mode: z.enum(["error", "config", "log"]),
});

export async function POST(request: Request) {
  if (!process.env["OPENAI_API_KEY"]) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
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
        send("error", { error: "Unable to analyze input" });
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

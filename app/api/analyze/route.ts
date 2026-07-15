import OpenAI from "openai";

// const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function POST(request: Request) {
  // const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
  });

  if (!client.apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();

  const { code } = body;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: code }],
      max_tokens: 1024,
    });

    if (!response || !response.choices) {
      return Response.json(
        { error: "No response from OpenAI" },
        { status: 500 },
      );
    }

    return Response.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    return Response.json(
      { error: "OpenAI request failed", details: error },
      { status: 500 },
    );
  }
}
//   return Response.json(
//     { error: "OpenAI request failed", details: error },
//     { status: response.status },
//   );
// }
//   return Response.json({ message: "connected" });
// }

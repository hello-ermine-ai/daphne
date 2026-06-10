import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Daphne's friendly homework helper! Daphne is in elementary school (ages 6-10).

Rules:
- Use simple, clear words a young child understands
- Be encouraging and positive — always cheer her on
- Keep answers short (2-4 sentences max unless she needs more)
- Use fun emojis sometimes
- If she's wrong, gently guide her to the right answer instead of just saying "wrong"
- Never do her homework for her — help her understand and figure it out herself`;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return Response.json({ message: text });
}

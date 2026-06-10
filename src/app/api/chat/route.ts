import Anthropic from "@anthropic-ai/sdk";
import { difficultyLabel } from "@/lib/levels";

const client = new Anthropic();

function systemPrompt(mode: string, difficulty: number) {
  const level = difficultyLabel(difficulty);
  const base = `You are Daphne's friendly learning helper! Daphne is in elementary school (ages 6-10).
Rules:
- Use simple, clear words a young child understands
- Be encouraging and positive — always cheer her on
- Use fun emojis sometimes
- Never do her work for her — help her understand`;

  if (mode === "homework") {
    return base + "\n- Keep answers short (2-4 sentences). If she's wrong, guide her gently.";
  }

  if (mode === "practice") {
    return base + `\n- Generate ${level} difficulty questions for a ${level.toLowerCase()} student.
- For Math at ${level}: ${
      difficulty === 1 ? "single digit addition/subtraction" :
      difficulty === 2 ? "double digit addition, simple multiplication tables" :
      difficulty === 3 ? "multi-digit multiplication, basic division, simple fractions" :
      "fractions, decimals, word problems"
    }
- For Spelling at ${level}: ${
      difficulty === 1 ? "simple 3-4 letter words (cat, dog, sun, run)" :
      difficulty === 2 ? "5-6 letter words (happy, apple, friend, school)" :
      difficulty === 3 ? "7-8 letter words (amazing, science, together)" :
      "challenging words (beautiful, necessary, Wednesday)"
    }
- For Reading at ${level}: ${
      difficulty === 1 ? "very short sentences, simple words" :
      difficulty === 2 ? "short paragraph comprehension" :
      difficulty === 3 ? "longer passage with inference questions" :
      "complex passage with critical thinking"
    }`;
  }

  if (mode === "flashcards") {
    return base + `\n- Create fun, memorable flashcards for a ${level.toLowerCase()} student.
- Keep answers short and clear.`;
  }

  return base;
}

export async function POST(request: Request) {
  const { messages, mode = "homework", difficulty = 1 } = await request.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt(mode, difficulty),
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return Response.json({ message: text });
}

import { supabase } from "@/lib/supabase";
import { starsForCorrect } from "@/lib/levels";

export async function POST(request: Request) {
  const { sessionId, subject, question, userAnswer, correct } = await request.json();

  const { data: prog } = await supabase
    .from("progress")
    .select("*")
    .eq("subject", subject)
    .single();

  if (!prog) return Response.json({ error: "Subject not found" }, { status: 404 });

  const starsEarned = correct ? starsForCorrect(prog.difficulty) : 0;
  const consecutiveCorrect = correct ? prog.consecutive_correct + 1 : 0;
  const consecutiveWrong = correct ? 0 : prog.consecutive_wrong + 1;

  // Adaptive: level up after 3 correct in a row, level down after 2 wrong
  let newDifficulty = prog.difficulty;
  let levelUp = false;
  if (consecutiveCorrect >= 3 && prog.difficulty < 4) {
    newDifficulty = prog.difficulty + 1;
    levelUp = true;
  } else if (consecutiveWrong >= 2 && prog.difficulty > 1) {
    newDifficulty = prog.difficulty - 1;
  }

  await supabase.from("attempts").insert({
    session_id: sessionId,
    subject,
    question,
    user_answer: userAnswer,
    correct,
    difficulty: prog.difficulty,
    stars_earned: starsEarned,
  });

  await supabase.from("progress").update({
    difficulty: newDifficulty,
    consecutive_correct: levelUp ? 0 : consecutiveCorrect,
    consecutive_wrong: consecutiveWrong,
    total_correct: prog.total_correct + (correct ? 1 : 0),
    total_attempts: prog.total_attempts + 1,
    total_stars: prog.total_stars + starsEarned,
    updated_at: new Date().toISOString(),
  }).eq("subject", subject);

  const today = new Date().toISOString().split("T")[0];
  await supabase.rpc("increment_daily_attempts", { p_date: today });

  return Response.json({
    starsEarned,
    totalStars: prog.total_stars + starsEarned,
    newDifficulty,
    levelUp,
    correct,
  });
}

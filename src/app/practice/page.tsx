"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Companion } from "@/components/Companion";
import { LevelBadge } from "@/components/LevelBadge";
import { LevelUpConfetti, triggerConfetti } from "@/components/Confetti";
import { getLevel } from "@/lib/levels";

const SUBJECTS = [
  { name: "Math",     emoji: "🔢", color: "blue"   },
  { name: "Spelling", emoji: "🔤", color: "purple" },
  { name: "Reading",  emoji: "📖", color: "green"  },
];

type Mood = "happy" | "sad" | "celebrating" | "thinking" | "levelup";
type Question = { question: string; answer: string };

export default function PracticePage() {
  const [subject, setSubject] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<Mood>("happy");
  const [starsEarned, setStarsEarned] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const sessionStarted = useRef(false);

  useEffect(() => {
    if (subject && !sessionStarted.current) {
      sessionStarted.current = true;
      fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", subject }),
      }).then(r => r.json()).then(d => setSessionId(d.sessionId));
    }

    if (subject) {
      fetch("/api/progress").then(r => r.json()).then(data => {
        const prog = data.progress?.find((p: { subject: string; difficulty: number }) => p.subject === subject);
        if (prog) { setDifficulty(prog.difficulty); setTotalStars(data.totalStars); }
      });
    }

    return () => {
      if (sessionId) {
        fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end", sessionId }),
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const getQuestion = useCallback(async (subj: string, diff: number) => {
    setQuestion(null); setUserAnswer(""); setFeedback(""); setLevelUp(false);
    setMood("thinking"); setLoading(true);

    const prompt = `Give me one ${subj} practice question.
Respond ONLY with valid JSON: {"question": "...", "answer": "..."}
Keep it simple and fun for a child.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], mode: "practice", difficulty: diff }),
    });
    const data = await res.json();
    try {
      const parsed = JSON.parse(data.message.replace(/```json\n?|\n?```/g, "").trim());
      setQuestion(parsed);
    } catch {
      setQuestion({ question: data.message, answer: "" });
    }
    setMood("happy"); setLoading(false);
  }, []);

  async function checkAnswer() {
    if (!question || !userAnswer.trim() || !subject) return;
    setLoading(true); setMood("thinking");

    const prompt = `Question: "${question.question}"
Correct answer: "${question.answer}"
Daphne's answer: "${userAnswer}"
Is she correct? Reply with JSON: {"correct": true/false, "feedback": "short encouraging message"}`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], mode: "practice", difficulty }),
    });
    const data = await res.json();

    let correct = false;
    let feedbackText = data.message;
    try {
      const parsed = JSON.parse(data.message.replace(/```json\n?|\n?```/g, "").trim());
      correct = parsed.correct;
      feedbackText = parsed.feedback;
    } catch {
      correct = data.message.toLowerCase().includes("correct") || data.message.includes("✓");
    }

    setFeedback(feedbackText);
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));

    const result = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, subject, question: question.question, userAnswer, correct }),
    }).then(r => r.json());

    setTotalStars(result.totalStars);
    if (correct) {
      setStarsEarned(result.starsEarned);
      if (result.levelUp) {
        setDifficulty(result.newDifficulty);
        setMood("levelup"); setLevelUp(true);
        setTimeout(() => { setMood("celebrating"); }, 2000);
      } else {
        setMood("celebrating"); triggerConfetti();
      }
    } else {
      setMood("sad");
      if (result.newDifficulty < difficulty) setDifficulty(result.newDifficulty);
    }

    setLoading(false);
  }

  const level = getLevel(difficulty);

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto p-6">
      {levelUp && <LevelUpConfetti />}

      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-2xl">←</Link>
        <span className="text-3xl">✏️</span>
        <h1 className="text-3xl font-bold text-blue-600">Practice</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-yellow-500 font-bold">⭐ {totalStars}</span>
        </div>
      </div>

      {!subject ? (
        <div className="space-y-4">
          <p className="text-xl text-gray-500">Pick a subject:</p>
          {SUBJECTS.map(s => (
            <button key={s.name} onClick={() => { setSubject(s.name); getQuestion(s.name, difficulty); }}
              className="w-full bg-blue-100 border-4 border-blue-300 rounded-3xl p-6 text-2xl font-bold text-blue-700 hover:scale-105 transition-transform text-left">
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <LevelBadge subject={subject} difficulty={difficulty} />
            <span className="text-gray-500 text-sm">
              {score.correct}/{score.total} correct
            </span>
            <button onClick={() => { setSubject(null); sessionStarted.current = false; }}
              className="text-gray-400 hover:text-gray-600 text-sm">
              ← Change
            </button>
          </div>

          <div className="flex justify-center py-2">
            <Companion mood={mood} />
          </div>

          {levelUp && (
            <div className="bg-purple-100 border-4 border-purple-300 rounded-3xl p-4 text-center animate-bounce">
              <p className="text-2xl font-bold text-purple-700">
                🚀 Level Up! You are now {level.name}! {level.emoji}
              </p>
            </div>
          )}

          <div className="bg-white rounded-3xl border-4 border-blue-200 p-6 space-y-4">
            {loading && !question && (
              <p className="text-gray-400 text-center text-lg py-8">Getting your question... 🎯</p>
            )}

            {question && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                    {level.emoji} {level.name}
                  </span>
                  <span className="text-blue-400 text-xs">+{[1,2,3,5][difficulty-1]} ⭐ if correct</span>
                </div>
                <p className="text-xl font-semibold text-gray-800">{question.question}</p>
                <input
                  className="w-full border-4 border-blue-300 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400"
                  placeholder="Your answer..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !feedback && checkAnswer()}
                  disabled={!!feedback}
                />
                {!feedback ? (
                  <button onClick={checkAnswer} disabled={loading}
                    className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-lg disabled:opacity-50">
                    Check! ✓
                  </button>
                ) : (
                  <>
                    {starsEarned > 0 && (
                      <div className="text-center text-2xl font-bold text-yellow-500 animate-bounce">
                        +{starsEarned} ⭐
                      </div>
                    )}
                    <div className={`rounded-2xl p-4 text-lg ${starsEarned > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                      {feedback}
                    </div>
                    <button onClick={() => getQuestion(subject, difficulty)} disabled={loading}
                      className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-lg">
                      Next question →
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

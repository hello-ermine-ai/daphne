"use client";

import { useState } from "react";
import Link from "next/link";

const SUBJECTS = ["Math", "Spelling", "Reading"];

type Question = { question: string; answer: string };

export default function PracticePage() {
  const [subject, setSubject] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function getQuestion(subj: string) {
    setSubject(subj);
    setQuestion(null);
    setUserAnswer("");
    setFeedback("");
    setLoading(true);

    const prompt = `Give me one ${subj} practice question for an elementary school student (age 6-10).
    Respond ONLY with valid JSON in this exact format: {"question": "...", "answer": "..."}
    Keep the question simple and fun.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    try {
      const parsed = JSON.parse(data.message.replace(/```json\n?|\n?```/g, "").trim());
      setQuestion(parsed);
    } catch {
      setQuestion({ question: data.message, answer: "" });
    }
    setLoading(false);
  }

  async function checkAnswer() {
    if (!question || !userAnswer.trim()) return;
    setLoading(true);

    const prompt = `Question: "${question.question}"
Correct answer: "${question.answer}"
Daphne's answer: "${userAnswer}"

Is Daphne correct? Give short, encouraging feedback (1-2 sentences). If wrong, gently give the right answer.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    setFeedback(data.message);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-2xl">←</Link>
        <span className="text-3xl">✏️</span>
        <h1 className="text-3xl font-bold text-blue-600">Practice</h1>
      </div>

      {!subject ? (
        <div className="space-y-4">
          <p className="text-xl text-gray-500 mb-4">Pick a subject to practice:</p>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => getQuestion(s)}
              className="w-full bg-blue-100 border-4 border-blue-300 rounded-3xl p-6 text-2xl font-bold text-blue-700 hover:scale-105 transition-transform text-left"
            >
              {s === "Math" ? "🔢" : s === "Spelling" ? "🔤" : "📖"} {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-4 border-blue-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-blue-500">{subject}</span>
            <button onClick={() => setSubject(null)} className="text-gray-400 hover:text-gray-600">
              ← Change subject
            </button>
          </div>

          {loading && !question && (
            <p className="text-gray-400 text-center text-lg py-8">Getting your question... 🎯</p>
          )}

          {question && (
            <>
              <p className="text-xl font-semibold text-gray-800">{question.question}</p>
              <input
                className="w-full border-4 border-blue-300 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400"
                placeholder="Your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              />
              <div className="flex gap-3">
                <button
                  onClick={checkAnswer}
                  disabled={loading}
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-lg disabled:opacity-50"
                >
                  Check!
                </button>
                <button
                  onClick={() => getQuestion(subject)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-lg disabled:opacity-50"
                >
                  Next question
                </button>
              </div>
              {feedback && (
                <div className="bg-blue-50 rounded-2xl p-4 text-blue-800 text-lg">
                  ⭐ {feedback}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}

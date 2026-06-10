"use client";

import { useState } from "react";
import Link from "next/link";

type Card = { front: string; back: string };

export default function StudyPage() {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateCards() {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setCurrent(0);
    setFlipped(false);

    const prompt = `Make 5 flashcards about "${topic}" for an elementary school student (age 6-10).
    Respond ONLY with valid JSON array: [{"front": "question or term", "back": "simple answer"}, ...]
    Keep everything very simple and fun.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    try {
      const parsed = JSON.parse(data.message.replace(/```json\n?|\n?```/g, "").trim());
      setCards(parsed);
    } catch {
      setCards([{ front: "Oops!", back: "Try a different topic" }]);
    }
    setLoading(false);
  }

  const card = cards[current];

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-2xl">←</Link>
        <span className="text-3xl">🃏</span>
        <h1 className="text-3xl font-bold text-green-600">Flashcards</h1>
      </div>

      {cards.length === 0 ? (
        <div className="space-y-4">
          <p className="text-xl text-gray-500">What do you want to study today?</p>
          <input
            className="w-full border-4 border-green-300 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-green-400"
            placeholder="e.g. Animals, Solar System, Multiplication..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateCards()}
          />
          <button
            onClick={generateCards}
            disabled={loading}
            className="w-full bg-green-400 hover:bg-green-500 text-white font-bold py-4 rounded-2xl text-xl disabled:opacity-50"
          >
            {loading ? "Making your cards... 🎨" : "Make Flashcards!"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between text-gray-400">
            <span>Topic: <strong className="text-gray-600">{topic}</strong></span>
            <span>Card {current + 1} of {cards.length}</span>
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            className="bg-white border-4 border-green-300 rounded-3xl p-10 text-center cursor-pointer hover:scale-105 transition-transform min-h-48 flex flex-col items-center justify-center"
          >
            <p className="text-sm text-green-400 mb-3">
              {flipped ? "Answer 👇" : "Tap to flip!"}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {flipped ? card.back : card.front}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCurrent(Math.max(0, current - 1)); setFlipped(false); }}
              disabled={current === 0}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-lg disabled:opacity-30"
            >
              ← Back
            </button>
            {current < cards.length - 1 ? (
              <button
                onClick={() => { setCurrent(current + 1); setFlipped(false); }}
                className="flex-1 bg-green-400 hover:bg-green-500 text-white font-bold py-3 rounded-2xl text-lg"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => { setCards([]); setTopic(""); }}
                className="flex-1 bg-purple-400 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-lg"
              >
                Study another topic! 🌟
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

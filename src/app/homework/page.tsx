"use client";

import { useState } from "react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };

export default function HomeworkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated }),
    });
    const data = await res.json();
    setMessages([...updated, { role: "assistant", content: data.message }]);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-2xl">←</Link>
        <span className="text-3xl">📚</span>
        <h1 className="text-3xl font-bold text-yellow-600">Homework Help</h1>
      </div>

      <div className="flex-1 bg-white rounded-3xl border-4 border-yellow-200 p-4 mb-4 min-h-80 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8 text-lg">
            👋 Hi! Ask me any question about your homework!
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-2xl px-4 py-3 max-w-xs text-base ${
              m.role === "user"
                ? "bg-yellow-400 text-yellow-900"
                : "bg-gray-100 text-gray-800"
            }`}>
              {m.role === "assistant" && <span className="mr-1">⭐</span>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-400">
              ⭐ Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border-4 border-yellow-300 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-yellow-400"
          placeholder="Type your question here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-6 py-3 rounded-2xl text-lg disabled:opacity-50"
        >
          Ask!
        </button>
      </div>
    </main>
  );
}

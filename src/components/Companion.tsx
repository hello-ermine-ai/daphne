"use client";

type Mood = "happy" | "sad" | "celebrating" | "thinking" | "levelup";

const MOODS: Record<Mood, { emoji: string; animation: string; message: string }> = {
  happy:       { emoji: "🐱", animation: "animate-bounce",      message: "You're doing great!" },
  celebrating: { emoji: "🎉", animation: "animate-spin",        message: "Amazing job!" },
  levelup:     { emoji: "🚀", animation: "animate-ping",        message: "You leveled up!!" },
  thinking:    { emoji: "🤔", animation: "animate-pulse",       message: "Hmm, let me think..." },
  sad:         { emoji: "😅", animation: "animate-bounce",      message: "Almost! Try again!" },
};

export function Companion({ mood }: { mood: Mood }) {
  const m = MOODS[mood];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-5xl ${m.animation}`}>{m.emoji}</div>
      <p className="text-sm text-gray-500 font-medium">{m.message}</p>
    </div>
  );
}

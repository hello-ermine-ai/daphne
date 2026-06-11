"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface TimerCelebrationProps {
  starsEarned: number;
  correctCount: number;
  totalCount: number;
  timerSeconds: number;
  onPlayAgain: (seconds: number) => void;
  onContinue: () => void;
}

export function TimerCelebration({
  starsEarned,
  correctCount,
  totalCount,
  timerSeconds,
  onPlayAgain,
  onContinue,
}: TimerCelebrationProps) {
  useEffect(() => {
    if (starsEarned > 0) {
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } }), 400);
    }
  }, [starsEarned]);

  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const minutes = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeLabel = secs === 0 ? `${minutes} min` : `${minutes}:${String(secs).padStart(2, "0")}`;

  const grade =
    accuracy >= 90 ? { emoji: "🏆", label: "SUPERSTAR!", color: "text-yellow-600" } :
    accuracy >= 70 ? { emoji: "🌟", label: "Great job!", color: "text-blue-600" } :
    accuracy >= 50 ? { emoji: "😊", label: "Good try!", color: "text-green-600" } :
    { emoji: "💪", label: "Keep going!", color: "text-purple-600" };

  return (
    <div className="bg-white border-4 border-purple-300 rounded-3xl p-8 text-center space-y-5 animate-in">
      <div className="text-6xl animate-bounce">{grade.emoji}</div>
      <h2 className={`text-3xl font-bold ${grade.color}`}>{grade.label}</h2>
      <p className="text-gray-500">Time&apos;s up for your {timeLabel} challenge!</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-yellow-600">⭐ {starsEarned}</div>
          <div className="text-yellow-500 text-xs mt-1">Stars Earned</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-green-600">{correctCount}</div>
          <div className="text-green-500 text-xs mt-1">Correct</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
          <div className="text-blue-500 text-xs mt-1">Accuracy</div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onPlayAgain(timerSeconds)}
          className="w-full bg-purple-400 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl text-xl transition-transform hover:scale-105"
        >
          🔄 Play Again ({timeLabel})
        </button>
        <button
          onClick={onContinue}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-lg"
        >
          Continue without timer
        </button>
      </div>
    </div>
  );
}

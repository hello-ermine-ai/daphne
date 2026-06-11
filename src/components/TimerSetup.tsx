"use client";

interface TimerSetupProps {
  onStart: (seconds: number) => void;
  onSkip: () => void;
}

const PRESETS = [
  { label: "1 min", emoji: "⚡", seconds: 60 },
  { label: "2 min", emoji: "⏱️", seconds: 120 },
  { label: "5 min", emoji: "🚀", seconds: 300 },
];

export function TimerSetup({ onStart, onSkip }: TimerSetupProps) {
  return (
    <div className="bg-purple-50 border-4 border-purple-200 rounded-3xl p-6 text-center space-y-4">
      <div className="text-4xl">⏰</div>
      <h2 className="text-xl font-bold text-purple-700">Want a timer challenge?</h2>
      <p className="text-purple-500 text-sm">See how many stars you can earn before time runs out!</p>
      <div className="flex gap-3 justify-center">
        {PRESETS.map(p => (
          <button
            key={p.seconds}
            onClick={() => onStart(p.seconds)}
            className="flex-1 bg-purple-400 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-lg transition-transform hover:scale-105"
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-gray-400 hover:text-gray-600 text-sm underline"
      >
        No thanks, practice without timer
      </button>
    </div>
  );
}

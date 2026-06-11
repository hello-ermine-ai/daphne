"use client";

import { useEffect, useState, useRef } from "react";

interface CountdownTimerProps {
  seconds: number;
  onTimeUp: () => void;
  onDismiss: () => void;
}

export function CountdownTimer({ seconds, onTimeUp, onDismiss }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const calledTimeUp = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!calledTimeUp.current) {
        calledTimeUp.current = true;
        onTimeUp();
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = timeLeft / seconds;

  const color =
    pct > 0.5 ? "text-green-500" :
    pct > 0.25 ? "text-yellow-500" :
    "text-red-500";

  const ringColor =
    pct > 0.5 ? "stroke-green-400" :
    pct > 0.25 ? "stroke-yellow-400" :
    "stroke-red-400";

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl border-4 border-gray-200 px-3 py-2">
      {/* Ring */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            className={ringColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span className={`text-xs font-bold ${color}`}>
          {minutes}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-sm text-gray-500 font-medium">⏱️ Timer</span>
      <button
        onClick={onDismiss}
        className="ml-1 text-gray-300 hover:text-gray-500 text-lg leading-none"
        title="Remove timer"
      >
        ✕
      </button>
    </div>
  );
}

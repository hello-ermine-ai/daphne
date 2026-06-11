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
    calledTimeUp.current = false;
    setTimeLeft(seconds);
  }, [seconds]);

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
  const isUrgent = pct <= 0.25 && timeLeft > 0;

  const bg = pct > 0.5 ? "bg-green-100 border-green-300" :
             pct > 0.25 ? "bg-yellow-100 border-yellow-300" :
             "bg-red-100 border-red-300 animate-pulse";

  const textColor = pct > 0.5 ? "text-green-700" :
                    pct > 0.25 ? "text-yellow-700" :
                    "text-red-700";

  return (
    <div className={`flex items-center justify-between w-full border-4 rounded-3xl px-6 py-4 ${bg}`}>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{isUrgent ? "⚡" : "⏱️"}</span>
        <div>
          <p className="text-sm text-gray-500 font-medium">Time left</p>
          <p className={`text-4xl font-bold tabular-nums ${textColor}`}>
            {minutes}:{secs.toString().padStart(2, "0")}
          </p>
        </div>
      </div>
      {isUrgent && (
        <span className={`text-lg font-bold ${textColor}`}>Hurry!</span>
      )}
      <button
        onClick={onDismiss}
        className="text-gray-300 hover:text-gray-500 text-2xl leading-none"
        title="Remove timer"
      >
        ✕
      </button>
    </div>
  );
}

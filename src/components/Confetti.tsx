"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function triggerConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
}

export function LevelUpConfetti() {
  useEffect(() => {
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
    setTimeout(() => confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 } }), 300);
  }, []);
  return null;
}

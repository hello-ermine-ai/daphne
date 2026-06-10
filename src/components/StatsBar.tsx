"use client";

import { useEffect, useState } from "react";
import { LevelBadge } from "./LevelBadge";

type Progress = { subject: string; difficulty: number; total_stars: number; total_correct: number; total_attempts: number };

export function StatsBar() {
  const [data, setData] = useState<{ totalStars: number; streak: number; progress: Progress[] } | null>(null);

  useEffect(() => {
    fetch("/api/progress").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <div className="flex justify-center gap-6 mb-4">
        <div className="flex items-center gap-2 bg-yellow-100 rounded-2xl px-4 py-2">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-bold text-yellow-700">{data.totalStars}</span>
          <span className="text-yellow-600 text-sm">stars</span>
        </div>
        <div className="flex items-center gap-2 bg-orange-100 rounded-2xl px-4 py-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-orange-700">{data.streak}</span>
          <span className="text-orange-600 text-sm">day streak</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {data.progress?.map(p => (
          <LevelBadge key={p.subject} subject={p.subject} difficulty={p.difficulty} />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getLevel } from "@/lib/levels";

type Progress = { subject: string; difficulty: number; total_stars: number; total_correct: number; total_attempts: number };
type DailyUsage = { date: string; minutes_spent: number; attempts_count: number };
type Stats = { progress: Progress[]; usage: DailyUsage[]; totalStars: number; totalMinutes: number; todayUsage: DailyUsage | null };

export default function ParentPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/parent").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-xl">Loading...</p>
    </main>
  );

  const todayMinutes = stats.todayUsage?.minutes_spent ?? 0;
  const weekUsage = stats.usage?.slice(0, 7) ?? [];
  const totalWeekMinutes = weekUsage.reduce((s, d) => s + d.minutes_spent, 0);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">👩‍👧</span>
        <h1 className="text-4xl font-bold text-purple-700">Daphne's Progress</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-100 rounded-3xl p-5 text-center">
          <div className="text-3xl font-bold text-yellow-700">{stats.totalStars}</div>
          <div className="text-yellow-600 text-sm">Total Stars ⭐</div>
        </div>
        <div className="bg-blue-100 rounded-3xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-700">{todayMinutes}</div>
          <div className="text-blue-600 text-sm">Minutes Today</div>
        </div>
        <div className="bg-green-100 rounded-3xl p-5 text-center">
          <div className="text-3xl font-bold text-green-700">{totalWeekMinutes}</div>
          <div className="text-green-600 text-sm">Minutes This Week</div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4">Subject Progress</h2>
      <div className="space-y-4 mb-8">
        {stats.progress?.map(p => {
          const level = getLevel(p.difficulty);
          const rate = p.total_attempts > 0 ? Math.round((p.total_correct / p.total_attempts) * 100) : 0;
          return (
            <div key={p.subject} className="bg-white rounded-3xl border-4 border-gray-200 p-5">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xl font-bold text-gray-800">{p.subject}</span>
                  <span className={`text-sm font-bold ${level.color}`}>{level.name}</span>
                </div>
                <span className="text-yellow-600 font-bold">⭐ {p.total_stars}</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-500 mb-2">
                <span>{p.total_attempts} questions</span>
                <span>{p.total_correct} correct</span>
                <span className="font-bold text-green-600">{rate}% accuracy</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${rate}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4">Last 7 Days</h2>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split("T")[0];
          const day = stats.usage?.find(u => u.date === dateStr);
          const mins = day?.minutes_spent ?? 0;
          const height = Math.min(100, (mins / 30) * 100);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-full bg-gray-100 rounded-xl overflow-hidden h-16 flex items-end">
                <div className="w-full bg-purple-400 rounded-xl" style={{ height: `${height}%` }} />
              </div>
              <span className="text-xs text-gray-500">{d.toLocaleDateString("en", { weekday: "short" })}</span>
              <span className="text-xs font-bold text-gray-600">{mins}m</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

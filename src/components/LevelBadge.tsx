import { getLevel } from "@/lib/levels";

export function LevelBadge({ subject, difficulty }: { subject: string; difficulty: number }) {
  const level = getLevel(difficulty);
  return (
    <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1 border-2 border-gray-200 text-sm font-bold">
      <span>{level.emoji}</span>
      <span className={level.color}>{subject}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-600">{level.name}</span>
    </div>
  );
}

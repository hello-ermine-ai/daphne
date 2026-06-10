export const LEVELS = [
  { difficulty: 1, name: "Beginner", emoji: "🌱", color: "text-green-500" },
  { difficulty: 2, name: "Explorer", emoji: "🌟", color: "text-blue-500" },
  { difficulty: 3, name: "Champion", emoji: "🚀", color: "text-purple-500" },
  { difficulty: 4, name: "Legend",   emoji: "💎", color: "text-yellow-500" },
];

export function getLevel(difficulty: number) {
  return LEVELS[Math.min(difficulty, 4) - 1];
}

export function starsForCorrect(difficulty: number): number {
  return [1, 2, 3, 5][Math.min(difficulty, 4) - 1];
}

export function difficultyLabel(difficulty: number): string {
  const labels = ["Easy", "Medium", "Hard", "Expert"];
  return labels[Math.min(difficulty, 4) - 1];
}

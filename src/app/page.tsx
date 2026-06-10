import Link from "next/link";
import { StatsBar } from "@/components/StatsBar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">⭐</div>
        <h1 className="text-5xl font-bold text-purple-600 mb-2">Hi Daphne!</h1>
        <p className="text-xl text-gray-500">What would you like to do today?</p>
      </div>

      <StatsBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        <Link href="/homework">
          <div className="bg-yellow-100 border-4 border-yellow-300 rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-yellow-700">Homework Help</h2>
            <p className="text-yellow-600 mt-2">Ask me anything!</p>
          </div>
        </Link>

        <Link href="/practice">
          <div className="bg-blue-100 border-4 border-blue-300 rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-5xl mb-4">✏️</div>
            <h2 className="text-2xl font-bold text-blue-700">Practice</h2>
            <p className="text-blue-600 mt-2">Earn stars!</p>
          </div>
        </Link>

        <Link href="/study">
          <div className="bg-green-100 border-4 border-green-300 rounded-3xl p-8 text-center hover:scale-105 transition-transform cursor-pointer">
            <div className="text-5xl mb-4">🃏</div>
            <h2 className="text-2xl font-bold text-green-700">Flashcards</h2>
            <p className="text-green-600 mt-2">Study any topic</p>
          </div>
        </Link>
      </div>
    </main>
  );
}

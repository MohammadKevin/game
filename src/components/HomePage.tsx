'use client'

import Link from 'next/link'
import { useAllHighScores, useHighScore } from '@/lib/storage'

const GAMES = [
  {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    description: 'Classic snake game. Eat food, grow longer, avoid walls!',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    hoverColor: 'hover:border-green-400/60',
  },
  {
    id: '2048',
    name: '2048',
    emoji: '🔢',
    description: 'Slide and merge tiles to reach 2048!',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    hoverColor: 'hover:border-yellow-400/60',
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    emoji: '💣',
    description: 'Find all safe cells without hitting a mine!',
    color: 'from-red-500/20 to-pink-500/20 border-red-500/30',
    hoverColor: 'hover:border-red-400/60',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    emoji: '🧱',
    description: 'Stack blocks and clear lines! A timeless classic.',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    hoverColor: 'hover:border-cyan-400/60',
  },
]

export default function HomePage() {
  const highScores = useAllHighScores()

  return (
    <div className="flex-1 flex flex-col">
      <header className="text-center py-8 md:py-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in">
          Game Hub
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base animate-fade-in">
          Pick a game and have fun!
        </p>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              className={`group block p-6 rounded-2xl bg-gradient-to-br ${game.color} border ${game.hoverColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fade-in`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{game.emoji}</span>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold group-hover:text-white transition-colors">
                    {game.name}
                  </h2>
                  {highScores[game.id] ? (
                    <p className="text-xs text-warning font-mono">
                      High Score: {highScores[game.id]}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">No score yet</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                {game.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            All scores are saved locally in your browser
          </p>
        </div>
      </main>
    </div>
  )
}

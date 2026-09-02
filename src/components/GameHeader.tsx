'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GAME_NAMES: Record<string, string> = {
  snake: 'Snake',
  '2048': '2048',
  minesweeper: 'Minesweeper',
  tetris: 'Tetris',
}

export default function GameHeader() {
  const pathname = usePathname()
  const gameId = pathname.split('/')[1]
  const gameName = GAME_NAMES[gameId] || gameId

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card-bg/50 backdrop-blur-sm sticky top-0 z-50">
      <Link
        href="/"
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </Link>
      <h1 className="text-lg font-bold text-white">{gameName}</h1>
      <div className="w-16" />
    </header>
  )
}

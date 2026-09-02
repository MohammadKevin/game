'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { addScore, useHighScore } from '@/lib/storage'

type Board = number[][]

const SIZE = 4

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandomTile(board: Board): Board {
  const newBoard = board.map((row) => [...row])
  const empty: [number, number][] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (newBoard[r][c] === 0) empty.push([r, c])
    }
  }
  if (empty.length === 0) return newBoard
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4
  return newBoard
}

function slide(row: number[]): { result: number[]; score: number } {
  let arr = row.filter((v) => v !== 0)
  let score = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      score += arr[i]
      arr[i + 1] = 0
    }
  }
  arr = arr.filter((v) => v !== 0)
  while (arr.length < SIZE) arr.push(0)
  return { result: arr, score }
}

function rotateBoard(board: Board): Board {
  const n = board.length
  const result = createEmptyBoard()
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = board[r][c]
    }
  }
  return result
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0
  let moved = false
  const newBoard = board.map((row) => {
    const { result, score } = slide(row)
    totalScore += score
    if (result.some((v, i) => v !== row[i])) moved = true
    return result
  })
  return { board: newBoard, score: totalScore, moved }
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; score: number; moved: boolean } {
  let b = board.map((r) => [...r])
  const rotations: Record<string, number> = { left: 0, up: 1, right: 2, down: 3 }
  for (let i = 0; i < rotations[dir]; i++) b = rotateBoard(b)
  const result = moveLeft(b)
  let nb = result.board
  for (let i = 0; i < (4 - rotations[dir]) % 4; i++) nb = rotateBoard(nb)
  const moved = board.some((row, r) => row.some((v, c) => v !== nb[r][c]))
  return { board: nb, score: result.score, moved }
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true
    }
  }
  return false
}

function has2048(board: Board): boolean {
  return board.some((row) => row.some((v) => v >= 2048))
}

const TILE_COLORS: Record<number, string> = {
  0: 'bg-[#1a1a2e]',
  2: 'bg-[#eee4da] text-[#776e65]',
  4: 'bg-[#ede0c8] text-[#776e65]',
  8: 'bg-[#f2b179] text-white',
  16: 'bg-[#f59563] text-white',
  32: 'bg-[#f67c5f] text-white',
  64: 'bg-[#f65e3b] text-white',
  128: 'bg-[#edcf72] text-white',
  256: 'bg-[#edcc61] text-white',
  512: 'bg-[#edc850] text-white',
  1024: 'bg-[#edc53f] text-white',
  2048: 'bg-[#edc22e] text-white',
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(createEmptyBoard)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [started, setStarted] = useState(false)
  const highScore = useHighScore('2048')
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const startGame = useCallback(() => {
    let b = createEmptyBoard()
    b = addRandomTile(b)
    b = addRandomTile(b)
    setBoard(b)
    setScore(0)
    setGameOver(false)
    setWon(false)
    setStarted(true)
  }, [])

  const handleMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return
    setBoard((prev) => {
      const result = move(prev, dir)
      if (!result.moved) return prev
      const newBoard = addRandomTile(result.board)
      setScore((s) => s + result.score)
      if (has2048(newBoard) && !won) setWon(true)
      if (!canMove(newBoard)) {
        setGameOver(true)
      }
      return newBoard
    })
  }, [gameOver, won])

  useEffect(() => {
    if (gameOver && score > 0) {
      addScore('2048', score)
    }
  }, [gameOver, score])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      if (!started) {
        if (e.key === ' ') startGame()
        return
      }
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': handleMove('left'); break
        case 'ArrowRight': case 'd': case 'D': handleMove('right'); break
        case 'ArrowUp': case 'w': case 'W': handleMove('up'); break
        case 'ArrowDown': case 's': case 'S': handleMove('down'); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [started, handleMove, startGame])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleMove('right')
      else if (dx < -30) handleMove('left')
    } else {
      if (dy > 30) handleMove('down')
      else if (dy < -30) handleMove('up')
    }
    touchStart.current = null
  }

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex justify-between w-full max-w-[min(85vw,400px)] px-1">
        <div className="text-lg font-bold">Score: <span className="text-accent">{score}</span></div>
        <div className="text-lg font-bold">Best: <span className="text-warning">{Math.max(highScore, score)}</span></div>
      </div>

      <div
        className="grid grid-cols-4 gap-2 p-2 bg-[#0d0d1a] rounded-xl border-2 border-card-border touch-none"
        style={{ width: 'min(85vw, 400px)', height: 'min(85vw, 400px)' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {board.flat().map((val, i) => (
          <div
            key={i}
            className={`flex items-center justify-center rounded-lg font-bold transition-all ${TILE_COLORS[val] || 'bg-[#3c3a32] text-white'} ${val > 0 ? 'animate-pop' : ''}`}
            style={{ fontSize: val >= 1024 ? 'clamp(0.8rem, 3vw, 1.2rem)' : 'clamp(1rem, 4vw, 1.8rem)' }}
          >
            {val > 0 ? val : ''}
          </div>
        ))}
      </div>

      {!started && (
        <button
          onClick={startGame}
          className="px-6 py-3 bg-accent hover:bg-accent-hover rounded-lg font-bold text-white transition-colors text-lg"
        >
          Start Game
        </button>
      )}

      {(gameOver || won) && (
        <div className="text-center">
          <div className={`text-2xl font-bold mb-2 ${won ? 'text-success' : 'text-danger'}`}>
            {won ? 'You Win!' : 'Game Over!'}
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-accent hover:bg-accent-hover rounded-lg font-bold text-white transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      <p className="text-sm text-gray-400 text-center px-4">
        Use arrow keys / WASD or swipe to move tiles
      </p>
    </div>
  )
}

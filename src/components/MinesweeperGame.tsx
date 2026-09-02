'use client'

import { useState, useCallback, useEffect } from 'react'
import { addScore, useHighScore } from '@/lib/storage'

type CellState = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type Difficulty = 'easy' | 'medium' | 'hard'

const CONFIGS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 30 },
  hard: { rows: 16, cols: 16, mines: 60 },
}

function createBoard(rows: number, cols: number, mines: number, firstR: number, firstC: number): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  )

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (board[r][c].mine) continue
    if (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1) continue
    board[r][c].mine = true
    placed++
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++
        }
      }
      board[r][c].adjacent = count
    }
  }

  return board
}

function reveal(board: CellState[][], r: number, c: number): CellState[][] {
  const rows = board.length
  const cols = board[0].length
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))

  const stack: [number, number][] = [[r, c]]
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue
    if (newBoard[cr][cc].revealed || newBoard[cr][cc].flagged) continue
    newBoard[cr][cc].revealed = true
    if (newBoard[cr][cc].adjacent === 0 && !newBoard[cr][cc].mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          stack.push([cr + dr, cc + dc])
        }
      }
    }
  }
  return newBoard
}

const ADJ_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-purple-400',
  5: 'text-yellow-400',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-gray-400',
}

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<CellState[][] | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [firstClick, setFirstClick] = useState(true)
  const [flagMode, setFlagMode] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const highScore = useHighScore('minesweeper')

  const config = CONFIGS[difficulty]

  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(() => setTimer((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [timerRunning])

  const startGame = useCallback(() => {
    setBoard(
      Array.from({ length: config.rows }, () =>
        Array.from({ length: config.cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
      )
    )
    setGameOver(false)
    setWon(false)
    setFirstClick(true)
    setTimer(0)
    setTimerRunning(false)
  }, [config])

  useEffect(() => {
    startGame()
  }, [startGame])

  const checkWin = useCallback((b: CellState[][]) => {
    const allRevealed = b.every((row) =>
      row.every((cell) => cell.revealed || cell.mine)
    )
    if (allRevealed) {
      setWon(true)
      setGameOver(true)
      setTimerRunning(false)
      const score = Math.max(1, 1000 - timer * 10 + config.mines * 20)
      addScore('minesweeper', score)
    }
  }, [timer, config.mines])

  const handleClick = useCallback((r: number, c: number) => {
    if (gameOver || !board) return
    const cell = board[r][c]

    if (flagMode) {
      if (cell.revealed) return
      const newBoard = board.map((row) => row.map((cl) => ({ ...cl })))
      newBoard[r][c].flagged = !newBoard[r][c].flagged
      setBoard(newBoard)
      return
    }

    if (cell.flagged || cell.revealed) return

    if (firstClick) {
      const newBoard = createBoard(config.rows, config.cols, config.mines, r, c)
      const revealed = reveal(newBoard, r, c)
      setBoard(revealed)
      setFirstClick(false)
      setTimerRunning(true)
      checkWin(revealed)
      return
    }

    if (cell.mine) {
      const newBoard = board.map((row) => row.map((cl) => ({ ...cl })))
      for (const row of newBoard) for (const cl of row) if (cl.mine) cl.revealed = true
      setBoard(newBoard)
      setGameOver(true)
      setTimerRunning(false)
      return
    }

    const newBoard = reveal(board, r, c)
    setBoard(newBoard)
    checkWin(newBoard)
  }, [board, gameOver, firstClick, flagMode, config, checkWin])

  const flagCount = board ? board.flat().filter((c) => c.flagged).length : 0
  const cellSize = difficulty === 'hard' ? 'w-5 h-5 text-[10px]' : difficulty === 'medium' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex gap-2 flex-wrap justify-center">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-lg font-bold capitalize transition-colors ${difficulty === d ? 'bg-accent text-white' : 'bg-card-bg border border-card-border hover:bg-accent/20'}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex justify-between w-full max-w-md px-1 gap-4">
        <div className="text-sm font-bold">Mines: <span className="text-danger">{config.mines - flagCount}</span></div>
        <div className="text-sm font-bold">Time: <span className="text-accent">{timer}s</span></div>
        <div className="text-sm font-bold">Best: <span className="text-warning">{highScore}</span></div>
      </div>

      <button
        onClick={() => setFlagMode(!flagMode)}
        className={`px-4 py-2 rounded-lg font-bold transition-colors md:hidden ${flagMode ? 'bg-warning text-black' : 'bg-card-bg border border-card-border'}`}
      >
        {flagMode ? 'Flag Mode ON' : 'Tap Mode'}
      </button>

      {board && (
        <div
          className="inline-grid gap-0.5 p-1 bg-[#0d0d1a] rounded-lg border border-card-border"
          style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (gameOver || !board || cell.revealed) return
                  const newBoard = board.map((row) => row.map((cl) => ({ ...cl })))
                  newBoard[r][c].flagged = !newBoard[r][c].flagged
                  setBoard(newBoard)
                }}
                className={`${cellSize} flex items-center justify-center font-bold rounded-sm transition-colors select-none ${
                  cell.revealed
                    ? cell.mine
                      ? 'bg-danger/80'
                      : 'bg-[#2a2a4a]'
                    : 'bg-card-bg hover:bg-accent/20 active:bg-accent/30 border border-card-border'
                }`}
              >
                {cell.revealed
                  ? cell.mine
                    ? '💣'
                    : cell.adjacent > 0
                      ? <span className={ADJ_COLORS[cell.adjacent]}>{cell.adjacent}</span>
                      : ''
                  : cell.flagged
                    ? '🚩'
                    : ''}
              </button>
            ))
          )}
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <div className={`text-2xl font-bold mb-2 ${won ? 'text-success' : 'text-danger animate-shake'}`}>
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

      <p className="text-xs text-gray-400 text-center">
        Left click to reveal, right click to flag (mobile: toggle flag mode)
      </p>
    </div>
  )
}

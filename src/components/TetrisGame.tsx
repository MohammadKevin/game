'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { addScore, useHighScore } from '@/lib/storage'

type Piece = number[][]
type Position = { x: number; y: number }

const PIECES: Piece[] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
]

const COLORS = [
  'bg-cyan-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-blue-400',
  'bg-red-400',
  'bg-green-400',
]

const COLS = 10
const ROWS = 20

type Board = (number | null)[][]

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function rotatePiece(piece: Piece): Piece {
  const rows = piece.length
  const cols = piece[0].length
  const result: Piece = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = piece[r][c]
    }
  }
  return result
}

function isValid(board: Board, piece: Piece, pos: Position): boolean {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (!piece[r][c]) continue
      const nr = pos.y + r
      const nc = pos.x + c
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false
      if (board[nr][nc] !== null) return false
    }
  }
  return true
}

function placePiece(board: Board, piece: Piece, pos: Position, colorIdx: number): Board {
  const newBoard = board.map((row) => [...row])
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (!piece[r][c]) continue
      newBoard[pos.y + r][pos.x + c] = colorIdx
    }
  }
  return newBoard
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const newBoard = board.filter((row) => row.some((cell) => cell === null))
  const cleared = ROWS - newBoard.length
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(null))
  }
  return { board: newBoard, cleared }
}

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard)
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [currentPos, setCurrentPos] = useState<Position>({ x: 0, y: 0 })
  const [currentColor, setCurrentColor] = useState(0)
  const [nextPieceIdx, setNextPieceIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const highScore = useHighScore('tetris')
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const lastTap = useRef<number>(0)

  const spawnPiece = useCallback((pieceIdx?: number) => {
    const idx = pieceIdx ?? Math.floor(Math.random() * PIECES.length)
    const piece = PIECES[idx]
    const pos = { x: Math.floor((COLS - piece[0].length) / 2), y: 0 }
    setNextPieceIdx(Math.floor(Math.random() * PIECES.length))
    return { piece, pos, color: idx }
  }, [])

  const startGame = useCallback(() => {
    const newBoard = createEmptyBoard()
    setBoard(newBoard)
    const { piece, pos, color } = spawnPiece()
    setCurrentPiece(piece)
    setCurrentPos(pos)
    setCurrentColor(color)
    setScore(0)
    setLevel(1)
    setLines(0)
    setGameOver(false)
    setIsPlaying(true)
    setIsPaused(false)
  }, [spawnPiece])

  const lockPiece = useCallback(() => {
    if (!currentPiece) return

    let newBoard = placePiece(board, currentPiece, currentPos, currentColor)
    const { board: clearedBoard, cleared } = clearLines(newBoard)
    newBoard = clearedBoard

    const lineScore = [0, 100, 300, 500, 800]
    const newScore = score + (lineScore[cleared] || 0) * level
    const newLines = lines + cleared
    const newLevel = Math.floor(newLines / 10) + 1

    setBoard(newBoard)
    setScore(newScore)
    setLines(newLines)
    setLevel(newLevel)

    const { piece, pos, color } = spawnPiece(nextPieceIdx)
    if (!isValid(newBoard, piece, pos)) {
      setGameOver(true)
      setIsPlaying(false)
      addScore('tetris', newScore)
      return
    }
    setCurrentPiece(piece)
    setCurrentPos(pos)
    setCurrentColor(color)
  }, [board, currentPiece, currentPos, currentColor, score, level, lines, spawnPiece, nextPieceIdx])

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused) return
    const newPos = { ...currentPos, y: currentPos.y + 1 }
    if (isValid(board, currentPiece, newPos)) {
      setCurrentPos(newPos)
    } else {
      lockPiece()
    }
  }, [currentPiece, currentPos, board, lockPiece, isPaused])

  const moveHorizontal = useCallback((dx: number) => {
    if (!currentPiece || isPaused) return
    const newPos = { ...currentPos, x: currentPos.x + dx }
    if (isValid(board, currentPiece, newPos)) {
      setCurrentPos(newPos)
    }
  }, [currentPiece, currentPos, board, isPaused])

  const rotate = useCallback(() => {
    if (!currentPiece || isPaused) return
    const rotated = rotatePiece(currentPiece)
    if (isValid(board, rotated, currentPos)) {
      setCurrentPiece(rotated)
    } else {
      for (const dx of [-1, 1, -2, 2]) {
        const newPos = { ...currentPos, x: currentPos.x + dx }
        if (isValid(board, rotated, newPos)) {
          setCurrentPiece(rotated)
          setCurrentPos(newPos)
          return
        }
      }
    }
  }, [currentPiece, currentPos, board, isPaused])

  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused) return
    let newPos = { ...currentPos }
    while (isValid(board, currentPiece, { ...newPos, y: newPos.y + 1 })) {
      newPos.y++
    }
    setCurrentPos(newPos)
    setTimeout(lockPiece, 0)
  }, [currentPiece, currentPos, board, lockPiece, isPaused])

  useEffect(() => {
    if (!isPlaying || isPaused) return
    const speed = Math.max(50, 500 - (level - 1) * 40)
    const interval = setInterval(moveDown, speed)
    return () => clearInterval(interval)
  }, [isPlaying, isPaused, level, moveDown])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
      if (!isPlaying) {
        if (e.key === ' ') startGame()
        return
      }
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': moveHorizontal(-1); break
        case 'ArrowRight': case 'd': case 'D': moveHorizontal(1); break
        case 'ArrowDown': case 's': case 'S': moveDown(); break
        case 'ArrowUp': case 'w': case 'W': rotate(); break
        case ' ': hardDrop(); break
        case 'p': case 'P': setIsPaused((p) => !p); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, moveHorizontal, moveDown, rotate, hardDrop, startGame])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y

    const now = Date.now()
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      if (now - lastTap.current < 300) {
        hardDrop()
      } else {
        rotate()
      }
      lastTap.current = now
      touchStart.current = null
      return
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) moveHorizontal(1)
      else if (dx < -30) moveHorizontal(-1)
    } else {
      if (dy > 30) moveDown()
    }
    touchStart.current = null
  }

  const displayBoard = board.map((row) => [...row])
  if (currentPiece) {
    for (let r = 0; r < currentPiece.length; r++) {
      for (let c = 0; c < currentPiece[r].length; c++) {
        if (!currentPiece[r][c]) continue
        const nr = currentPos.y + r
        const nc = currentPos.x + c
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          displayBoard[nr][nc] = currentColor
        }
      }
    }
  }

  const ghostY = (() => {
    if (!currentPiece) return currentPos.y
    let gy = currentPos.y
    while (isValid(board, currentPiece, { x: currentPos.x, y: gy + 1 })) gy++
    return gy
  })()

  if (currentPiece && ghostY !== currentPos.y) {
    for (let r = 0; r < currentPiece.length; r++) {
      for (let c = 0; c < currentPiece[r].length; c++) {
        if (!currentPiece[r][c]) continue
        const nr = ghostY + r
        const nc = currentPos.x + c
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && displayBoard[nr][nc] === null) {
          displayBoard[nr][nc] = -1
        }
      }
    }
  }

  const nextPiece = PIECES[nextPieceIdx]

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex gap-4 md:gap-8 items-start">
        <div
          className="inline-grid gap-px p-1 bg-[#0d0d1a] rounded-lg border border-card-border touch-none"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {displayBoard.flat().map((cell, i) => (
            <div
              key={i}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm ${
                cell === null
                  ? 'bg-[#1a1a2e]'
                  : cell === -1
                    ? 'bg-white/10 border border-white/20'
                    : COLORS[cell]
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Score</div>
            <div className="text-lg font-bold text-accent">{score}</div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Level</div>
            <div className="text-lg font-bold text-success">{level}</div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Lines</div>
            <div className="text-lg font-bold text-warning">{lines}</div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Best</div>
            <div className="text-lg font-bold text-danger">{Math.max(highScore, score)}</div>
          </div>
          <div className="bg-card-bg border border-card-border rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-2 text-center">Next</div>
            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${nextPiece[0].length}, 1rem)` }}>
              {nextPiece.flat().map((cell, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${cell ? COLORS[nextPieceIdx] : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <div className="text-center">
          {gameOver && <div className="text-2xl font-bold text-danger mb-2 animate-shake">Game Over!</div>}
          <button
            onClick={startGame}
            className="px-6 py-3 bg-accent hover:bg-accent-hover rounded-lg font-bold text-white transition-colors text-lg"
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="flex gap-2 md:hidden">
          <button onClick={() => moveHorizontal(-1)} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">←</button>
          <button onClick={moveDown} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">↓</button>
          <button onClick={rotate} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">↻</button>
          <button onClick={() => moveHorizontal(1)} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">→</button>
          <button onClick={hardDrop} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">⬇</button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Arrow keys/WASD to move, Space to drop, P to pause
      </p>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { addScore, useHighScore } from '@/lib/storage'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

const GRID_SIZE = 20
const INITIAL_SPEED = 150

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const highScore = useHighScore('snake')
  const directionRef = useRef<Direction>('RIGHT')
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y))
    return newFood
  }, [])

  const resetGame = useCallback(() => {
    const initial = [{ x: 10, y: 10 }]
    setSnake(initial)
    setFood(generateFood(initial))
    setDirection('RIGHT')
    directionRef.current = 'RIGHT'
    setGameOver(false)
    setScore(0)
    setSpeed(INITIAL_SPEED)
    setIsPlaying(true)
  }, [generateFood])

  const moveSnake = useCallback(() => {
    setSnake((prev) => {
      const head = { ...prev[0] }
      const dir = directionRef.current

      switch (dir) {
        case 'UP': head.y -= 1; break
        case 'DOWN': head.y += 1; break
        case 'LEFT': head.x -= 1; break
        case 'RIGHT': head.x += 1; break
      }

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true)
        setIsPlaying(false)
        return prev
      }

      if (prev.some((s) => s.x === head.x && s.y === head.y)) {
        setGameOver(true)
        setIsPlaying(false)
        return prev
      }

      const newSnake = [head, ...prev]

      if (head.x === food.x && head.y === food.y) {
        setScore((s) => {
          const newScore = s + 10
          setSpeed((sp) => Math.max(50, sp - 2))
          return newScore
        })
        setFood(generateFood(newSnake))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, generateFood])

  useEffect(() => {
    if (gameOver && score > 0) {
      addScore('snake', score)
    }
  }, [gameOver, score])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(moveSnake, speed)
    return () => clearInterval(interval)
  }, [isPlaying, speed, moveSnake])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }

      if (!isPlaying && !gameOver && e.key === ' ') {
        resetGame()
        return
      }
      if (gameOver && e.key === ' ') {
        resetGame()
        return
      }

      const current = directionRef.current
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (current !== 'DOWN') { setDirection('UP'); directionRef.current = 'UP' }
          break
        case 'ArrowDown': case 's': case 'S':
          if (current !== 'UP') { setDirection('DOWN'); directionRef.current = 'DOWN' }
          break
        case 'ArrowLeft': case 'a': case 'A':
          if (current !== 'RIGHT') { setDirection('LEFT'); directionRef.current = 'LEFT' }
          break
        case 'ArrowRight': case 'd': case 'D':
          if (current !== 'LEFT') { setDirection('RIGHT'); directionRef.current = 'RIGHT' }
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, gameOver, resetGame])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const current = directionRef.current

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && current !== 'LEFT') { setDirection('RIGHT'); directionRef.current = 'RIGHT' }
      else if (dx < -30 && current !== 'RIGHT') { setDirection('LEFT'); directionRef.current = 'LEFT' }
    } else {
      if (dy > 30 && current !== 'UP') { setDirection('DOWN'); directionRef.current = 'DOWN' }
      else if (dy < -30 && current !== 'DOWN') { setDirection('UP'); directionRef.current = 'UP' }
    }
    touchStart.current = null
  }

  const cellSize = `calc(min(80vw, 500px) / ${GRID_SIZE})`

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex justify-between w-full max-w-[min(80vw,500px)] px-1">
        <div className="text-lg font-bold">Score: <span className="text-accent">{score}</span></div>
        <div className="text-lg font-bold">Best: <span className="text-warning">{Math.max(highScore, score)}</span></div>
      </div>

      <div
        className="relative border-2 border-card-border rounded-lg overflow-hidden bg-[#0a0a1a] touch-none"
        style={{ width: `min(80vw, 500px)`, height: `min(80vw, 500px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute rounded-sm ${i === 0 ? 'bg-success' : 'bg-green-400'}`}
            style={{
              width: cellSize,
              height: cellSize,
              left: `calc(${segment.x} * ${cellSize})`,
              top: `calc(${segment.y} * ${cellSize})`,
              opacity: 1 - (i / snake.length) * 0.4,
            }}
          />
        ))}
        <div
          className="absolute bg-danger rounded-full animate-pulse"
          style={{
            width: cellSize,
            height: cellSize,
            left: `calc(${food.x} * ${cellSize})`,
            top: `calc(${food.y} * ${cellSize})`,
          }}
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            {gameOver && (
              <div className="text-2xl font-bold text-danger animate-shake">Game Over!</div>
            )}
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-accent hover:bg-accent-hover rounded-lg font-bold text-white transition-colors text-lg"
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
            <p className="text-sm text-gray-400 text-center px-4">
              Use arrow keys / WASD or swipe to move
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 md:hidden">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button onClick={() => { if (directionRef.current !== 'DOWN') { setDirection('UP'); directionRef.current = 'UP' } }} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">↑</button>
          <div />
          <button onClick={() => { if (directionRef.current !== 'RIGHT') { setDirection('LEFT'); directionRef.current = 'LEFT' } }} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">←</button>
          <button onClick={() => { if (directionRef.current !== 'UP') { setDirection('DOWN'); directionRef.current = 'DOWN' } }} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">↓</button>
          <button onClick={() => { if (directionRef.current !== 'LEFT') { setDirection('RIGHT'); directionRef.current = 'RIGHT' } }} className="w-12 h-12 bg-card-bg border border-card-border rounded-lg flex items-center justify-center text-xl active:bg-accent/30">→</button>
        </div>
      </div>
    </div>
  )
}

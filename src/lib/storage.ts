'use client'

import { useEffect, useState } from 'react'

export type GameScore = {
  game: string
  score: number
  date: string
}

const STORAGE_KEY = 'game-hub-scores'

function getScores(): GameScore[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveScores(scores: GameScore[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

export function addScore(game: string, score: number) {
  const scores = getScores()
  scores.push({ game, score, date: new Date().toISOString() })
  saveScores(scores)
}

export function getHighScore(game: string): number {
  const scores = getScores()
  const gameScores = scores.filter((s) => s.game === game)
  if (gameScores.length === 0) return 0
  return Math.max(...gameScores.map((s) => s.score))
}

export function getAllHighScores(): Record<string, number> {
  const scores = getScores()
  const result: Record<string, number> = {}
  for (const s of scores) {
    if (!result[s.game] || s.score > result[s.game]) {
      result[s.game] = s.score
    }
  }
  return result
}

export function getRecentScores(limit = 10): GameScore[] {
  const scores = getScores()
  return scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

export function clearScores() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useHighScore(game: string): number {
  const [score, setScore] = useState(0)
  useEffect(() => {
    setScore(getHighScore(game))
  }, [game])
  return score
}

export function useAllHighScores(): Record<string, number> {
  const [scores, setScores] = useState<Record<string, number>>({})
  useEffect(() => {
    setScores(getAllHighScores())
  }, [])
  return scores
}

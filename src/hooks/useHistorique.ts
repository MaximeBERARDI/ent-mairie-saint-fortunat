'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ExerciceHistorique } from '@/lib/types'

const STORAGE_KEY = 'ent-mairie:historique:v1'

function loadFromStorage(): ExerciceHistorique[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveToStorage(items: ExerciceHistorique[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export type ExerciceInput = Omit<ExerciceHistorique, 'id' | 'importedAt'>

export function useHistorique() {
  const [exercices, setExercices] = useState<ExerciceHistorique[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) setExercices(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(exercices)
  }, [exercices, hydrated])

  // Crée ou remplace un exercice (clé : année).
  const upsertExercice = useCallback((data: ExerciceInput): ExerciceHistorique => {
    const existing = exercices.find(e => e.exercice === data.exercice)
    const item: ExerciceHistorique = existing
      ? { ...existing, ...data, importedAt: new Date().toISOString() }
      : { ...data, id: `hist-${data.exercice}-${Date.now()}`, importedAt: new Date().toISOString() }
    setExercices(prev => {
      const without = prev.filter(e => e.exercice !== data.exercice)
      return [...without, item].sort((a, b) => a.exercice - b.exercice)
    })
    return item
  }, [exercices])

  const deleteExercice = useCallback((id: string) => {
    setExercices(prev => prev.filter(e => e.id !== id))
  }, [])

  // Import en masse (depuis Excel par exemple) — remplace silencieusement les exercices existants.
  const importExercices = useCallback((rows: ExerciceInput[]): number => {
    if (rows.length === 0) return 0
    setExercices(prev => {
      const map = new Map<number, ExerciceHistorique>()
      prev.forEach(e => map.set(e.exercice, e))
      rows.forEach(r => {
        const existing = map.get(r.exercice)
        const item: ExerciceHistorique = existing
          ? { ...existing, ...r, importedAt: new Date().toISOString() }
          : { ...r, id: `hist-${r.exercice}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, importedAt: new Date().toISOString() }
        map.set(r.exercice, item)
      })
      return Array.from(map.values()).sort((a, b) => a.exercice - b.exercice)
    })
    return rows.length
  }, [])

  return {
    exercices,
    hydrated,
    upsertExercice,
    deleteExercice,
    importExercices,
  }
}

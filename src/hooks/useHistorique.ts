'use client'

// Historique pluriannuel branché sur /api/historique (PostgreSQL via Prisma).
// Pattern optimistic update (cf. useTasks). L'interface (exercices, hydrated,
// upsert/delete/import) reste identique pour les consommateurs.

import { useEffect, useState, useCallback } from 'react'
import type { ExerciceHistorique } from '@/lib/types'

export type ExerciceInput = Omit<ExerciceHistorique, 'id' | 'importedAt'>

const byYear = (a: ExerciceHistorique, b: ExerciceHistorique) => a.exercice - b.exercice

export function useHistorique() {
  const [exercices, setExercices] = useState<ExerciceHistorique[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/historique')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: ExerciceHistorique[]) => {
        if (!cancelled) { setExercices(data); setHydrated(true) }
      })
      .catch(e => {
        if (!cancelled) { console.error('[useHistorique] load error:', e); setHydrated(true) }
      })
    return () => { cancelled = true }
  }, [])

  const upsertExercice = useCallback((data: ExerciceInput): ExerciceHistorique => {
    const optimistic: ExerciceHistorique = { ...data, id: `tmp-${data.exercice}`, importedAt: new Date().toISOString() }
    let previous: ExerciceHistorique[] = []
    setExercices(prev => {
      previous = prev
      return [...prev.filter(e => e.exercice !== data.exercice), optimistic].sort(byYear)
    })

    fetch('/api/historique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: ExerciceHistorique[]) => {
        const rec = saved[0]
        if (rec) setExercices(prev => prev.map(e => (e.exercice === rec.exercice ? rec : e)).sort(byYear))
      })
      .catch(e => {
        console.error('[useHistorique] upsert error:', e)
        setExercices(previous)
        alert("Impossible d'enregistrer l'exercice (droits insuffisants ?).")
      })

    return optimistic
  }, [])

  const deleteExercice = useCallback((id: string) => {
    let previous: ExerciceHistorique[] = []
    setExercices(prev => { previous = prev; return prev.filter(e => e.id !== id) })
    fetch(`/api/historique/${id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw r })
      .catch(e => {
        console.error('[useHistorique] delete error:', e)
        setExercices(previous)
        alert("Impossible de supprimer l'exercice.")
      })
  }, [])

  const importExercices = useCallback((rows: ExerciceInput[]): number => {
    if (rows.length === 0) return 0
    fetch('/api/historique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: ExerciceHistorique[]) => {
        setExercices(prev => {
          const map = new Map<number, ExerciceHistorique>()
          prev.forEach(e => map.set(e.exercice, e))
          saved.forEach(e => map.set(e.exercice, e))
          return Array.from(map.values()).sort(byYear)
        })
      })
      .catch(e => {
        console.error('[useHistorique] import error:', e)
        alert('Import impossible (droits insuffisants ?).')
      })
    return rows.length
  }, [])

  return { exercices, hydrated, upsertExercice, deleteExercice, importExercices }
}

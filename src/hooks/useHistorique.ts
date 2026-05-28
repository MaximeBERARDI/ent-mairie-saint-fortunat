'use client'

// Historique pluriannuel branché sur /api/historique.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { ExerciceHistorique } from '@/lib/types'

const KEY = '/api/historique'

export type ExerciceInput = Omit<ExerciceHistorique, 'id' | 'importedAt'>

const byYear = (a: ExerciceHistorique, b: ExerciceHistorique) => a.exercice - b.exercice

export function useHistorique() {
  const { data, mutate } = useSWR<ExerciceHistorique[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const exercices = data ?? []
  const hydrated = data !== undefined

  const upsertExercice = useCallback((dataInput: ExerciceInput): ExerciceHistorique => {
    const optimistic: ExerciceHistorique = {
      ...dataInput,
      id: `tmp-${dataInput.exercice}`,
      importedAt: new Date().toISOString(),
    }
    const previous = exercices
    mutate(
      [...previous.filter((e) => e.exercice !== dataInput.exercice), optimistic].sort(byYear),
      { revalidate: false },
    )

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInput),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: ExerciceHistorique[]) => {
        const rec = saved[0]
        if (rec) {
          mutate(
            (prev) => (prev ?? []).map((e) => (e.exercice === rec.exercice ? rec : e)).sort(byYear),
            { revalidate: false },
          )
        }
      })
      .catch((e) => {
        console.error('[useHistorique] upsert error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible d'enregistrer l'exercice (droits insuffisants ?).")
      })

    return optimistic
  }, [exercices, mutate])

  const deleteExercice = useCallback((id: string) => {
    const previous = exercices
    mutate(previous.filter((e) => e.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useHistorique] delete error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible de supprimer l'exercice.")
      })
  }, [exercices, mutate])

  const importExercices = useCallback((rows: ExerciceInput[]): number => {
    if (rows.length === 0) return 0
    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: ExerciceHistorique[]) => {
        mutate((prev) => {
          const map = new Map<number, ExerciceHistorique>()
          ;(prev ?? []).forEach((e) => map.set(e.exercice, e))
          saved.forEach((e) => map.set(e.exercice, e))
          return Array.from(map.values()).sort(byYear)
        }, { revalidate: false })
      })
      .catch((e) => {
        console.error('[useHistorique] import error:', e)
        alert('Import impossible (droits insuffisants ?).')
      })
    return rows.length
  }, [mutate])

  return { exercices, hydrated, upsertExercice, deleteExercice, importExercices }
}

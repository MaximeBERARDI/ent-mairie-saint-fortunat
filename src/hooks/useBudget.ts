'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PosteBudget, Facture } from '@/lib/types'
import { POSTES_BUDGET } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:budget:v1'

function loadFromStorage(): PosteBudget[] | null {
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

function saveToStorage(postes: PosteBudget[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(postes))
  } catch {}
}

export interface PosteWithConsumption extends PosteBudget {
  consommationFactures: number      // somme des factures Validées sur ce poste
  consommationTotale: number        // initiale + factures
  pctConsomme: number               // 0-100
  reste: number                     // budgetAlloue - consommationTotale
  enAlerte: boolean                 // > 80%
}

export function useBudget() {
  const [postes, setPostes] = useState<PosteBudget[]>(POSTES_BUDGET)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      setPostes(stored)
    } else {
      saveToStorage(POSTES_BUDGET)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(postes)
  }, [postes, hydrated])

  const updatePoste = useCallback((code: string, patch: Partial<PosteBudget>) => {
    setPostes(prev => prev.map(p => (p.code === code ? { ...p, ...patch } : p)))
  }, [])

  const createPoste = useCallback((data: PosteBudget) => {
    setPostes(prev => [...prev, data])
  }, [])

  const deletePoste = useCallback((code: string) => {
    setPostes(prev => prev.filter(p => p.code !== code))
  }, [])

  const resetPostes = useCallback(() => {
    setPostes(POSTES_BUDGET)
    saveToStorage(POSTES_BUDGET)
  }, [])

  // Combine postes + factures pour la consommation réelle.
  // Helper retourné par le hook plutôt que dérivé en useMemo : laisse le composant
  // appelant choisir quand recalculer (selon ses propres factures).
  const computePosteWithConsumption = useCallback(
    (poste: PosteBudget, factures: Facture[]): PosteWithConsumption => {
      const consoFactures = factures
        .filter(f => f.posteCode === poste.code && f.statut === 'Validée')
        .reduce((acc, f) => acc + f.montantTTC, 0)
      const consoTotale = poste.consommationInitiale + consoFactures
      const pct = poste.budgetAlloue > 0
        ? Math.round((consoTotale / poste.budgetAlloue) * 100)
        : 0
      return {
        ...poste,
        consommationFactures: consoFactures,
        consommationTotale: consoTotale,
        pctConsomme: pct,
        reste: poste.budgetAlloue - consoTotale,
        enAlerte: pct > 80,
      }
    },
    [],
  )

  return {
    postes,
    hydrated,
    createPoste,
    updatePoste,
    deletePoste,
    resetPostes,
    computePosteWithConsumption,
  }
}

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { CompteM14, Ecriture, Facture, Section, Sens } from '@/lib/types'
import { COMPTES_M14, CHAPITRES_M14 } from '@/lib/m14-plan'

const STORAGE_KEY = 'ent-mairie:budget:v2'

function loadFromStorage(): CompteM14[] | null {
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

function saveToStorage(postes: CompteM14[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(postes))
  } catch {}
}

// Vue enrichie d'un compte M14 avec ses consommations calculées.
export interface CompteWithConsumption extends CompteM14 {
  // Source 1 : consommation héritée (exercice en cours avant l'app)
  consoInitiale: number
  // Source 2 : factures validées imputées sur ce compte
  consoFactures: number
  // Source 3 : écritures comptables passées sur ce compte (tous journaux)
  // Pour les comptes de charge (sens D) : sum(debit) - sum(credit)
  // Pour les comptes de produit (sens R) : sum(credit) - sum(debit)
  consoEcritures: number
  // Total réel mouvementé (sans double-comptage : on prend max(factures, écritures)
  // car l'écriture AC d'une facture validée a déjà été ajoutée par le hook)
  consommationTotale: number
  pctConsomme: number
  reste: number
  enAlerte: boolean
}

export function useBudget() {
  const [postes, setPostes] = useState<CompteM14[]>(COMPTES_M14)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      // Merge : on garde les codes du seed à jour mais on conserve les budgets
      // saisis par la commune (s'ils existent dans le storage).
      const storedMap = new Map(stored.map(p => [p.code, p]))
      const merged = COMPTES_M14.map(p => {
        const s = storedMap.get(p.code)
        return s ? { ...p, budgetAlloue: s.budgetAlloue, consommationInitiale: s.consommationInitiale } : p
      })
      // Comptes ajoutés à la main qui ne sont pas dans le seed (au cas où)
      stored.forEach(s => {
        if (!merged.find(m => m.code === s.code)) merged.push(s)
      })
      setPostes(merged)
    } else {
      saveToStorage(COMPTES_M14)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(postes)
  }, [postes, hydrated])

  const updatePoste = useCallback((code: string, patch: Partial<CompteM14>) => {
    setPostes(prev => prev.map(p => (p.code === code ? { ...p, ...patch } : p)))
  }, [])

  const createPoste = useCallback((data: CompteM14) => {
    setPostes(prev => [...prev, data])
  }, [])

  const deletePoste = useCallback((code: string) => {
    setPostes(prev => prev.filter(p => p.code !== code))
  }, [])

  const resetPostes = useCallback(() => {
    setPostes(COMPTES_M14)
    saveToStorage(COMPTES_M14)
  }, [])

  // Calcule la consommation enrichie d'un compte à partir des factures et écritures.
  // L'écriture d'engagement générée automatiquement à la validation d'une facture
  // pèse aussi dans ecritures → on prend le max pour éviter de compter deux fois
  // une facture validée.
  const computePosteWithConsumption = useCallback(
    (poste: CompteM14, factures: Facture[], ecritures: Ecriture[] = []): CompteWithConsumption => {
      const consoFactures = factures
        .filter(f => f.posteCode === poste.code && f.statut === 'Validée')
        .reduce((acc, f) => acc + f.montantTTC, 0)

      let consoEcritures = 0
      for (const e of ecritures) {
        for (const l of e.lignes) {
          if (l.compteCode === poste.code) {
            consoEcritures += poste.sens === 'D' ? (l.debit - l.credit) : (l.credit - l.debit)
          }
        }
      }

      // Évite le double comptage : si une facture validée a généré son écriture
      // d'engagement, le montant figure dans les deux. On prend le max.
      const realisé = Math.max(consoFactures, consoEcritures)
      const consoTotale = poste.consommationInitiale + realisé
      const pct = poste.budgetAlloue > 0
        ? Math.round((consoTotale / poste.budgetAlloue) * 100)
        : 0
      return {
        ...poste,
        consoInitiale: poste.consommationInitiale,
        consoFactures,
        consoEcritures,
        consommationTotale: consoTotale,
        pctConsomme: pct,
        reste: poste.budgetAlloue - consoTotale,
        enAlerte: pct > 80,
      }
    },
    [],
  )

  // Index utilitaires
  const compteByCode = useMemo(() => {
    const m = new Map<string, CompteM14>()
    postes.forEach(p => m.set(p.code, p))
    return m
  }, [postes])

  const postesByChapitre = useMemo(() => {
    const m = new Map<string, CompteM14[]>()
    postes.forEach(p => {
      const arr = m.get(p.chapitreCode) ?? []
      arr.push(p)
      m.set(p.chapitreCode, arr)
    })
    return m
  }, [postes])

  return {
    postes,
    chapitres: CHAPITRES_M14,
    hydrated,
    createPoste,
    updatePoste,
    deletePoste,
    resetPostes,
    computePosteWithConsumption,
    compteByCode,
    postesByChapitre,
  }
}

// ─── Helpers totalisation par section / sens ────────────────────────

export function totalSectionSens(
  postes: CompteWithConsumption[],
  section: Section,
  sens: Sens,
): { budget: number; realise: number; reste: number; pct: number } {
  const filtered = postes.filter(p => p.section === section && p.sens === sens)
  const budget = filtered.reduce((acc, p) => acc + p.budgetAlloue, 0)
  const realise = filtered.reduce((acc, p) => acc + p.consommationTotale, 0)
  const reste = budget - realise
  const pct = budget > 0 ? Math.round((realise / budget) * 100) : 0
  return { budget, realise, reste, pct }
}

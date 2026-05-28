'use client'

// Plan comptable M14 branché sur /api/budget (PostgreSQL via Prisma).
// La structure du plan vient du seed (COMPTES_M14) ; les montants
// (budgetAlloue, consommationInitiale) sont édités et persistés en base.
// Pattern optimistic (cf. useTasks). computePosteWithConsumption et
// totalSectionSens restent des calculs purs côté client.

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { CompteM14, Ecriture, Facture, Section, Sens } from '@/lib/types'
import { CHAPITRES_M14 } from '@/lib/m14-plan'

// Vue enrichie d'un compte M14 avec ses consommations calculées.
export interface CompteWithConsumption extends CompteM14 {
  consoInitiale: number
  consoFactures: number
  consoEcritures: number
  consommationTotale: number
  pctConsomme: number
  reste: number
  enAlerte: boolean
}

export function useBudget() {
  const [postes, setPostes] = useState<CompteM14[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/budget')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: CompteM14[]) => { if (!cancelled) { setPostes(data); setHydrated(true) } })
      .catch(e => { if (!cancelled) { console.error('[useBudget] load error:', e); setHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  const updatePoste = useCallback((code: string, patch: Partial<CompteM14>) => {
    let previous: CompteM14[] = []
    setPostes(prev => { previous = prev; return prev.map(p => (p.code === code ? { ...p, ...patch } : p)) })
    fetch(`/api/budget/${encodeURIComponent(code)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then(r => { if (!r.ok) throw r })
      .catch(e => {
        console.error('[useBudget] update error:', e)
        setPostes(previous)
        alert('Impossible de mettre à jour le poste (droits insuffisants ?).')
      })
  }, [])

  const createPoste = useCallback((data: CompteM14) => {
    setPostes(prev => [...prev, data])
    fetch('/api/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then(r => { if (!r.ok) throw r })
      .catch(e => {
        console.error('[useBudget] create error:', e)
        setPostes(prev => prev.filter(p => p.code !== data.code))
        alert('Impossible de créer le poste.')
      })
  }, [])

  const deletePoste = useCallback((code: string) => {
    let previous: CompteM14[] = []
    setPostes(prev => { previous = prev; return prev.filter(p => p.code !== code) })
    fetch(`/api/budget/${encodeURIComponent(code)}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw r })
      .catch(e => {
        console.error('[useBudget] delete error:', e)
        setPostes(previous)
        alert('Impossible de supprimer le poste.')
      })
  }, [])

  // Le reset n'a plus de sens en mode DB (le plan vient du seed).
  const resetPostes = useCallback(() => {
    console.warn('[useBudget] resetPostes() est obsolète en mode DB.')
  }, [])

  // Calcule la consommation enrichie d'un compte à partir des factures et écritures.
  const computePosteWithConsumption = useCallback(
    (poste: CompteM14, factures: Facture[], ecritures: Ecriture[] = []): CompteWithConsumption => {
      const consoFactures = factures
        .filter(f => f.posteCode === poste.code && (f.statut === 'Validée' || f.statut === 'Payée'))
        .reduce((acc, f) => acc + f.montantTTC, 0)

      let consoEcritures = 0
      for (const e of ecritures) {
        for (const l of e.lignes) {
          if (l.compteCode === poste.code) {
            consoEcritures += poste.sens === 'D' ? (l.debit - l.credit) : (l.credit - l.debit)
          }
        }
      }

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

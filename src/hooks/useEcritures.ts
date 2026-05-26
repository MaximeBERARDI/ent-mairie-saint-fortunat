'use client'

// Écritures comptables branchées sur /api/ecritures (PostgreSQL via Prisma).
// Le numéro (unique par exercice) et l'équilibre sont gérés côté serveur ;
// la dédup des écritures auto-générées aussi (backstop), avec un pré-check
// client pour éviter d'envoyer un doublon. Pattern optimistic (cf. useTasks).

import { useEffect, useState, useCallback } from 'react'
import type { Ecriture, LigneEcriture, Facture, JournalCode } from '@/lib/types'

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// Vérifie l'équilibre débit / crédit (à 1 centime près)
export function isBalanced(lignes: LigneEcriture[]): boolean {
  const totalD = lignes.reduce((acc, l) => acc + l.debit, 0)
  const totalC = lignes.reduce((acc, l) => acc + l.credit, 0)
  return Math.abs(totalD - totalC) < 0.01 && totalD > 0
}

export interface NewEcritureInput {
  date: string
  journal: JournalCode
  libelle: string
  pieceRef?: string
  factureId?: string
  lignes: Array<Omit<LigneEcriture, 'id'>>
  createdBy: string
}

interface Payload {
  date: string
  journal: JournalCode
  libelle: string
  pieceRef?: string
  factureId?: string
  quittanceId?: string
  subventionId?: string
  lignes: Array<Omit<LigneEcriture, 'id'>>
  createdBy: string
}

export function useEcritures() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ecritures')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Ecriture[]) => { if (!cancelled) { setEcritures(data); setHydrated(true) } })
      .catch(e => { if (!cancelled) { console.error('[useEcritures] load error:', e); setHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  // Crée l'optimiste, l'ajoute, POST, puis réconcilie avec la version serveur.
  const submit = useCallback((p: Payload): Ecriture => {
    const optimistic: Ecriture = {
      id: newId('tmp'),
      numero: 0,
      exercice: new Date(p.date).getFullYear(),
      date: p.date,
      journal: p.journal,
      libelle: p.libelle,
      pieceRef: p.pieceRef,
      factureId: p.factureId,
      quittanceId: p.quittanceId,
      subventionId: p.subventionId,
      lignes: p.lignes.map(l => ({ ...l, id: newId('lig') })),
      createdAt: new Date().toISOString(),
      createdBy: p.createdBy,
    }
    setEcritures(prev => [optimistic, ...prev])

    fetch('/api/ecritures', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Ecriture) => {
        setEcritures(prev => [saved, ...prev.filter(e => e.id !== optimistic.id && e.id !== saved.id)])
      })
      .catch(e => {
        console.error('[useEcritures] create error:', e)
        setEcritures(prev => prev.filter(e => e.id !== optimistic.id))
        alert("Impossible d'enregistrer l'écriture (droits insuffisants ?).")
      })

    return optimistic
  }, [])

  const addEcriture = useCallback((input: NewEcritureInput): Ecriture | null => {
    const lignes = input.lignes.map(l => ({ ...l, id: newId('lig') }))
    if (!isBalanced(lignes)) {
      console.error('Écriture non équilibrée', lignes)
      return null
    }
    return submit({
      date: input.date, journal: input.journal, libelle: input.libelle,
      pieceRef: input.pieceRef, factureId: input.factureId,
      lignes: input.lignes, createdBy: input.createdBy,
    })
  }, [submit])

  const deleteEcriture = useCallback((id: string) => {
    let previous: Ecriture[] = []
    setEcritures(prev => { previous = prev; return prev.filter(e => e.id !== id) })
    fetch(`/api/ecritures/${id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw r })
      .catch(e => { console.error('[useEcritures] delete error:', e); setEcritures(previous); alert("Impossible de supprimer l'écriture.") })
  }, [])

  // Le retrait optimiste est fait par l'appelant ; ici on déclenche juste la
  // suppression serveur (réconciliation au prochain chargement si erreur).
  const deleteByQuery = useCallback((qs: string) => {
    fetch(`/api/ecritures?${qs}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw r })
      .catch(e => console.error('[useEcritures] bulk delete error:', e))
  }, [])

  const deleteEcrituresByFacture = useCallback((factureId: string) => {
    setEcritures(prev => prev.filter(e => e.factureId !== factureId))
    deleteByQuery(`factureId=${encodeURIComponent(factureId)}`)
  }, [deleteByQuery])

  const deleteEcrituresByQuittance = useCallback((quittanceId: string) => {
    setEcritures(prev => prev.filter(e => e.quittanceId !== quittanceId))
    deleteByQuery(`quittanceId=${encodeURIComponent(quittanceId)}`)
  }, [deleteByQuery])

  const deleteEcrituresBySubvention = useCallback((subventionId: string) => {
    setEcritures(prev => prev.filter(e => e.subventionId !== subventionId))
    deleteByQuery(`subventionId=${encodeURIComponent(subventionId)}`)
  }, [deleteByQuery])

  // ─── Génération automatique d'engagement (validation de facture) ──
  const generateEngagementFromFacture = useCallback((facture: Facture, validatorId: string): Ecriture | null => {
    const existing = ecritures.find(e => e.factureId === facture.id && e.journal === 'AC')
    if (existing) return existing
    return submit({
      date: facture.dateFacture, journal: 'AC',
      libelle: `Facture ${facture.numero}`, pieceRef: facture.numero, factureId: facture.id,
      createdBy: validatorId,
      lignes: [
        { compteCode: facture.posteCode, libelle: `Engagement — ${facture.numero}`, debit: facture.montantTTC, credit: 0 },
        { compteCode: '4011', libelle: `Fournisseur — ${facture.numero}`, debit: 0, credit: facture.montantTTC },
      ],
    })
  }, [ecritures, submit])

  // ─── Génération automatique d'encaissement de loyer (quittance payée) ──
  const generateEncaissementLoyer = useCallback((
    args: { quittanceId: string; numero: string; mois: string; total: number; createdBy: string; date: string },
  ): Ecriture | null => {
    const existing = ecritures.find(e => e.quittanceId === args.quittanceId && e.journal === 'BQ')
    if (existing) return existing
    return submit({
      date: args.date, journal: 'BQ',
      libelle: `Encaissement loyer ${args.numero}`, pieceRef: args.numero, quittanceId: args.quittanceId,
      createdBy: args.createdBy,
      lignes: [
        { compteCode: '515', libelle: `Encaissement loyer — ${args.numero}`, debit: args.total, credit: 0 },
        { compteCode: '752', libelle: `Loyer ${args.mois}`, debit: 0, credit: args.total },
      ],
    })
  }, [ecritures, submit])

  // ─── Génération automatique d'un versement de subvention ──────────
  const generateVersementSubvention = useCallback((
    args: { subventionId: string; reference: string; intitule: string; montantVersement: number; imputationCompte: string; createdBy: string; date: string },
  ): Ecriture | null => {
    if (args.montantVersement <= 0) return null
    return submit({
      date: args.date, journal: 'BQ',
      libelle: `Versement subvention ${args.reference} — ${args.intitule}`, pieceRef: args.reference, subventionId: args.subventionId,
      createdBy: args.createdBy,
      lignes: [
        { compteCode: '515', libelle: `Versement subvention — ${args.reference}`, debit: args.montantVersement, credit: 0 },
        { compteCode: args.imputationCompte, libelle: args.intitule, debit: 0, credit: args.montantVersement },
      ],
    })
  }, [submit])

  const consommationParCompte = useCallback((compteCode: string): number => {
    let total = 0
    for (const e of ecritures) {
      for (const l of e.lignes) {
        if (l.compteCode === compteCode) total += (l.debit - l.credit)
      }
    }
    return total
  }, [ecritures])

  const ecrituresParCompte = useCallback((compteCode: string): Ecriture[] => {
    return ecritures.filter(e => e.lignes.some(l => l.compteCode === compteCode))
  }, [ecritures])

  return {
    ecritures,
    hydrated,
    addEcriture,
    deleteEcriture,
    deleteEcrituresByFacture,
    deleteEcrituresByQuittance,
    deleteEcrituresBySubvention,
    generateEngagementFromFacture,
    generateEncaissementLoyer,
    generateVersementSubvention,
    consommationParCompte,
    ecrituresParCompte,
  }
}

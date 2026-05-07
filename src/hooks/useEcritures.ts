'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Ecriture, LigneEcriture, Facture, JournalCode } from '@/lib/types'

const STORAGE_KEY = 'ent-mairie:ecritures:v1'

function loadFromStorage(): Ecriture[] | null {
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

function saveToStorage(ecritures: Ecriture[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ecritures))
  } catch {}
}

function nextNumero(ecritures: Ecriture[], exercice: number): number {
  const max = ecritures
    .filter(e => e.exercice === exercice)
    .reduce((acc, e) => Math.max(acc, e.numero), 0)
  return max + 1
}

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

export function useEcritures() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) setEcritures(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(ecritures)
  }, [ecritures, hydrated])

  const addEcriture = useCallback((input: NewEcritureInput): Ecriture | null => {
    const lignes: LigneEcriture[] = input.lignes.map(l => ({
      ...l,
      id: newId('lig'),
    }))
    if (!isBalanced(lignes)) {
      console.error('Écriture non équilibrée', lignes)
      return null
    }
    const exercice = new Date(input.date).getFullYear()
    const now = new Date().toISOString()
    const ecriture: Ecriture = {
      id: newId('ec'),
      numero: nextNumero(ecritures, exercice),
      exercice,
      date: input.date,
      journal: input.journal,
      libelle: input.libelle,
      pieceRef: input.pieceRef,
      factureId: input.factureId,
      lignes,
      createdAt: now,
      createdBy: input.createdBy,
    }
    setEcritures(prev => [ecriture, ...prev])
    return ecriture
  }, [ecritures])

  const deleteEcriture = useCallback((id: string) => {
    setEcritures(prev => prev.filter(e => e.id !== id))
  }, [])

  // Suppression de toutes les écritures liées à une facture (utile au reopen)
  const deleteEcrituresByFacture = useCallback((factureId: string) => {
    setEcritures(prev => prev.filter(e => e.factureId !== factureId))
  }, [])

  // Suppression de toutes les écritures liées à une quittance
  const deleteEcrituresByQuittance = useCallback((quittanceId: string) => {
    setEcritures(prev => prev.filter(e => e.quittanceId !== quittanceId))
  }, [])

  // Suppression de toutes les écritures liées à une subvention
  const deleteEcrituresBySubvention = useCallback((subventionId: string) => {
    setEcritures(prev => prev.filter(e => e.subventionId !== subventionId))
  }, [])

  // ─── Génération automatique de loyer encaissé ────────────────────
  // Quand une quittance passe en "Payée", on génère :
  //   D 515 Trésor — banque    montant TTC
  //     C 752 Revenus des immeubles    montant TTC
  const generateEncaissementLoyer = useCallback((
    args: { quittanceId: string; numero: string; mois: string; total: number; createdBy: string; date: string },
  ): Ecriture | null => {
    const existing = ecritures.find(e => e.quittanceId === args.quittanceId && e.journal === 'BQ')
    if (existing) return existing

    const lignes: LigneEcriture[] = [
      {
        id: newId('lig'),
        compteCode: '515',
        libelle: `Encaissement loyer — ${args.numero}`,
        debit: args.total,
        credit: 0,
      },
      {
        id: newId('lig'),
        compteCode: '752',
        libelle: `Loyer ${args.mois}`,
        debit: 0,
        credit: args.total,
      },
    ]
    const exercice = new Date(args.date).getFullYear()
    const now = new Date().toISOString()
    const ecriture: Ecriture = {
      id: newId('ec'),
      numero: nextNumero(ecritures, exercice),
      exercice,
      date: args.date,
      journal: 'BQ',
      libelle: `Encaissement loyer ${args.numero}`,
      pieceRef: args.numero,
      quittanceId: args.quittanceId,
      lignes,
      createdAt: now,
      createdBy: args.createdBy,
    }
    setEcritures(prev => [ecriture, ...prev])
    return ecriture
  }, [ecritures])

  // ─── Génération automatique d'un versement de subvention ─────────
  // Quand une subvention passe en "Versée" ou "Versement partiel", on génère :
  //   D 515 Trésor — banque    montant versé
  //     C [imputationCompte]   montant versé
  // Une nouvelle écriture est créée pour CHAQUE versement (delta vs cumul précédent),
  // pas une seule globale. Permet de tracer les versements partiels.
  const generateVersementSubvention = useCallback((
    args: { subventionId: string; reference: string; intitule: string; montantVersement: number; imputationCompte: string; createdBy: string; date: string },
  ): Ecriture | null => {
    if (args.montantVersement <= 0) return null
    const lignes: LigneEcriture[] = [
      {
        id: newId('lig'),
        compteCode: '515',
        libelle: `Versement subvention — ${args.reference}`,
        debit: args.montantVersement,
        credit: 0,
      },
      {
        id: newId('lig'),
        compteCode: args.imputationCompte,
        libelle: args.intitule,
        debit: 0,
        credit: args.montantVersement,
      },
    ]
    const exercice = new Date(args.date).getFullYear()
    const now = new Date().toISOString()
    const ecriture: Ecriture = {
      id: newId('ec'),
      numero: nextNumero(ecritures, exercice),
      exercice,
      date: args.date,
      journal: 'BQ',
      libelle: `Versement subvention ${args.reference} — ${args.intitule}`,
      pieceRef: args.reference,
      subventionId: args.subventionId,
      lignes,
      createdAt: now,
      createdBy: args.createdBy,
    }
    setEcritures(prev => [ecriture, ...prev])
    return ecriture
  }, [ecritures])

  // Génère une écriture d'engagement de dépense au moment où la facture est validée :
  //   D <compte de charge>      montant TTC
  //     C 4011 (Fournisseurs — exercice courant)   montant TTC
  // (Mode "engagement" simplifié — pour une commune en M14, l'écriture
  // précise est faite par le comptable public, mais on en pose une trace
  // budgétaire et comptable cohérente côté ordonnateur.)
  const generateEngagementFromFacture = useCallback((facture: Facture, validatorId: string): Ecriture | null => {
    // Évite les doublons : si une écriture d'engagement existe déjà pour cette facture, on ne la recrée pas
    const existing = ecritures.find(e => e.factureId === facture.id && e.journal === 'AC')
    if (existing) return existing

    const lignes: LigneEcriture[] = [
      {
        id: newId('lig'),
        compteCode: facture.posteCode,
        libelle: `Engagement — ${facture.numero}`,
        debit: facture.montantTTC,
        credit: 0,
      },
      {
        id: newId('lig'),
        compteCode: '4011',
        libelle: `Fournisseur — ${facture.numero}`,
        debit: 0,
        credit: facture.montantTTC,
      },
    ]
    const exercice = new Date(facture.dateFacture).getFullYear()
    const now = new Date().toISOString()
    const ecriture: Ecriture = {
      id: newId('ec'),
      numero: nextNumero(ecritures, exercice),
      exercice,
      date: facture.dateFacture,
      journal: 'AC',
      libelle: `Facture ${facture.numero}`,
      pieceRef: facture.numero,
      factureId: facture.id,
      lignes,
      createdAt: now,
      createdBy: validatorId,
    }
    setEcritures(prev => [ecriture, ...prev])
    return ecriture
  }, [ecritures])

  // Consommation cumulée par compte (somme débits - somme crédits sur les comptes de charge,
  // l'inverse pour les comptes de produit).
  const consommationParCompte = useCallback((compteCode: string): number => {
    let total = 0
    for (const e of ecritures) {
      for (const l of e.lignes) {
        if (l.compteCode === compteCode) total += (l.debit - l.credit)
      }
    }
    return total
  }, [ecritures])

  // Toutes les écritures qui touchent un compte donné
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

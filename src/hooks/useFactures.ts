'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Facture } from '@/lib/types'
import { FACTURES } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:factures:v1'

function loadFromStorage(): Facture[] | null {
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

function saveToStorage(factures: Facture[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(factures))
  } catch {}
}

// Génère un numéro de facture incrémental basé sur l'année + le plus haut existant
function nextNumero(factures: Facture[]): string {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`
  const max = factures
    .map(f => f.numero)
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  const next = max + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export interface NewFactureInput {
  fournisseurId: string
  montantTTC: number
  posteCode: string
  dateFacture: string
  dateEcheance?: string
  submittedById: string
  notes?: string
}

export function useFactures() {
  const [factures, setFactures] = useState<Facture[]>(FACTURES)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      setFactures(stored)
    } else {
      saveToStorage(FACTURES)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(factures)
  }, [factures, hydrated])

  // Soumission : crée la facture en statut "En attente validation"
  const submitFacture = useCallback((data: NewFactureInput): Facture => {
    const now = new Date().toISOString()
    const newFacture: Facture = {
      ...data,
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numero: nextNumero(factures),
      statut: 'En attente validation',
      submittedAt: now,
      createdAt: now,
    }
    setFactures(prev => [newFacture, ...prev])
    return newFacture
  }, [factures])

  // Validation : impute la facture sur le budget
  const validateFacture = useCallback((id: string, validatorId: string) => {
    setFactures(prev => prev.map(f =>
      f.id === id
        ? { ...f, statut: 'Validée', validatedById: validatorId, validatedAt: new Date().toISOString() }
        : f,
    ))
  }, [])

  // Rejet avec motif obligatoire
  const rejectFacture = useCallback((id: string, rejectorId: string, reason: string) => {
    setFactures(prev => prev.map(f =>
      f.id === id
        ? { ...f, statut: 'Rejetée', rejectedById: rejectorId, rejectedAt: new Date().toISOString(), rejectionReason: reason }
        : f,
    ))
  }, [])

  // Annule une décision : retour en attente (utile pour les démos / corrections)
  const reopenFacture = useCallback((id: string) => {
    setFactures(prev => prev.map(f => {
      if (f.id !== id) return f
      // On retire les champs de décision et on retourne en attente
      const { validatedById: _v, validatedAt: _va, rejectedById: _r, rejectedAt: _ra, rejectionReason: _rr, ...rest } = f
      void _v; void _va; void _r; void _ra; void _rr
      return { ...rest, statut: 'En attente validation' }
    }))
  }, [])

  const updateFacture = useCallback((id: string, patch: Partial<Facture>) => {
    setFactures(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const deleteFacture = useCallback((id: string) => {
    setFactures(prev => prev.filter(f => f.id !== id))
  }, [])

  const resetFactures = useCallback(() => {
    setFactures(FACTURES)
    saveToStorage(FACTURES)
  }, [])

  return {
    factures,
    hydrated,
    submitFacture,
    validateFacture,
    rejectFacture,
    reopenFacture,
    updateFacture,
    deleteFacture,
    resetFactures,
  }
}

'use client'

// Hook gestion des subventions branché sur /api/subventions.
// Pattern optimistic update + rollback.

import { useEffect, useState, useCallback } from 'react'
import type { DemandeSubvention } from '@/lib/types'

export type NewSubventionInput = Omit<DemandeSubvention, 'id' | 'createdAt' | 'updatedAt' | 'reference'>

export function useSubventions() {
  const [subventions, setSubventions] = useState<DemandeSubvention[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/subventions')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: DemandeSubvention[]) => {
        if (!cancelled) {
          setSubventions(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useSubventions] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const createSubvention = useCallback((data: NewSubventionInput): DemandeSubvention => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: DemandeSubvention = {
      ...data,
      id: tempId,
      reference: `SUB-${new Date().getFullYear()}-…`,
      createdAt: now,
      updatedAt: now,
    }
    setSubventions((prev) => [optimistic, ...prev])

    fetch('/api/subventions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intitule: data.intitule,
        description: data.description,
        source: data.source,
        organisme: data.organisme,
        contactNom: data.contactNom,
        contactEmail: data.contactEmail,
        montantProjet: data.montantProjet,
        montantDemande: data.montantDemande,
        montantAccorde: data.montantAccorde,
        montantVerse: data.montantVerse,
        dateDepot: data.dateDepot,
        dateDecision: data.dateDecision,
        datePrevisionVersement: data.datePrevisionVersement,
        statut: data.statut,
        motifRefus: data.motifRefus,
        imputationCompte: data.imputationCompte,
        notes: data.notes,
        documents: data.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: DemandeSubvention) => {
        setSubventions((prev) => prev.map((s) => (s.id === tempId ? created : s)))
      })
      .catch((e) => {
        console.error('[useSubventions] create error:', e)
        setSubventions((prev) => prev.filter((s) => s.id !== tempId))
        alert('Impossible de créer la subvention.')
      })
    return optimistic
  }, [])

  const updateSubvention = useCallback((id: string, patch: Partial<DemandeSubvention>) => {
    let previous: DemandeSubvention[] = []
    setSubventions((prev) => {
      previous = prev
      return prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s))
    })

    fetch(`/api/subventions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intitule: patch.intitule,
        description: patch.description,
        source: patch.source,
        organisme: patch.organisme,
        contactNom: patch.contactNom,
        contactEmail: patch.contactEmail,
        montantProjet: patch.montantProjet,
        montantDemande: patch.montantDemande,
        montantAccorde: patch.montantAccorde,
        montantVerse: patch.montantVerse,
        dateDepot: patch.dateDepot,
        dateDecision: patch.dateDecision,
        datePrevisionVersement: patch.datePrevisionVersement,
        statut: patch.statut,
        motifRefus: patch.motifRefus,
        imputationCompte: patch.imputationCompte,
        notes: patch.notes,
        documents: patch.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: DemandeSubvention) => {
        setSubventions((prev) => prev.map((s) => (s.id === id ? updated : s)))
      })
      .catch((e) => {
        console.error('[useSubventions] update error:', e)
        setSubventions(previous)
        alert('Impossible de mettre à jour la subvention.')
      })
  }, [])

  const deleteSubvention = useCallback((id: string) => {
    let previous: DemandeSubvention[] = []
    setSubventions((prev) => { previous = prev; return prev.filter((s) => s.id !== id) })
    fetch(`/api/subventions/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useSubventions] delete error:', e)
        setSubventions(previous)
        alert('Impossible de supprimer la subvention.')
      })
  }, [])

  return { subventions, hydrated, createSubvention, updateSubvention, deleteSubvention }
}

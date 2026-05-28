'use client'

// Hook gestion des subventions branché sur /api/subventions.
// Pattern optimistic update + rollback.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { DemandeSubvention } from '@/lib/types'

const KEY = '/api/subventions'

export type NewSubventionInput = Omit<DemandeSubvention, 'id' | 'createdAt' | 'updatedAt' | 'reference'>

const subventionFields = (s: Partial<DemandeSubvention>) => ({
  intitule: s.intitule,
  description: s.description,
  source: s.source,
  organisme: s.organisme,
  contactNom: s.contactNom,
  contactEmail: s.contactEmail,
  montantProjet: s.montantProjet,
  montantDemande: s.montantDemande,
  montantAccorde: s.montantAccorde,
  montantVerse: s.montantVerse,
  dateDepot: s.dateDepot,
  dateDecision: s.dateDecision,
  datePrevisionVersement: s.datePrevisionVersement,
  statut: s.statut,
  motifRefus: s.motifRefus,
  imputationCompte: s.imputationCompte,
  notes: s.notes,
  documents: s.documents,
})

export function useSubventions() {
  const { data, mutate } = useSWR<DemandeSubvention[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const subventions = data ?? []
  const hydrated = data !== undefined

  const createSubvention = useCallback((dataInput: NewSubventionInput): DemandeSubvention => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: DemandeSubvention = {
      ...dataInput,
      id: tempId,
      reference: `SUB-${new Date().getFullYear()}-…`,
      createdAt: now,
      updatedAt: now,
    }
    const previous = subventions
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subventionFields(dataInput)),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: DemandeSubvention) => {
        mutate((prev) => (prev ?? []).map((s) => (s.id === tempId ? created : s)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useSubventions] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la subvention.')
      })
    return optimistic
  }, [subventions, mutate])

  const updateSubvention = useCallback((id: string, patch: Partial<DemandeSubvention>) => {
    const previous = subventions
    mutate(
      previous.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)),
      { revalidate: false },
    )

    fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subventionFields(patch)),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: DemandeSubvention) => {
        mutate((prev) => (prev ?? []).map((s) => (s.id === id ? updated : s)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useSubventions] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la subvention.')
      })
  }, [subventions, mutate])

  const deleteSubvention = useCallback((id: string) => {
    const previous = subventions
    mutate(previous.filter((s) => s.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useSubventions] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la subvention.')
      })
  }, [subventions, mutate])

  return { subventions, hydrated, createSubvention, updateSubvention, deleteSubvention }
}

'use client'

// Hook de gestion des factures branché sur /api/factures.
// Cache cross-pages via SWR : un seul fetch partagé par /finances,
// NotificationsBell, GlobalSearch, dashboard. Mutations optimistes via
// `mutate()` + rollback en cas d'erreur API.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Facture, TaskDocument } from '@/lib/types'

const FACTURES_KEY = '/api/factures'

export interface NewFactureInput {
  fournisseurId: string
  montantTTC: number
  posteCode: string
  dateFacture: string
  dateEcheance?: string
  submittedById: string
  notes?: string
  documents?: TaskDocument[]
}

export function useFactures() {
  const { data, mutate } = useSWR<Facture[]>(FACTURES_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const factures = data ?? []
  const hydrated = data !== undefined

  const submitFacture = useCallback((dataInput: NewFactureInput): Facture => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Facture = {
      id: tempId,
      numero: `FAC-${new Date().getFullYear()}-…`,
      fournisseurId: dataInput.fournisseurId,
      montantTTC: dataInput.montantTTC,
      posteCode: dataInput.posteCode,
      dateFacture: dataInput.dateFacture,
      dateEcheance: dataInput.dateEcheance,
      statut: 'En attente validation',
      submittedById: dataInput.submittedById,
      submittedAt: now,
      notes: dataInput.notes,
      documents: dataInput.documents ?? [],
      createdAt: now,
    }
    const previous = factures
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(FACTURES_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fournisseurId: dataInput.fournisseurId,
        montantTTC: dataInput.montantTTC,
        posteCode: dataInput.posteCode,
        dateFacture: dataInput.dateFacture,
        dateEcheance: dataInput.dateEcheance,
        notes: dataInput.notes,
        documents: dataInput.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Facture) => {
        mutate((prev) => (prev ?? []).map((f) => (f.id === tempId ? created : f)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useFactures] submit error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de soumettre la facture.')
      })
    return optimistic
  }, [factures, mutate])

  // Helper pour les actions de workflow : envoie une action + rollback si KO
  const patchAction = useCallback(
    (id: string, body: Record<string, unknown>, errorMsg: string) => {
      const previous = factures
      fetch(`${FACTURES_KEY}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((updated: Facture) => {
          mutate((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)), { revalidate: false })
        })
        .catch((e) => {
          console.error('[useFactures] patch error:', e)
          mutate(previous, { revalidate: false })
          alert(errorMsg)
        })
    },
    [factures, mutate],
  )

  const validateFacture = useCallback(
    (id: string, _validatorId: string) => {
      void _validatorId
      const previous = factures
      mutate(
        previous.map((f) =>
          f.id === id ? { ...f, statut: 'Validée', validatedAt: new Date().toISOString() } : f,
        ),
        { revalidate: false },
      )
      patchAction(id, { action: 'validate' }, 'Impossible de valider la facture.')
    },
    [factures, mutate, patchAction],
  )

  const rejectFacture = useCallback(
    (id: string, _rejectorId: string, reason: string) => {
      void _rejectorId
      const previous = factures
      mutate(
        previous.map((f) =>
          f.id === id
            ? { ...f, statut: 'Rejetée', rejectedAt: new Date().toISOString(), rejectionReason: reason }
            : f,
        ),
        { revalidate: false },
      )
      patchAction(id, { action: 'reject', rejectionReason: reason }, 'Impossible de rejeter la facture.')
    },
    [factures, mutate, patchAction],
  )

  const reopenFacture = useCallback(
    (id: string) => {
      const previous = factures
      mutate(
        previous.map((f) => {
          if (f.id !== id) return f
          const {
            validatedById: _v,
            validatedAt: _va,
            rejectedById: _r,
            rejectedAt: _ra,
            rejectionReason: _rr,
            ...rest
          } = f
          void _v; void _va; void _r; void _ra; void _rr
          return { ...rest, statut: 'En attente validation' }
        }),
        { revalidate: false },
      )
      patchAction(id, { action: 'reopen' }, 'Impossible de réouvrir la facture.')
    },
    [factures, mutate, patchAction],
  )

  const payFacture = useCallback(
    (id: string, _payerId: string, datePaiement: string) => {
      void _payerId
      const previous = factures
      mutate(
        previous.map((f) =>
          f.id === id ? { ...f, statut: 'Payée', paidAt: new Date().toISOString(), datePaiement } : f,
        ),
        { revalidate: false },
      )
      patchAction(id, { action: 'pay', datePaiement }, 'Impossible de marquer la facture comme payée.')
    },
    [factures, mutate, patchAction],
  )

  const unpayFacture = useCallback(
    (id: string) => {
      const previous = factures
      mutate(
        previous.map((f) => {
          if (f.id !== id) return f
          const { paidById: _p, paidAt: _pa, datePaiement: _dp, ...rest } = f
          void _p; void _pa; void _dp
          return { ...rest, statut: 'Validée' }
        }),
        { revalidate: false },
      )
      patchAction(id, { action: 'unpay' }, "Impossible d'annuler le paiement.")
    },
    [factures, mutate, patchAction],
  )

  const updateFacture = useCallback((id: string, patch: Partial<Facture>) => {
    const previous = factures
    mutate(previous.map((f) => (f.id === id ? { ...f, ...patch } : f)), { revalidate: false })

    fetch(`${FACTURES_KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fournisseurId: patch.fournisseurId,
        montantTTC: patch.montantTTC,
        posteCode: patch.posteCode,
        dateFacture: patch.dateFacture,
        dateEcheance: patch.dateEcheance,
        notes: patch.notes,
        documents: patch.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Facture) => {
        mutate((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useFactures] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la facture.')
      })
  }, [factures, mutate])

  const deleteFacture = useCallback((id: string) => {
    const previous = factures
    mutate(previous.filter((f) => f.id !== id), { revalidate: false })

    fetch(`${FACTURES_KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useFactures] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la facture.')
      })
  }, [factures, mutate])

  // No-op en mode DB (compatibilité d'interface).
  const resetFactures = useCallback(() => {
    console.warn('[useFactures] resetFactures() est obsolète en mode DB.')
  }, [])

  return {
    factures,
    hydrated,
    submitFacture,
    validateFacture,
    rejectFacture,
    reopenFacture,
    payFacture,
    unpayFacture,
    updateFacture,
    deleteFacture,
    resetFactures,
  }
}

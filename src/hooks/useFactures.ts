'use client'

// Hook de gestion des factures branché sur /api/factures.
// Pattern optimistic update + rollback en cas d'erreur API.
// L'interface publique (submit/validate/reject/reopen/update/delete)
// reste identique pour ne pas casser les pages consommatrices.

import { useEffect, useState, useCallback } from 'react'
import type { Facture, TaskDocument } from '@/lib/types'

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
  const [factures, setFactures] = useState<Facture[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/factures')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Facture[]) => {
        if (!cancelled) {
          setFactures(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useFactures] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Création / soumission. Le numero définitif et l'id sont attribués
  // par le serveur — on insère un placeholder optimiste puis on
  // synchronise.
  const submitFacture = useCallback((data: NewFactureInput): Facture => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Facture = {
      id: tempId,
      numero: `FAC-${new Date().getFullYear()}-…`,
      fournisseurId: data.fournisseurId,
      montantTTC: data.montantTTC,
      posteCode: data.posteCode,
      dateFacture: data.dateFacture,
      dateEcheance: data.dateEcheance,
      statut: 'En attente validation',
      submittedById: data.submittedById,
      submittedAt: now,
      notes: data.notes,
      documents: data.documents ?? [],
      createdAt: now,
    }
    setFactures((prev) => [optimistic, ...prev])

    fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fournisseurId: data.fournisseurId,
        montantTTC: data.montantTTC,
        posteCode: data.posteCode,
        dateFacture: data.dateFacture,
        dateEcheance: data.dateEcheance,
        notes: data.notes,
        documents: data.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Facture) => {
        setFactures((prev) => prev.map((f) => (f.id === tempId ? created : f)))
      })
      .catch((e) => {
        console.error('[useFactures] submit error:', e)
        setFactures((prev) => prev.filter((f) => f.id !== tempId))
        alert('Impossible de soumettre la facture.')
      })
    return optimistic
  }, [])

  // Helper pour les actions de workflow : envoie une action + rollback si KO
  const patchAction = useCallback(
    (id: string, body: Record<string, unknown>, errorMsg: string) => {
      let previous: Facture[] = []
      setFactures((prev) => {
        previous = prev
        return prev
      })

      fetch(`/api/factures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((updated: Facture) => {
          setFactures((prev) => prev.map((f) => (f.id === id ? updated : f)))
        })
        .catch((e) => {
          console.error('[useFactures] patch error:', e)
          setFactures(previous)
          alert(errorMsg)
        })
    },
    [],
  )

  const validateFacture = useCallback(
    (id: string, _validatorId: string) => {
      // _validatorId n'est plus utilisé (le serveur prend session.user.personId)
      // mais on conserve l'argument pour la rétrocompat de l'API du hook.
      void _validatorId
      // Optimistic update
      setFactures((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, statut: 'Validée', validatedAt: new Date().toISOString() }
            : f,
        ),
      )
      patchAction(id, { action: 'validate' }, 'Impossible de valider la facture.')
    },
    [patchAction],
  )

  const rejectFacture = useCallback(
    (id: string, _rejectorId: string, reason: string) => {
      void _rejectorId
      setFactures((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                statut: 'Rejetée',
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason,
              }
            : f,
        ),
      )
      patchAction(
        id,
        { action: 'reject', rejectionReason: reason },
        'Impossible de rejeter la facture.',
      )
    },
    [patchAction],
  )

  const reopenFacture = useCallback(
    (id: string) => {
      setFactures((prev) =>
        prev.map((f) => {
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
      )
      patchAction(id, { action: 'reopen' }, 'Impossible de réouvrir la facture.')
    },
    [patchAction],
  )

  const updateFacture = useCallback((id: string, patch: Partial<Facture>) => {
    let previous: Facture[] = []
    setFactures((prev) => {
      previous = prev
      return prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    })

    fetch(`/api/factures/${id}`, {
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
        setFactures((prev) => prev.map((f) => (f.id === id ? updated : f)))
      })
      .catch((e) => {
        console.error('[useFactures] update error:', e)
        setFactures(previous)
        alert('Impossible de mettre à jour la facture.')
      })
  }, [])

  const deleteFacture = useCallback((id: string) => {
    let previous: Facture[] = []
    setFactures((prev) => {
      previous = prev
      return prev.filter((f) => f.id !== id)
    })

    fetch(`/api/factures/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useFactures] delete error:', e)
        setFactures(previous)
        alert('Impossible de supprimer la facture.')
      })
  }, [])

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
    updateFacture,
    deleteFacture,
    resetFactures,
  }
}

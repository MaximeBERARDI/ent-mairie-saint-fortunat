'use client'

// Hook de gestion des fournisseurs branché sur l'API /api/fournisseurs
// (PostgreSQL via Prisma — plus de localStorage). Pattern optimistic
// update : modification locale immédiate puis appel API, rollback
// en cas d'erreur.

import { useEffect, useState, useCallback } from 'react'
import type { Fournisseur } from '@/lib/types'

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/fournisseurs')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Fournisseur[]) => {
        if (!cancelled) {
          setFournisseurs(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useFournisseurs] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createFournisseur = useCallback((data: Omit<Fournisseur, 'id' | 'createdAt'>): Fournisseur => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Fournisseur = { ...data, id: tempId, createdAt: now }
    setFournisseurs((prev) => [optimistic, ...prev])

    fetch('/api/fournisseurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Fournisseur) => {
        setFournisseurs((prev) => prev.map((f) => (f.id === tempId ? created : f)))
      })
      .catch((e) => {
        console.error('[useFournisseurs] create error:', e)
        setFournisseurs((prev) => prev.filter((f) => f.id !== tempId))
        alert('Impossible de créer le fournisseur.')
      })
    return optimistic
  }, [])

  const updateFournisseur = useCallback((id: string, patch: Partial<Fournisseur>) => {
    let previous: Fournisseur[] = []
    setFournisseurs((prev) => {
      previous = prev
      return prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    })

    fetch(`/api/fournisseurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useFournisseurs] update error:', e)
        setFournisseurs(previous)
        alert('Impossible de mettre à jour le fournisseur.')
      })
  }, [])

  const deleteFournisseur = useCallback((id: string) => {
    let previous: Fournisseur[] = []
    setFournisseurs((prev) => {
      previous = prev
      return prev.filter((f) => f.id !== id)
    })

    fetch(`/api/fournisseurs/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useFournisseurs] delete error:', e)
        setFournisseurs(previous)
        alert('Impossible de supprimer (fournisseur utilisé par une facture ?).')
      })
  }, [])

  // No-op en mode DB (compatibilité d'interface).
  const resetFournisseurs = useCallback(() => {
    console.warn('[useFournisseurs] resetFournisseurs() est obsolète en mode DB.')
  }, [])

  return {
    fournisseurs,
    hydrated,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur,
    resetFournisseurs,
  }
}

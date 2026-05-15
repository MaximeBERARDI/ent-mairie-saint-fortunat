'use client'

// Hook de gestion des commissions, branché sur l'API /api/commissions
// (PostgreSQL via Prisma — plus de localStorage).
//
// Pattern :
// - chargement au montage (fetch GET)
// - mutations en "optimistic update" : on modifie le state local
//   immédiatement, puis on appelle l'API. En cas d'erreur, on revient
//   en arrière (rollback) et on logue l'erreur.

import { useEffect, useState, useCallback } from 'react'
import type { Commission } from '@/lib/types'

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/commissions')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Commission[]) => {
        if (!cancelled) {
          setCommissions(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useCommissions] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createCommission = useCallback((data: Omit<Commission, 'id'>): void => {
    // Insertion optimiste avec id temporaire
    const tempId = `tmp-${Date.now()}`
    const optimistic: Commission = { ...data, id: tempId }
    setCommissions((prev) => [...prev, optimistic])

    fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        color: data.color,
        nextMeeting: data.nextMeeting,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Commission) => {
        // Remplacer l'item temporaire par celui du serveur (avec son vrai id)
        setCommissions((prev) => prev.map((c) => (c.id === tempId ? created : c)))
      })
      .catch((e) => {
        console.error('[useCommissions] create error:', e)
        // Rollback
        setCommissions((prev) => prev.filter((c) => c.id !== tempId))
        alert('Impossible de créer la commission.')
      })
  }, [])

  const updateCommission = useCallback((id: string, patch: Partial<Commission>): void => {
    let previous: Commission[] = []
    setCommissions((prev) => {
      previous = prev
      return prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    })

    fetch(`/api/commissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: patch.name,
        color: patch.color,
        nextMeeting: patch.nextMeeting,
      }),
    })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useCommissions] update error:', e)
        setCommissions(previous)
        alert('Impossible de mettre à jour la commission.')
      })
  }, [])

  const deleteCommission = useCallback((id: string): void => {
    let previous: Commission[] = []
    setCommissions((prev) => {
      previous = prev
      return prev.filter((c) => c.id !== id)
    })

    fetch(`/api/commissions/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useCommissions] delete error:', e)
        setCommissions(previous)
        alert('Impossible de supprimer la commission.')
      })
  }, [])

  return { commissions, hydrated, createCommission, updateCommission, deleteCommission }
}

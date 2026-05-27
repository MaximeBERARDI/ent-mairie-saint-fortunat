'use client'

// Hook gestion des délibérations (conseil municipal), branché sur
// /api/deliberations. Charge toutes les délibérations (l'UI filtre par
// commission). Pattern optimistic update + rollback, cohérent avec les
// autres hooks.

import { useEffect, useState, useCallback } from 'react'
import type { Deliberation } from '@/lib/types'

export function useDeliberations() {
  const [deliberations, setDeliberations] = useState<Deliberation[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/deliberations')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Deliberation[]) => {
        if (!cancelled) {
          setDeliberations(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useDeliberations] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const createDeliberation = useCallback((data: Omit<Deliberation, 'id' | 'createdAt'>): Deliberation => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Deliberation = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setDeliberations((prev) => [optimistic, ...prev])

    fetch('/api/deliberations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Deliberation) => {
        setDeliberations((prev) => prev.map((d) => (d.id === tempId ? created : d)))
      })
      .catch((e) => {
        console.error('[useDeliberations] create error:', e)
        setDeliberations((prev) => prev.filter((d) => d.id !== tempId))
        alert('Impossible de créer la délibération (droits insuffisants ?).')
      })
    return optimistic
  }, [])

  const updateDeliberation = useCallback((id: string, patch: Partial<Deliberation>) => {
    let previous: Deliberation[] = []
    setDeliberations((prev) => { previous = prev; return prev.map((d) => (d.id === id ? { ...d, ...patch } : d)) })

    fetch(`/api/deliberations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Deliberation) => {
        setDeliberations((prev) => prev.map((d) => (d.id === id ? updated : d)))
      })
      .catch((e) => {
        console.error('[useDeliberations] update error:', e)
        setDeliberations(previous)
        alert('Impossible de mettre à jour la délibération.')
      })
  }, [])

  const deleteDeliberation = useCallback((id: string) => {
    let previous: Deliberation[] = []
    setDeliberations((prev) => { previous = prev; return prev.filter((d) => d.id !== id) })
    fetch(`/api/deliberations/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useDeliberations] delete error:', e)
        setDeliberations(previous)
        alert('Impossible de supprimer la délibération.')
      })
  }, [])

  return { deliberations, hydrated, createDeliberation, updateDeliberation, deleteDeliberation }
}

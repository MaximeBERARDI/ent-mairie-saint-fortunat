'use client'

// Hook fournisseurs branché sur /api/fournisseurs.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Fournisseur } from '@/lib/types'

const KEY = '/api/fournisseurs'

export function useFournisseurs() {
  const { data, mutate } = useSWR<Fournisseur[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const fournisseurs = data ?? []
  const hydrated = data !== undefined

  const createFournisseur = useCallback((dataInput: Omit<Fournisseur, 'id' | 'createdAt'>): Fournisseur => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Fournisseur = { ...dataInput, id: tempId, createdAt: now }
    const previous = fournisseurs
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInput),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Fournisseur) => {
        mutate((prev) => (prev ?? []).map((f) => (f.id === tempId ? created : f)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useFournisseurs] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer le fournisseur.')
      })
    return optimistic
  }, [fournisseurs, mutate])

  const updateFournisseur = useCallback((id: string, patch: Partial<Fournisseur>) => {
    const previous = fournisseurs
    mutate(previous.map((f) => (f.id === id ? { ...f, ...patch } : f)), { revalidate: false })

    fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useFournisseurs] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour le fournisseur.')
      })
  }, [fournisseurs, mutate])

  const deleteFournisseur = useCallback((id: string) => {
    const previous = fournisseurs
    mutate(previous.filter((f) => f.id !== id), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useFournisseurs] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer (fournisseur utilisé par une facture ?).')
      })
  }, [fournisseurs, mutate])

  const resetFournisseurs = useCallback(() => {
    console.warn('[useFournisseurs] resetFournisseurs() est obsolète en mode DB.')
  }, [])

  return { fournisseurs, hydrated, createFournisseur, updateFournisseur, deleteFournisseur, resetFournisseurs }
}

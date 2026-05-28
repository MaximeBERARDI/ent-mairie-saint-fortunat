'use client'

// Délibérations branchées sur /api/deliberations.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Deliberation } from '@/lib/types'

const KEY = '/api/deliberations'

export function useDeliberations() {
  const { data, mutate } = useSWR<Deliberation[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const deliberations = data ?? []
  const hydrated = data !== undefined

  const createDeliberation = useCallback((dataInput: Omit<Deliberation, 'id' | 'createdAt'>): Deliberation => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Deliberation = { ...dataInput, id: tempId, createdAt: new Date().toISOString() }
    const previous = deliberations
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataInput) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Deliberation) => {
        mutate((prev) => (prev ?? []).map((d) => (d.id === tempId ? created : d)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useDeliberations] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la délibération (droits insuffisants ?).')
      })
    return optimistic
  }, [deliberations, mutate])

  const updateDeliberation = useCallback((id: string, patch: Partial<Deliberation>) => {
    const previous = deliberations
    mutate(previous.map((d) => (d.id === id ? { ...d, ...patch } : d)), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Deliberation) => {
        mutate((prev) => (prev ?? []).map((d) => (d.id === id ? updated : d)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useDeliberations] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la délibération.')
      })
  }, [deliberations, mutate])

  const deleteDeliberation = useCallback((id: string) => {
    const previous = deliberations
    mutate(previous.filter((d) => d.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useDeliberations] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la délibération.')
      })
  }, [deliberations, mutate])

  return { deliberations, hydrated, createDeliberation, updateDeliberation, deleteDeliberation }
}

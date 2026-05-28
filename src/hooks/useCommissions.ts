'use client'

// Commissions branchées sur /api/commissions.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Commission } from '@/lib/types'

const KEY = '/api/commissions'

export function useCommissions() {
  const { data, mutate } = useSWR<Commission[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const commissions = data ?? []
  const hydrated = data !== undefined

  const createCommission = useCallback((dataInput: Omit<Commission, 'id'>): void => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Commission = { ...dataInput, id: tempId }
    const previous = commissions
    mutate([...previous, optimistic], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: dataInput.name, color: dataInput.color, nextMeeting: dataInput.nextMeeting }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Commission) => {
        mutate((prev) => (prev ?? []).map((c) => (c.id === tempId ? created : c)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useCommissions] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la commission.')
      })
  }, [commissions, mutate])

  const updateCommission = useCallback((id: string, patch: Partial<Commission>): void => {
    const previous = commissions
    mutate(previous.map((c) => (c.id === id ? { ...c, ...patch } : c)), { revalidate: false })

    fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: patch.name, color: patch.color, nextMeeting: patch.nextMeeting }),
    })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useCommissions] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la commission.')
      })
  }, [commissions, mutate])

  const deleteCommission = useCallback((id: string): void => {
    const previous = commissions
    mutate(previous.filter((c) => c.id !== id), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useCommissions] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la commission.')
      })
  }, [commissions, mutate])

  return { commissions, hydrated, createCommission, updateCommission, deleteCommission }
}

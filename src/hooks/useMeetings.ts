'use client'

// Réunions de commission branchées sur /api/meetings.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Meeting } from '@/lib/types'

const KEY = '/api/meetings'

export function useMeetings() {
  const { data, mutate } = useSWR<Meeting[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const meetings = data ?? []
  const hydrated = data !== undefined

  const createMeeting = useCallback((dataInput: Omit<Meeting, 'id' | 'createdAt'>): Meeting => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Meeting = { ...dataInput, id: tempId, createdAt: new Date().toISOString() }
    const previous = meetings
    mutate([...previous, optimistic], { revalidate: false })

    fetch(KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataInput) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Meeting) => {
        mutate((prev) => (prev ?? []).map((m) => (m.id === tempId ? created : m)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useMeetings] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la réunion (droits insuffisants ?).')
      })
    return optimistic
  }, [meetings, mutate])

  const updateMeeting = useCallback((id: string, patch: Partial<Meeting>) => {
    const previous = meetings
    mutate(previous.map((m) => (m.id === id ? { ...m, ...patch } : m)), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Meeting) => {
        mutate((prev) => (prev ?? []).map((m) => (m.id === id ? updated : m)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useMeetings] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la réunion.')
      })
  }, [meetings, mutate])

  const deleteMeeting = useCallback((id: string) => {
    const previous = meetings
    mutate(previous.filter((m) => m.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useMeetings] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la réunion.')
      })
  }, [meetings, mutate])

  return { meetings, hydrated, createMeeting, updateMeeting, deleteMeeting }
}

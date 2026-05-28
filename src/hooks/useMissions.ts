'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Mission } from '@/lib/types'

const KEY = '/api/missions'

export type NewMissionInput = Omit<Mission, 'id' | 'createdAt'>

export function useMissions() {
  const { data, mutate } = useSWR<Mission[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const missions = data ?? []
  const hydrated = data !== undefined

  const createMission = useCallback((dataInput: NewMissionInput): Mission => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Mission = { ...dataInput, id: tempId, createdAt: new Date().toISOString() }
    const previous = missions
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataInput) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Mission) => {
        mutate((prev) => (prev ?? []).map((m) => (m.id === tempId ? created : m)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useMissions] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la mission.')
      })
    return optimistic
  }, [missions, mutate])

  const updateMission = useCallback((id: string, patch: Partial<Mission>) => {
    const previous = missions
    mutate(previous.map((m) => (m.id === id ? { ...m, ...patch } : m)), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Mission) => {
        mutate((prev) => (prev ?? []).map((m) => (m.id === id ? updated : m)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useMissions] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la mission.')
      })
  }, [missions, mutate])

  const deleteMission = useCallback((id: string) => {
    const previous = missions
    mutate(previous.filter((m) => m.id !== id), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useMissions] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la mission.')
      })
  }, [missions, mutate])

  const byPerson = useCallback(
    (personId: string) => missions.filter((m) => m.personId === personId),
    [missions],
  )

  return { missions, hydrated, createMission, updateMission, deleteMission, byPerson }
}

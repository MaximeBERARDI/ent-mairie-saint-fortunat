'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Scenario } from '@/lib/types'

const KEY = '/api/scenarios'

export function useScenarios() {
  const { data, mutate } = useSWR<Scenario[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const scenarios = data ?? []
  const hydrated = data !== undefined

  const createScenario = useCallback((dataInput: Omit<Scenario, 'id' | 'createdAt'>): Scenario => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Scenario = { ...dataInput, id: tempId, createdAt: new Date().toISOString() }
    const previous = scenarios
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataInput) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Scenario) => {
        mutate((prev) => (prev ?? []).map((s) => (s.id === tempId ? created : s)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useScenarios] create error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible d'enregistrer le scénario (droits insuffisants ?).")
      })
    return optimistic
  }, [scenarios, mutate])

  const updateScenario = useCallback((id: string, patch: Partial<Scenario>) => {
    const previous = scenarios
    mutate(previous.map((s) => (s.id === id ? { ...s, ...patch } : s)), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Scenario) => {
        mutate((prev) => (prev ?? []).map((s) => (s.id === id ? updated : s)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useScenarios] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour le scénario.')
      })
  }, [scenarios, mutate])

  const deleteScenario = useCallback((id: string) => {
    const previous = scenarios
    mutate(previous.filter((s) => s.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useScenarios] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer le scénario.')
      })
  }, [scenarios, mutate])

  return { scenarios, hydrated, createScenario, updateScenario, deleteScenario }
}

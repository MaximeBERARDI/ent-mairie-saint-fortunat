'use client'

// Hook relances de loyers branché sur /api/relances.
// Cache cross-pages via SWR + mutations optimistes.
// Une relance est liée à une Quittance impayée. Tracée pour traçabilité
// administrative (date, canal, résultat).

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Relance, CanalRelance, ResultatRelance } from '@/lib/types'

const KEY = '/api/relances'

export interface NewRelanceInput {
  quittanceId: string
  date: string                  // ISO YYYY-MM-DD
  canal: CanalRelance
  contenu?: string
  resultat?: ResultatRelance
}

export function useRelances() {
  const { data, mutate } = useSWR<Relance[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const relances = data ?? []
  const hydrated = data !== undefined

  const createRelance = useCallback((input: NewRelanceInput): Relance | null => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Relance = {
      id: tempId,
      quittanceId: input.quittanceId,
      date: input.date,
      canal: input.canal,
      contenu: input.contenu,
      resultat: input.resultat,
      createdById: '',
      createdAt: new Date().toISOString(),
    }
    const previous = relances
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Relance) => {
        mutate((prev) => (prev ?? []).map((r) => (r.id === tempId ? created : r)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useRelances] create error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible d'enregistrer la relance (droits insuffisants ?).")
      })
    return optimistic
  }, [relances, mutate])

  const updateRelance = useCallback((id: string, patch: Partial<Relance>) => {
    const previous = relances
    mutate(previous.map((r) => (r.id === id ? { ...r, ...patch } : r)), { revalidate: false })

    fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Relance) => {
        mutate((prev) => (prev ?? []).map((r) => (r.id === id ? updated : r)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useRelances] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la relance.')
      })
  }, [relances, mutate])

  const deleteRelance = useCallback((id: string) => {
    const previous = relances
    mutate(previous.filter((r) => r.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useRelances] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la relance.')
      })
  }, [relances, mutate])

  // Index par quittanceId pour lookup rapide.
  const byQuittance = useMemo(() => {
    const m = new Map<string, Relance[]>()
    for (const r of relances) {
      const arr = m.get(r.quittanceId) ?? []
      arr.push(r)
      m.set(r.quittanceId, arr)
    }
    // Tri par date desc dans chaque groupe (plus récente d'abord)
    m.forEach((arr: Relance[]) => {
      arr.sort((a, b) => b.date.localeCompare(a.date))
    })
    return m
  }, [relances])

  return {
    relances,
    hydrated,
    createRelance,
    updateRelance,
    deleteRelance,
    byQuittance,
  }
}

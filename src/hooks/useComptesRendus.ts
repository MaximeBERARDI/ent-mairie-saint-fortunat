'use client'

// Comptes rendus branchés sur /api/comptes-rendus.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { CompteRendu } from '@/lib/types'

const KEY = '/api/comptes-rendus'

export function useComptesRendus() {
  const { data, mutate } = useSWR<CompteRendu[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const crs = data ?? []
  const hydrated = data !== undefined

  const createCR = useCallback((dataInput: Omit<CompteRendu, 'id' | 'importedAt'>): CompteRendu => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: CompteRendu = { ...dataInput, id: tempId, importedAt: new Date().toISOString() }
    const previous = crs
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInput),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: CompteRendu) => {
        mutate((prev) => (prev ?? []).map((c) => (c.id === tempId ? created : c)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useComptesRendus] create error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible d'enregistrer le compte rendu (droits insuffisants ?).")
      })

    return optimistic
  }, [crs, mutate])

  const deleteCR = useCallback((id: string) => {
    const previous = crs
    mutate(previous.filter((c) => c.id !== id), { revalidate: false })
    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useComptesRendus] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer le compte rendu.')
      })
  }, [crs, mutate])

  return { crs, hydrated, createCR, deleteCR }
}

'use client'

// Hook agents (RH) branché sur /api/employees.
// Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { EmployeeRecord } from '@/lib/types'

const KEY = '/api/employees'

export type NewEmployeeInput = Omit<EmployeeRecord, 'createdAt'>

export function useEmployees() {
  const { data, mutate } = useSWR<EmployeeRecord[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const records = data ?? []
  const hydrated = data !== undefined

  const upsertEmployee = useCallback((dataInput: NewEmployeeInput) => {
    const optimistic: EmployeeRecord = { ...dataInput, createdAt: new Date().toISOString() }
    const previous = records
    const exists = previous.some((r) => r.personId === dataInput.personId)
    const next = exists
      ? previous.map((r) => (r.personId === dataInput.personId ? optimistic : r))
      : [...previous, optimistic]
    mutate(next, { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInput),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: EmployeeRecord) => {
        mutate((prev) => (prev ?? []).map((r) => (r.personId === saved.personId ? saved : r)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useEmployees] upsert error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de sauvegarder la fiche RH.')
      })
  }, [records, mutate])

  const updateEmployee = useCallback((personId: string, patch: Partial<EmployeeRecord>) => {
    const previous = records
    mutate(previous.map((r) => (r.personId === personId ? { ...r, ...patch } : r)), { revalidate: false })

    fetch(`${KEY}/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useEmployees] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la fiche RH.')
      })
  }, [records, mutate])

  const deleteEmployee = useCallback((personId: string) => {
    const previous = records
    mutate(previous.filter((r) => r.personId !== personId), { revalidate: false })

    fetch(`${KEY}/${personId}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useEmployees] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la fiche RH.')
      })
  }, [records, mutate])

  const findByPersonId = useCallback(
    (personId: string): EmployeeRecord | undefined => records.find((r) => r.personId === personId),
    [records],
  )

  return { records, hydrated, upsertEmployee, updateEmployee, deleteEmployee, findByPersonId }
}

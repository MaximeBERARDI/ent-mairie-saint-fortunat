'use client'

import { useEffect, useState, useCallback } from 'react'
import type { EmployeeRecord } from '@/lib/types'

export type NewEmployeeInput = Omit<EmployeeRecord, 'createdAt'>

export function useEmployees() {
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/employees')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: EmployeeRecord[]) => {
        if (!cancelled) {
          setRecords(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useEmployees] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const upsertEmployee = useCallback((data: NewEmployeeInput) => {
    const optimistic: EmployeeRecord = {
      ...data,
      createdAt: new Date().toISOString(),
    }
    let previous: EmployeeRecord[] = []
    setRecords((prev) => {
      previous = prev
      const exists = prev.some((r) => r.personId === data.personId)
      return exists
        ? prev.map((r) => (r.personId === data.personId ? optimistic : r))
        : [...prev, optimistic]
    })

    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: EmployeeRecord) => {
        setRecords((prev) => prev.map((r) => (r.personId === saved.personId ? saved : r)))
      })
      .catch((e) => {
        console.error('[useEmployees] upsert error:', e)
        setRecords(previous)
        alert('Impossible de sauvegarder la fiche RH.')
      })
  }, [])

  const updateEmployee = useCallback((personId: string, patch: Partial<EmployeeRecord>) => {
    let previous: EmployeeRecord[] = []
    setRecords((prev) => {
      previous = prev
      return prev.map((r) => (r.personId === personId ? { ...r, ...patch } : r))
    })

    fetch(`/api/employees/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useEmployees] update error:', e)
        setRecords(previous)
        alert('Impossible de mettre à jour la fiche RH.')
      })
  }, [])

  const deleteEmployee = useCallback((personId: string) => {
    let previous: EmployeeRecord[] = []
    setRecords((prev) => {
      previous = prev
      return prev.filter((r) => r.personId !== personId)
    })

    fetch(`/api/employees/${personId}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useEmployees] delete error:', e)
        setRecords(previous)
        alert('Impossible de supprimer la fiche RH.')
      })
  }, [])

  const findByPersonId = useCallback(
    (personId: string): EmployeeRecord | undefined => records.find((r) => r.personId === personId),
    [records],
  )

  return { records, hydrated, upsertEmployee, updateEmployee, deleteEmployee, findByPersonId }
}

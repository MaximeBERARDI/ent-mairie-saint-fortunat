'use client'

import { useEffect, useState, useCallback } from 'react'
import type { EmployeeRecord } from '@/lib/types'
import { EMPLOYEE_RECORDS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:employees:v1'

function loadFromStorage(): EmployeeRecord[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveToStorage(items: EmployeeRecord[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export type NewEmployeeInput = Omit<EmployeeRecord, 'createdAt'>

export function useEmployees() {
  const [records, setRecords] = useState<EmployeeRecord[]>(EMPLOYEE_RECORDS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) setRecords(stored)
    else saveToStorage(EMPLOYEE_RECORDS)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(records)
  }, [records, hydrated])

  const upsertEmployee = useCallback((data: NewEmployeeInput) => {
    setRecords(prev => {
      const existing = prev.find(r => r.personId === data.personId)
      if (existing) {
        return prev.map(r => r.personId === data.personId ? { ...r, ...data, createdAt: r.createdAt } : r)
      }
      return [...prev, { ...data, createdAt: new Date().toISOString() }]
    })
  }, [])

  const updateEmployee = useCallback((personId: string, patch: Partial<EmployeeRecord>) => {
    setRecords(prev => prev.map(r => r.personId === personId ? { ...r, ...patch } : r))
  }, [])

  const deleteEmployee = useCallback((personId: string) => {
    setRecords(prev => prev.filter(r => r.personId !== personId))
  }, [])

  const findByPersonId = useCallback((personId: string): EmployeeRecord | undefined => {
    return records.find(r => r.personId === personId)
  }, [records])

  return {
    records,
    hydrated,
    upsertEmployee,
    updateEmployee,
    deleteEmployee,
    findByPersonId,
  }
}

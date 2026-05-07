'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DemandeSubvention } from '@/lib/types'
import { DEMANDES_SUBVENTIONS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:subventions:v1'

function load(): DemandeSubvention[] {
  if (typeof window === 'undefined') return DEMANDES_SUBVENTIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEMANDES_SUBVENTIONS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMANDES_SUBVENTIONS
  } catch {
    return DEMANDES_SUBVENTIONS
  }
}

function persist(items: DemandeSubvention[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function newId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function nextReference(subventions: DemandeSubvention[]): string {
  const year = new Date().getFullYear()
  const prefix = `SUB-${year}-`
  const max = subventions
    .map(s => s.reference)
    .filter(r => r.startsWith(prefix))
    .map(r => parseInt(r.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export type NewSubventionInput = Omit<DemandeSubvention, 'id' | 'createdAt' | 'updatedAt' | 'reference'>

export function useSubventions() {
  const [subventions, setSubventions] = useState<DemandeSubvention[]>(DEMANDES_SUBVENTIONS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSubventions(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persist(subventions)
  }, [subventions, hydrated])

  const createSubvention = useCallback((data: NewSubventionInput): DemandeSubvention => {
    setSubventions(prev => {
      const item: DemandeSubvention = {
        ...data,
        id: newId(),
        reference: nextReference(prev),
        createdAt: new Date().toISOString(),
      }
      return [item, ...prev]
    })
    // Note : on retourne une donnée optimiste. Le vrai state se met à jour de façon asynchrone.
    return {
      ...data,
      id: newId(),
      reference: nextReference(subventions),
      createdAt: new Date().toISOString(),
    }
  }, [subventions])

  const updateSubvention = useCallback((id: string, patch: Partial<DemandeSubvention>) => {
    setSubventions(prev => prev.map(s => (
      s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
    )))
  }, [])

  const deleteSubvention = useCallback((id: string) => {
    setSubventions(prev => prev.filter(s => s.id !== id))
  }, [])

  return {
    subventions,
    hydrated,
    createSubvention,
    updateSubvention,
    deleteSubvention,
  }
}

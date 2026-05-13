'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Commission } from '@/lib/types'
import { COMMISSIONS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:commissions:v1'

function load(): Commission[] {
  if (typeof window === 'undefined') return COMMISSIONS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return COMMISSIONS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : COMMISSIONS
  } catch {
    return COMMISSIONS
  }
}

function persist(items: Commission[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function newId(name: string): string {
  // Slugify simple
  const slug = name.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return slug || `comm-${Date.now()}`
}

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>(COMMISSIONS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCommissions(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persist(commissions)
  }, [commissions, hydrated])

  const createCommission = useCallback((data: Omit<Commission, 'id'>): Commission => {
    const item: Commission = { ...data, id: newId(data.name) }
    setCommissions(prev => {
      // Garantir unicité de l'id
      let id = item.id
      let suffix = 1
      while (prev.some(c => c.id === id)) {
        id = `${item.id}-${suffix++}`
      }
      return [...prev, { ...item, id }]
    })
    return item
  }, [])

  const updateCommission = useCallback((id: string, patch: Partial<Commission>) => {
    setCommissions(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const deleteCommission = useCallback((id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id))
  }, [])

  return { commissions, hydrated, createCommission, updateCommission, deleteCommission }
}

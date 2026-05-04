'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Fournisseur } from '@/lib/types'
import { FOURNISSEURS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:fournisseurs:v1'

function loadFromStorage(): Fournisseur[] | null {
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

function saveToStorage(fournisseurs: Fournisseur[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fournisseurs))
  } catch {}
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(FOURNISSEURS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      setFournisseurs(stored)
    } else {
      saveToStorage(FOURNISSEURS)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(fournisseurs)
  }, [fournisseurs, hydrated])

  const createFournisseur = useCallback((data: Omit<Fournisseur, 'id' | 'createdAt'>) => {
    const f: Fournisseur = {
      ...data,
      id: `four-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }
    setFournisseurs(prev => [f, ...prev])
    return f
  }, [])

  const updateFournisseur = useCallback((id: string, patch: Partial<Fournisseur>) => {
    setFournisseurs(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const deleteFournisseur = useCallback((id: string) => {
    setFournisseurs(prev => prev.filter(f => f.id !== id))
  }, [])

  const resetFournisseurs = useCallback(() => {
    setFournisseurs(FOURNISSEURS)
    saveToStorage(FOURNISSEURS)
  }, [])

  return { fournisseurs, hydrated, createFournisseur, updateFournisseur, deleteFournisseur, resetFournisseurs }
}

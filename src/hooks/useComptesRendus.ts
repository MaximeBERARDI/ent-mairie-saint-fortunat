'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CompteRendu } from '@/lib/types'

const STORAGE_KEY = 'ent-mairie:cr:v1'
const MAX_PDF_SIZE_FOR_STORAGE = 1024 * 1024  // 1 Mo — au-delà, on ne stocke que les métadonnées

function loadFromStorage(): CompteRendu[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(crs: CompteRendu[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(crs))
  } catch (e) {
    // Quota localStorage dépassé : on tente de sauvegarder sans les PDFs
    try {
      const lite = crs.map(({ pdfDataUrl: _pdfDataUrl, ...rest }) => rest)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lite))
    } catch {}
  }
}

export function useComptesRendus() {
  const [crs, setCrs] = useState<CompteRendu[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCrs(loadFromStorage())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(crs)
  }, [crs, hydrated])

  const createCR = useCallback((data: Omit<CompteRendu, 'id' | 'importedAt'>) => {
    const newCR: CompteRendu = {
      ...data,
      // On ne stocke le PDF que s'il est petit (sinon localStorage explose vite)
      pdfDataUrl:
        data.pdfDataUrl && data.pdfDataUrl.length < MAX_PDF_SIZE_FOR_STORAGE * 1.4
          ? data.pdfDataUrl
          : undefined,
      id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      importedAt: new Date().toISOString(),
    }
    setCrs(prev => [newCR, ...prev])
    return newCR
  }, [])

  const deleteCR = useCallback((id: string) => {
    setCrs(prev => prev.filter(c => c.id !== id))
  }, [])

  return { crs, hydrated, createCR, deleteCR }
}

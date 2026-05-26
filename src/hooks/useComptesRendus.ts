'use client'

// Comptes rendus branchés sur /api/comptes-rendus (PostgreSQL via Prisma).
// Pattern optimistic (cf. useTasks). Interface (crs, hydrated, createCR,
// deleteCR) inchangée pour les consommateurs.

import { useEffect, useState, useCallback } from 'react'
import type { CompteRendu } from '@/lib/types'

export function useComptesRendus() {
  const [crs, setCrs] = useState<CompteRendu[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/comptes-rendus')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: CompteRendu[]) => { if (!cancelled) { setCrs(data); setHydrated(true) } })
      .catch(e => { if (!cancelled) { console.error('[useComptesRendus] load error:', e); setHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  const createCR = useCallback((data: Omit<CompteRendu, 'id' | 'importedAt'>): CompteRendu => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: CompteRendu = { ...data, id: tempId, importedAt: new Date().toISOString() }
    setCrs(prev => [optimistic, ...prev])

    fetch('/api/comptes-rendus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: CompteRendu) => setCrs(prev => prev.map(c => (c.id === tempId ? created : c))))
      .catch(e => {
        console.error('[useComptesRendus] create error:', e)
        setCrs(prev => prev.filter(c => c.id !== tempId))
        alert("Impossible d'enregistrer le compte rendu (droits insuffisants ?).")
      })

    return optimistic
  }, [])

  const deleteCR = useCallback((id: string) => {
    let previous: CompteRendu[] = []
    setCrs(prev => { previous = prev; return prev.filter(c => c.id !== id) })
    fetch(`/api/comptes-rendus/${id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw r })
      .catch(e => {
        console.error('[useComptesRendus] delete error:', e)
        setCrs(previous)
        alert('Impossible de supprimer le compte rendu.')
      })
  }, [])

  return { crs, hydrated, createCR, deleteCR }
}

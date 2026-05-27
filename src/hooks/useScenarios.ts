'use client'

// Hook gestion des scénarios de simulation financière, branché sur
// /api/scenarios. Pattern optimistic update + rollback, cohérent avec les
// autres hooks.

import { useEffect, useState, useCallback } from 'react'
import type { Scenario } from '@/lib/types'

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/scenarios')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Scenario[]) => {
        if (!cancelled) { setScenarios(data); setHydrated(true) }
      })
      .catch((e) => {
        if (!cancelled) { console.error('[useScenarios] load error:', e); setHydrated(true) }
      })
    return () => { cancelled = true }
  }, [])

  const createScenario = useCallback((data: Omit<Scenario, 'id' | 'createdAt'>): Scenario => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Scenario = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setScenarios((prev) => [optimistic, ...prev])

    fetch('/api/scenarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Scenario) => {
        setScenarios((prev) => prev.map((s) => (s.id === tempId ? created : s)))
      })
      .catch((e) => {
        console.error('[useScenarios] create error:', e)
        setScenarios((prev) => prev.filter((s) => s.id !== tempId))
        alert('Impossible d\'enregistrer le scénario (droits insuffisants ?).')
      })
    return optimistic
  }, [])

  const updateScenario = useCallback((id: string, patch: Partial<Scenario>) => {
    let previous: Scenario[] = []
    setScenarios((prev) => { previous = prev; return prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

    fetch(`/api/scenarios/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Scenario) => {
        setScenarios((prev) => prev.map((s) => (s.id === id ? updated : s)))
      })
      .catch((e) => {
        console.error('[useScenarios] update error:', e)
        setScenarios(previous)
        alert('Impossible de mettre à jour le scénario.')
      })
  }, [])

  const deleteScenario = useCallback((id: string) => {
    let previous: Scenario[] = []
    setScenarios((prev) => { previous = prev; return prev.filter((s) => s.id !== id) })
    fetch(`/api/scenarios/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useScenarios] delete error:', e)
        setScenarios(previous)
        alert('Impossible de supprimer le scénario.')
      })
  }, [])

  return { scenarios, hydrated, createScenario, updateScenario, deleteScenario }
}

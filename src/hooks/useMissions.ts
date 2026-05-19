'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Mission } from '@/lib/types'

export type NewMissionInput = Omit<Mission, 'id' | 'createdAt'>

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/missions')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Mission[]) => {
        if (!cancelled) {
          setMissions(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useMissions] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createMission = useCallback((data: NewMissionInput): Mission => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Mission = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    }
    setMissions((prev) => [optimistic, ...prev])

    fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Mission) => {
        setMissions((prev) => prev.map((m) => (m.id === tempId ? created : m)))
      })
      .catch((e) => {
        console.error('[useMissions] create error:', e)
        setMissions((prev) => prev.filter((m) => m.id !== tempId))
        alert('Impossible de créer la mission.')
      })
    return optimistic
  }, [])

  const updateMission = useCallback((id: string, patch: Partial<Mission>) => {
    let previous: Mission[] = []
    setMissions((prev) => {
      previous = prev
      return prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    })

    fetch(`/api/missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Mission) => {
        setMissions((prev) => prev.map((m) => (m.id === id ? updated : m)))
      })
      .catch((e) => {
        console.error('[useMissions] update error:', e)
        setMissions(previous)
        alert('Impossible de mettre à jour la mission.')
      })
  }, [])

  const deleteMission = useCallback((id: string) => {
    let previous: Mission[] = []
    setMissions((prev) => {
      previous = prev
      return prev.filter((m) => m.id !== id)
    })

    fetch(`/api/missions/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useMissions] delete error:', e)
        setMissions(previous)
        alert('Impossible de supprimer la mission.')
      })
  }, [])

  const byPerson = useCallback(
    (personId: string) => missions.filter((m) => m.personId === personId),
    [missions],
  )

  return { missions, hydrated, createMission, updateMission, deleteMission, byPerson }
}

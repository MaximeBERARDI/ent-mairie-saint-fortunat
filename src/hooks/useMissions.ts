'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Mission } from '@/lib/types'
import { MISSIONS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:missions:v1'

function loadFromStorage(): Mission[] | null {
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

function saveToStorage(items: Mission[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export type NewMissionInput = Omit<Mission, 'id' | 'createdAt'>

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>(MISSIONS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) setMissions(stored)
    else saveToStorage(MISSIONS)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(missions)
  }, [missions, hydrated])

  const createMission = useCallback((data: NewMissionInput): Mission => {
    const m: Mission = {
      ...data,
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString(),
    }
    setMissions(prev => [m, ...prev])
    return m
  }, [])

  const updateMission = useCallback((id: string, patch: Partial<Mission>) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }, [])

  const deleteMission = useCallback((id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id))
  }, [])

  const byPerson = useCallback((personId: string) => {
    return missions.filter(m => m.personId === personId)
  }, [missions])

  return { missions, hydrated, createMission, updateMission, deleteMission, byPerson }
}

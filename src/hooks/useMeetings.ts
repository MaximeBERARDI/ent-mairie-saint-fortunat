'use client'

// Hook gestion des réunions de commission, branché sur /api/meetings.
// Charge toutes les réunions (l'UI filtre par commission). Pattern
// optimistic update + rollback, cohérent avec les autres hooks.

import { useEffect, useState, useCallback } from 'react'
import type { Meeting } from '@/lib/types'

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/meetings')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Meeting[]) => {
        if (!cancelled) {
          setMeetings(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useMeetings] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const createMeeting = useCallback((data: Omit<Meeting, 'id' | 'createdAt'>): Meeting => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Meeting = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setMeetings((prev) => [...prev, optimistic])

    fetch('/api/meetings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Meeting) => {
        setMeetings((prev) => prev.map((m) => (m.id === tempId ? created : m)))
      })
      .catch((e) => {
        console.error('[useMeetings] create error:', e)
        setMeetings((prev) => prev.filter((m) => m.id !== tempId))
        alert('Impossible de créer la réunion (droits insuffisants ?).')
      })
    return optimistic
  }, [])

  const updateMeeting = useCallback((id: string, patch: Partial<Meeting>) => {
    let previous: Meeting[] = []
    setMeetings((prev) => { previous = prev; return prev.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

    fetch(`/api/meetings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Meeting) => {
        setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)))
      })
      .catch((e) => {
        console.error('[useMeetings] update error:', e)
        setMeetings(previous)
        alert('Impossible de mettre à jour la réunion.')
      })
  }, [])

  const deleteMeeting = useCallback((id: string) => {
    let previous: Meeting[] = []
    setMeetings((prev) => { previous = prev; return prev.filter((m) => m.id !== id) })
    fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useMeetings] delete error:', e)
        setMeetings(previous)
        alert('Impossible de supprimer la réunion.')
      })
  }, [])

  return { meetings, hydrated, createMeeting, updateMeeting, deleteMeeting }
}

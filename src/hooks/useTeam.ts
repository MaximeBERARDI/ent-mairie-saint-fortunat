'use client'

import { useEffect, useState, useCallback } from 'react'
import { PEOPLE, type Person } from '@/lib/people'

const STORAGE_KEY = 'ent-mairie:team:v1'

function loadFromStorage(): Person[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    // Ré-injecter les valeurs par défaut manquantes (cas d'une migration de schéma)
    return parsed.map((p: Partial<Person>) => {
      const seed = PEOPLE.find(s => s.id === p.id)
      return {
        ...(seed ?? {}),
        ...p,
        responsibleCommissions: p.responsibleCommissions ?? seed?.responsibleCommissions ?? [],
        signatureDomains: p.signatureDomains ?? seed?.signatureDomains ?? [],
        active: p.active ?? true,
      } as Person
    })
  } catch {
    return null
  }
}

function saveToStorage(people: Person[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch {}
}

export function useTeam() {
  const [people, setPeople] = useState<Person[]>(PEOPLE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      // Fusionner avec les seeds : nouveaux membres seed apparaissent automatiquement
      const ids = new Set(stored.map(p => p.id))
      const merged = [...stored, ...PEOPLE.filter(p => !ids.has(p.id))]
      setPeople(merged)
    } else {
      saveToStorage(PEOPLE)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(people)
  }, [people, hydrated])

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    setPeople(prev => prev.map(p => {
      if (p.id !== id) return p
      const next = { ...p, ...patch }
      next.fullName = `${next.prenom} ${next.nom}`
      next.initials = `${next.prenom[0] ?? ''}${next.nom[0] ?? ''}`.toUpperCase()
      return next
    }))
  }, [])

  const createPerson = useCallback((data: Omit<Person, 'id' | 'fullName' | 'initials'>) => {
    const newPerson: Person = {
      ...data,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      fullName: `${data.prenom} ${data.nom}`,
      initials: `${data.prenom[0] ?? ''}${data.nom[0] ?? ''}`.toUpperCase(),
    }
    setPeople(prev => [...prev, newPerson])
    return newPerson
  }, [])

  const deletePerson = useCallback((id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id))
  }, [])

  const resetTeam = useCallback(() => {
    setPeople(PEOPLE)
    saveToStorage(PEOPLE)
  }, [])

  return { people, hydrated, updatePerson, createPerson, deletePerson, resetTeam }
}

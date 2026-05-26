'use client'

// Source de vérité de la couche identité, branchée sur la base via
// /api/persons + la session NextAuth.
//
// - `people` : annuaire chargé une seule fois (centralisé pour éviter que
//   les 10+ composants consommateurs ne refetchent chacun).
// - `currentUser` : dérivé du personId de la session NextAuth.
// - `can()` : permissions effectives (authLevel + customPermissions).
// - CRUD optimiste avec rollback (même pattern que useEmployees).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Person } from '@/lib/people'
import { hasPermission, type Permission } from '@/lib/permissions'

export type NewPersonInput = Omit<Person, 'id' | 'fullName' | 'initials'>

interface TeamContextValue {
  people: Person[]
  hydrated: boolean
  currentUserId: string
  currentUser: Person | null
  can: (perm: Permission) => boolean
  createPerson: (data: NewPersonInput) => Person
  updatePerson: (id: string, patch: Partial<Person>) => void
  deletePerson: (id: string) => void
}

const TeamContext = createContext<TeamContextValue | null>(null)

const initials = (prenom: string, nom: string) =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [people, setPeople] = useState<Person[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated') {
      setPeople([])
      setHydrated(true)
      return
    }
    let cancelled = false
    fetch('/api/persons')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Person[]) => {
        if (!cancelled) {
          setPeople(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[TeamProvider] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [status])

  const currentUserId = session?.user?.personId ?? ''
  const currentUser = useMemo(
    () => people.find((p) => p.id === currentUserId) ?? null,
    [people, currentUserId],
  )

  const can = useCallback(
    (perm: Permission): boolean => {
      if (!currentUser) return false
      return hasPermission(currentUser.authLevel, perm, currentUser.customPermissions)
    },
    [currentUser],
  )

  const createPerson = useCallback((data: NewPersonInput): Person => {
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const optimistic: Person = {
      ...data,
      id,
      fullName: `${data.prenom} ${data.nom}`,
      initials: initials(data.prenom, data.nom),
    }
    setPeople((prev) => [...prev, optimistic])

    fetch('/api/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person) => {
        setPeople((prev) => prev.map((p) => (p.id === id ? saved : p)))
      })
      .catch((e) => {
        console.error('[TeamProvider] create error:', e)
        setPeople((prev) => prev.filter((p) => p.id !== id))
        alert("Impossible de créer le membre (droits insuffisants ?).")
      })

    return optimistic
  }, [])

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    let previous: Person[] = []
    setPeople((prev) => {
      previous = prev
      return prev.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...patch }
        if (patch.prenom !== undefined || patch.nom !== undefined) {
          next.fullName = `${next.prenom} ${next.nom}`
          next.initials = initials(next.prenom, next.nom)
        }
        return next
      })
    })

    fetch(`/api/persons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person) => {
        setPeople((prev) => prev.map((p) => (p.id === id ? saved : p)))
      })
      .catch((e) => {
        console.error('[TeamProvider] update error:', e)
        setPeople(previous)
        alert('Impossible de mettre à jour le membre (droits insuffisants ?).')
      })
  }, [])

  const deletePerson = useCallback((id: string) => {
    let previous: Person[] = []
    setPeople((prev) => {
      previous = prev
      return prev.map((p) => (p.id === id ? { ...p, active: false } : p))
    })

    fetch(`/api/persons/${id}`, { method: 'DELETE' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person) => {
        setPeople((prev) => prev.map((p) => (p.id === id ? saved : p)))
      })
      .catch((e) => {
        console.error('[TeamProvider] delete error:', e)
        setPeople(previous)
        alert('Impossible de désactiver le membre (droits insuffisants ?).')
      })
  }, [])

  const value: TeamContextValue = {
    people,
    hydrated,
    currentUserId,
    currentUser,
    can,
    createPerson,
    updatePerson,
    deletePerson,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeamContext(): TeamContextValue {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeamContext doit être utilisé dans un <TeamProvider>')
  return ctx
}

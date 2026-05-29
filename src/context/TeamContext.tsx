'use client'

// Source de vérité de la couche identité, branchée sur la base via
// /api/persons + la session NextAuth.
//
// Cache cross-pages via SWR : la liste des personnes est chargée une fois,
// partagée par tous les consommateurs (Sidebar, TopBar, pages métier), et
// revalidée en arrière-plan au retour de focus / reconnexion. Les mutations
// passent par `mutate()` pour faire de l'optimistic update + revalidation.
//
// - `people` : annuaire chargé une seule fois (centralisé pour éviter que
//   les 10+ composants consommateurs ne refetchent chacun).
// - `currentUser` : dérivé du personId de la session NextAuth.
// - `can()` : permissions effectives (authLevel + customPermissions).

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Person } from '@/lib/people'
import { hasPermission, type Permission } from '@/lib/permissions'

export type NewPersonInput = Omit<Person, 'id' | 'fullName' | 'initials'>

interface TeamContextValue {
  people: Person[]
  hydrated: boolean
  currentUserId: string
  currentUser: Person | null
  can: (perm: Permission) => boolean
  createPerson: (data: NewPersonInput, onAccount?: (tempPassword: string) => void) => Person
  updatePerson: (id: string, patch: Partial<Person>) => void
  deletePerson: (id: string) => void
}

const TeamContext = createContext<TeamContextValue | null>(null)
const PERSONS_KEY = '/api/persons'

const initials = (prenom: string, nom: string) =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Conditionne le fetch sur l'authentification : pas de clé tant que la
  // session n'est pas chargée → pas de requête prématurée.
  const swrKey = status === 'authenticated' ? PERSONS_KEY : null
  const { data, mutate } = useSWR<Person[]>(swrKey, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })

  const people = data ?? []
  const hydrated = status !== 'loading' && (status !== 'authenticated' || data !== undefined)

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

  const createPerson = useCallback((dataInput: NewPersonInput, onAccount?: (tempPassword: string) => void): Person => {
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const optimistic: Person = {
      ...dataInput,
      id,
      fullName: `${dataInput.prenom} ${dataInput.nom}`,
      initials: initials(dataInput.prenom, dataInput.nom),
    }
    const previous = people
    mutate([...previous, optimistic], { revalidate: false })

    fetch(PERSONS_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dataInput, id }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person & { tempPassword?: string }) => {
        const { tempPassword, ...person } = saved
        mutate((prev) => (prev ?? []).map((p) => (p.id === id ? (person as Person) : p)), { revalidate: false })
        if (tempPassword && onAccount) onAccount(tempPassword)
      })
      .catch((e) => {
        console.error('[TeamProvider] create error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible de créer le membre (email déjà utilisé ou droits insuffisants).")
      })

    return optimistic
  }, [people, mutate])

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    const previous = people
    const next = previous.map((p) => {
      if (p.id !== id) return p
      const merged = { ...p, ...patch }
      if (patch.prenom !== undefined || patch.nom !== undefined) {
        merged.fullName = `${merged.prenom} ${merged.nom}`
        merged.initials = initials(merged.prenom, merged.nom)
      }
      return merged
    })
    mutate(next, { revalidate: false })

    fetch(`${PERSONS_KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person) => {
        mutate((prev) => (prev ?? []).map((p) => (p.id === id ? saved : p)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[TeamProvider] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour le membre (droits insuffisants ?).')
      })
  }, [people, mutate])

  const deletePerson = useCallback((id: string) => {
    const previous = people
    mutate(previous.map((p) => (p.id === id ? { ...p, active: false } : p)), { revalidate: false })

    fetch(`${PERSONS_KEY}/${id}`, { method: 'DELETE' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: Person) => {
        mutate((prev) => (prev ?? []).map((p) => (p.id === id ? saved : p)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[TeamProvider] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de désactiver le membre (droits insuffisants ?).')
      })
  }, [people, mutate])

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

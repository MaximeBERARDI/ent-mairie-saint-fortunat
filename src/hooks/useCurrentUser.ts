'use client'

import { useEffect, useState, useCallback } from 'react'
import { PEOPLE, getPerson, CURRENT_USER_ID as DEFAULT_USER_ID } from '@/lib/people'
import { hasPermission, type Permission } from '@/lib/permissions'

const STORAGE_KEY = 'ent-mairie:current-user-id:v1'

function loadFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    // Vérifie que la personne existe toujours
    if (PEOPLE.some(p => p.id === raw)) return raw
    return null
  } catch {
    return null
  }
}

function saveToStorage(id: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

/**
 * Hook qui expose l'utilisateur courant + un setter pour le changer.
 * En attendant une vraie auth, on stocke le choix en localStorage pour
 * permettre de tester l'application avec différents profils (élu, agent,
 * adjoint…) et vérifier que les permissions fonctionnent.
 *
 * Au prochain remplacement par NextAuth/Clerk, il suffira de remplacer
 * l'implémentation interne sans toucher aux composants qui consomment.
 */
export function useCurrentUser() {
  const [currentUserId, setCurrentUserIdState] = useState<string>(DEFAULT_USER_ID)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) setCurrentUserIdState(stored)
    setHydrated(true)
  }, [])

  const setCurrentUserId = useCallback((id: string) => {
    setCurrentUserIdState(id)
    saveToStorage(id)
  }, [])

  const currentUser = getPerson(currentUserId) ?? null

  const can = useCallback((perm: Permission): boolean => {
    if (!currentUser) return false
    return hasPermission(currentUser.authLevel, perm, currentUser.customPermissions)
  }, [currentUser])

  return { currentUserId, currentUser, setCurrentUserId, can, hydrated }
}

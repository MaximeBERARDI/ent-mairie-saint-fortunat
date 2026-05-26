'use client'

// Utilisateur courant + permissions, désormais dérivés de la session NextAuth
// via le TeamProvider. Wrapper fin pour préserver l'API consommée par les pages.

import { useCallback } from 'react'
import { useTeamContext } from '@/context/TeamContext'

export function useCurrentUser() {
  const { currentUserId, currentUser, can, hydrated } = useTeamContext()

  // Conservé pour compat (login / première-connexion). L'identité provient
  // désormais de la session NextAuth ; ce setter n'a plus d'effet.
  const setCurrentUserId = useCallback((personId: string) => {
    void personId
  }, [])

  return { currentUserId, currentUser, setCurrentUserId, can, hydrated }
}

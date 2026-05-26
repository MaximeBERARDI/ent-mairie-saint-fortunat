'use client'

// Utilisateur courant + permissions, dérivés de la session NextAuth via le
// TeamProvider. Wrapper fin pour préserver l'API consommée par les pages.

import { useTeamContext } from '@/context/TeamContext'

export function useCurrentUser() {
  const { currentUserId, currentUser, can, hydrated } = useTeamContext()
  return { currentUserId, currentUser, can, hydrated }
}

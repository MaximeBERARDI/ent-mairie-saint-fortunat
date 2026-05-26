'use client'

// Annuaire des personnes, désormais branché sur la base via le TeamProvider
// (/api/persons). Wrapper fin pour préserver l'API consommée par les pages.

import { useTeamContext } from '@/context/TeamContext'

export function useTeam() {
  const { people, hydrated, updatePerson, createPerson, deletePerson } = useTeamContext()
  return { people, hydrated, updatePerson, createPerson, deletePerson }
}

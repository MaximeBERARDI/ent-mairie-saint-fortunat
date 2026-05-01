// Base unifiée des personnes de la mairie : élus + agents
// Les agents existent aussi dans EMPLOYES (avec données RH) ; ici on
// regroupe tout pour servir de référentiel "qui fait quoi" dans toute
// l'application (assignations de tâches, validateurs, membres de
// commissions, etc.)

import { COLORS as C } from './theme'

export type PersonRole = 'maire' | 'adjoint' | 'elu' | 'agent'

export interface Person {
  id: string
  prenom: string
  nom: string
  fullName: string
  role: PersonRole
  poste: string
  email: string
  color: string
  initials: string
}

const make = (
  id: string, prenom: string, nom: string,
  role: PersonRole, poste: string, color: string,
): Person => ({
  id,
  prenom,
  nom,
  fullName: `${prenom} ${nom}`,
  role,
  poste,
  email: `${prenom.toLowerCase()}.${nom.toLowerCase().replace(/\s+/g, '-')}@saint-fortunat.fr`,
  color,
  initials: `${prenom[0]}${nom[0]}`.toUpperCase(),
})

export const PEOPLE: Person[] = [
  // Élus / Maire
  make('p-jm', 'Jean', 'Martin', 'maire', 'Maire', C.green),
  make('p-md', 'Marie', 'Durand', 'adjoint', "1ère adjointe — Urbanisme", C.terra),
  make('p-lf', 'Laurent', 'Fabre', 'elu', 'Conseiller — Voirie', C.info),
  make('p-sb', 'Sylvie', 'Bonnet', 'elu', 'Conseillère — Enfance & Jeunesse', C.warning),
  make('p-rg', 'Robert', 'Granger', 'adjoint', '2ème adjoint — Finances', C.slate),

  // Agents
  make('p-pr', 'Pierre', 'Roche', 'agent', 'Agent — Secrétariat de mairie', C.slate),
  make('p-im', 'Isabelle', 'Morel', 'agent', 'Adjointe administrative', C.terra),
  make('p-tg', 'Thomas', 'Girard', 'agent', 'Agent technique', C.green),
  make('p-lb', 'Lucie', 'Bernard', 'agent', 'ATSEM — École', C.info),
  make('p-mf', 'Marc', 'Faure', 'agent', 'Agent voirie', C.warning),
  make('p-ad', 'Anne', 'Dupont', 'agent', 'Agent technique', C.danger),
  make('p-cv', 'Claude', 'Viard', 'agent', 'Services généraux', C.muted),
]

export const ROLE_LABELS: Record<PersonRole, string> = {
  maire: 'Maire',
  adjoint: 'Adjoint(e)',
  elu: 'Élu(e)',
  agent: 'Agent',
}

export function getPerson(id: string | undefined): Person | null {
  if (!id) return null
  return PEOPLE.find(p => p.id === id) ?? null
}

export function getPersonName(id: string | undefined): string {
  return getPerson(id)?.fullName ?? '—'
}

// Personne courante (= "moi") — sera remplacée par l'auth réelle plus tard
export const CURRENT_USER_ID = 'p-jm'

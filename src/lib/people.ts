// Base unifiée des personnes de la mairie : élus + agents
// Sert de référentiel "qui fait quoi" dans toute l'application
// (assignations de tâches, validateurs, membres de commissions, etc.)

import { COLORS as C } from './theme'
import type { AuthLevel, Permission, SignatureDomain } from './permissions'

export type PersonRole = 'maire' | 'adjoint' | 'elu' | 'agent'

export interface Person {
  id: string
  prenom: string
  nom: string
  fullName: string
  role: PersonRole
  poste: string
  email: string
  phone?: string
  color: string
  initials: string
  // Authentification & autorisations
  authLevel: AuthLevel
  customPermissions?: Permission[]   // permissions ajoutées au-delà du niveau
  // Signature
  canSign: boolean
  signatureDomains: SignatureDomain[]
  // Délégations
  responsibleCommissions: string[]   // IDs de commissions dont la personne est référent(e)
  hiddenModules?: string[]           // clés de modules de nav masqués pour ce profil (cf. lib/modules)
  // Statut
  active: boolean
  // Métadonnées
  startDate?: string                 // ISO YYYY-MM-DD : prise de poste
}

interface PersonInit {
  id: string
  prenom: string
  nom: string
  role: PersonRole
  poste: string
  color: string
  authLevel: AuthLevel
  canSign?: boolean
  signatureDomains?: SignatureDomain[]
  responsibleCommissions?: string[]
  phone?: string
  startDate?: string
  email?: string                     // override l'email auto-généré
}

const make = (init: PersonInit): Person => ({
  id: init.id,
  prenom: init.prenom,
  nom: init.nom,
  fullName: `${init.prenom} ${init.nom}`,
  role: init.role,
  poste: init.poste,
  email: init.email ?? `${init.prenom.toLowerCase()}.${init.nom.toLowerCase().replace(/\s+/g, '-')}@saint-fortunat.fr`,
  phone: init.phone,
  color: init.color,
  initials: `${init.prenom[0]}${init.nom[0]}`.toUpperCase(),
  authLevel: init.authLevel,
  canSign: init.canSign ?? false,
  signatureDomains: init.signatureDomains ?? [],
  responsibleCommissions: init.responsibleCommissions ?? [],
  active: true,
  startDate: init.startDate,
})

export const PEOPLE: Person[] = [
  // Élus / Maire
  make({
    id: 'p-jm', prenom: 'Jean', nom: 'Martin', role: 'maire',
    poste: 'Maire', color: C.green,
    authLevel: 'super-admin',
    canSign: true,
    signatureDomains: ['taches', 'commissions', 'cr', 'rh', 'finances', 'conventions', 'urbanisme', 'etat-civil'],
    responsibleCommissions: [],  // supervise tout
    phone: '04 75 00 00 01',
    startDate: '2020-07-04',
    email: 'berardi.maxime@gmail.com',
  }),
  make({
    id: 'p-md', prenom: 'Marie', nom: 'Durand', role: 'adjoint',
    poste: '1ère adjointe — Urbanisme', color: C.terra,
    authLevel: 'admin',
    canSign: true,
    signatureDomains: ['urbanisme', 'commissions', 'conventions'],
    responsibleCommissions: ['travaux'],
    phone: '04 75 00 00 02',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-rg', prenom: 'Robert', nom: 'Granger', role: 'adjoint',
    poste: '2ème adjoint — Finances', color: C.slate,
    authLevel: 'admin',
    canSign: true,
    signatureDomains: ['finances', 'commissions', 'conventions'],
    responsibleCommissions: ['admin-finance', 'developpement'],
    phone: '04 75 00 00 03',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-lf', prenom: 'Laurent', nom: 'Fabre', role: 'elu',
    poste: 'Conseiller — Voirie', color: C.info,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 04',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-sb', prenom: 'Sylvie', nom: 'Bonnet', role: 'elu',
    poste: 'Conseillère — Enfance & Jeunesse', color: C.warning,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: ['enfance', 'animation'],
    phone: '04 75 00 00 05',
    startDate: '2020-07-04',
  }),

  // Agents
  make({
    id: 'p-pr', prenom: 'Pierre', nom: 'Roche', role: 'agent',
    poste: 'Secrétaire de mairie (DGS)', color: C.slate,
    authLevel: 'gestionnaire',
    canSign: true,
    signatureDomains: ['taches', 'cr', 'etat-civil'],
    responsibleCommissions: [],
    phone: '04 75 00 00 10',
    startDate: '2019-09-01',
  }),
  make({
    id: 'p-im', prenom: 'Isabelle', nom: 'Morel', role: 'agent',
    poste: 'Adjointe administrative', color: C.terra,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 11',
    startDate: '2018-03-15',
  }),
  make({
    id: 'p-tg', prenom: 'Thomas', nom: 'Girard', role: 'agent',
    poste: 'Agent technique', color: C.green,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 12',
    startDate: '2017-04-01',
  }),
  make({
    id: 'p-lb', prenom: 'Lucie', nom: 'Bernard', role: 'agent',
    poste: 'ATSEM — École maternelle', color: C.info,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 13',
    startDate: '2021-08-30',
  }),
  make({
    id: 'p-mf', prenom: 'Marc', nom: 'Faure', role: 'agent',
    poste: 'Agent voirie', color: C.warning,
    authLevel: 'contributeur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 14',
    startDate: '2015-06-15',
  }),
  make({
    id: 'p-ad', prenom: 'Anne', nom: 'Dupont', role: 'agent',
    poste: 'Agent technique', color: C.danger,
    authLevel: 'lecteur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 15',
    startDate: '2022-01-10',
  }),
  make({
    id: 'p-cv', prenom: 'Claude', nom: 'Viard', role: 'agent',
    poste: 'Services généraux', color: C.muted,
    authLevel: 'lecteur',
    canSign: false,
    signatureDomains: [],
    responsibleCommissions: [],
    phone: '04 75 00 00 16',
    startDate: '2016-11-02',
  }),
]

export const ROLE_LABELS: Record<PersonRole, string> = {
  maire: 'Maire',
  adjoint: 'Adjoint(e)',
  elu: 'Élu(e)',
  agent: 'Agent',
}

export const ROLE_COLORS: Record<PersonRole, string> = {
  maire: C.green,
  adjoint: C.terra,
  elu: C.info,
  agent: C.slate,
}

export function getPerson(id: string | undefined): Person | null {
  if (!id) return null
  return PEOPLE.find(p => p.id === id) ?? null
}

export function getPersonName(id: string | undefined): string {
  return getPerson(id)?.fullName ?? '—'
}

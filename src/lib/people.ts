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
  photoUrl?: string                  // photo d'avatar (data URL base64, miniature) — optionnelle
  initials: string
  // Authentification & autorisations
  authLevel: AuthLevel
  customPermissions?: Permission[]   // permissions ajoutées au-delà du niveau
  // Signature
  canSign: boolean
  signatureDomains: SignatureDomain[]
  // Délégations
  responsibleCommissions: string[]   // IDs de commissions dont la personne est référent(e)
  commissions?: string[]             // IDs de commissions dont la personne est membre
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
  commissions?: string[]
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
  commissions: init.commissions ?? [],
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
  make({
    id: 'p-cb', prenom: 'Catherine', nom: 'Blanc', role: 'adjoint',
    poste: '3ème adjointe — Affaires sociales & solidarité', color: C.terra,
    authLevel: 'gestionnaire',
    canSign: true,
    signatureDomains: ['commissions', 'cr'],
    responsibleCommissions: ['enfance'],
    commissions: ['enfance', 'admin-finance'],
    phone: '04 75 00 00 21',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-pm', prenom: 'Philippe', nom: 'Mercier', role: 'adjoint',
    poste: '4ème adjoint — Vie associative & communication', color: C.green,
    authLevel: 'gestionnaire',
    canSign: true,
    signatureDomains: ['commissions', 'conventions'],
    responsibleCommissions: ['animation'],
    commissions: ['animation', 'developpement'],
    phone: '04 75 00 00 22',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-nm', prenom: 'Nathalie', nom: 'Meunier', role: 'elu',
    poste: 'Conseillère déléguée — Environnement & cadre de vie', color: C.info,
    authLevel: 'contributeur',
    commissions: ['travaux', 'developpement'],
    phone: '04 75 00 00 23',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-oc', prenom: 'Olivier', nom: 'Chevalier', role: 'elu',
    poste: 'Conseiller — Agriculture & forêt', color: C.slate,
    authLevel: 'contributeur',
    commissions: ['developpement'],
    phone: '04 75 00 00 24',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-sg', prenom: 'Sandrine', nom: 'Garnier', role: 'elu',
    poste: 'Conseillère — Culture & patrimoine', color: C.warning,
    authLevel: 'contributeur',
    commissions: ['animation'],
    phone: '04 75 00 00 25',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-dl', prenom: 'Damien', nom: 'Lemoine', role: 'elu',
    poste: 'Conseiller — Sports & équipements', color: C.danger,
    authLevel: 'contributeur',
    commissions: ['animation', 'travaux'],
    phone: '04 75 00 00 26',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-cr', prenom: 'Christine', nom: 'Robert', role: 'elu',
    poste: 'Conseillère — Action sociale & seniors', color: C.terra,
    authLevel: 'contributeur',
    commissions: ['enfance'],
    phone: '04 75 00 00 27',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-jd', prenom: 'Julien', nom: 'Dubois', role: 'elu',
    poste: 'Conseiller — Tourisme & attractivité', color: C.green,
    authLevel: 'contributeur',
    commissions: ['developpement', 'animation'],
    phone: '04 75 00 00 28',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-ch', prenom: 'Caroline', nom: 'Henry', role: 'elu',
    poste: 'Conseillère — Affaires scolaires', color: C.info,
    authLevel: 'contributeur',
    commissions: ['enfance'],
    phone: '04 75 00 00 29',
    startDate: '2020-07-04',
  }),
  make({
    id: 'p-gp', prenom: 'Guillaume', nom: 'Petit', role: 'elu',
    poste: 'Conseiller — Sécurité & voirie', color: C.slate,
    authLevel: 'contributeur',
    commissions: ['travaux'],
    phone: '04 75 00 00 30',
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

// Modules de navigation dont la visibilité peut être restreinte par profil
// (par personne) via la configuration admin — persisté en DB sur
// Person.hiddenModules (cf. la section « Accès aux modules » de PersonForm).
//
// Le tableau de bord n'est jamais masquable (point d'entrée de l'app).

export type ModuleKey =
  | 'taches'
  | 'commissions'
  | 'comptes-rendus'
  | 'rh'
  | 'finances'
  | 'equipe'
  | 'bibliotheque'

export const GATEABLE_MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'taches', label: 'Tâches' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'comptes-rendus', label: 'Comptes rendus' },
  { key: 'rh', label: 'Ressources humaines' },
  { key: 'finances', label: 'Finances' },
  { key: 'equipe', label: 'Équipe' },
  { key: 'bibliotheque', label: 'Bibliothèque' },
]

const HREF_TO_MODULE: Record<string, ModuleKey> = {
  '/taches': 'taches',
  '/commissions': 'commissions',
  '/comptes-rendus': 'comptes-rendus',
  '/rh': 'rh',
  '/finances': 'finances',
  '/equipe': 'equipe',
  '/bibliotheque': 'bibliotheque',
}

// Clé de module d'un href de nav, ou null si non masquable (ex. /dashboard).
export function moduleKeyForHref(href: string): ModuleKey | null {
  return HREF_TO_MODULE[href] ?? null
}

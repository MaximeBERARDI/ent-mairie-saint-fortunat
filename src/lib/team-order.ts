// Ordre de préséance des personnes pour l'annuaire (vue Liste) et
// l'organigramme. On ne trie PAS par nom de famille : on respecte la
// hiérarchie communale (maire → adjoints → adjoints délégués → conseillers
// → agents).

import type { Person } from './people'
import { ROLE_LABELS } from './people'

const ROLE_RANK: Record<string, number> = { maire: 0, adjoint: 1, elu: 2, agent: 3 }

// DGS / secrétaire de mairie = sommet de la branche administrative.
export function isDGS(p: Person): boolean {
  const s = p.poste.toLowerCase()
  return s.includes('dgs') || s.includes('secrétaire de mairie')
}

// « Adjoint délégué » / « conseiller municipal délégué » : un rang dérivé du
// poste, intercalé entre les adjoints au maire et les conseillers. Ces élus
// gardent role = 'elu' (ils sont juridiquement conseillers délégués), mais
// sont présentés comme un rang distinct. Détection insensible aux accents.
export function isAdjointDelegue(p: Person): boolean {
  if (p.role !== 'elu') return false
  const s = p.poste.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return s.startsWith('adjoint delegue') || s.startsWith('adjointe deleguee')
}

// Rang d'un adjoint déduit de son poste : « 1ère adjointe », « 2ème adjoint »…
export function adjointRank(p: Person): number {
  const m = p.poste.match(/(\d+)\s*(?:ère|er|ème|eme|e|nd)\b/i)
  return m ? parseInt(m[1], 10) : 99
}

// Conseiller avec une délégation thématique (poste « Conseiller — … »).
function hasDelegation(p: Person): boolean {
  return p.poste.includes('—') || p.poste.toLowerCase().includes('délégué')
}

// Rang effectif : les adjoints délégués s'intercalent entre les adjoints (1)
// et les conseillers (2).
function effectiveRank(p: Person): number {
  if (isAdjointDelegue(p)) return 1.5
  return ROLE_RANK[p.role] ?? 9
}

// Libellé de fonction à afficher (gère le rang « adjoint délégué » dérivé).
export function roleDisplayLabel(p: Person): string {
  if (isAdjointDelegue(p)) return 'Adjoint(e) délégué(e)'
  return ROLE_LABELS[p.role]
}

export function comparePeople(a: Person, b: Person): number {
  const ra = effectiveRank(a)
  const rb = effectiveRank(b)
  if (ra !== rb) return ra - rb

  if (a.role === 'adjoint') {
    const d = adjointRank(a) - adjointRank(b)
    if (d !== 0) return d
  }
  if (a.role === 'elu') {
    const d = (hasDelegation(a) ? 0 : 1) - (hasDelegation(b) ? 0 : 1)
    if (d !== 0) return d
  }
  if (a.role === 'agent') {
    const d = (isDGS(a) ? 0 : 1) - (isDGS(b) ? 0 : 1)
    if (d !== 0) return d
  }
  return a.fullName.localeCompare(b.fullName, 'fr')
}

// Trie une copie (ne mute pas l'entrée).
export function sortPeople(people: Person[]): Person[] {
  return [...people].sort(comparePeople)
}

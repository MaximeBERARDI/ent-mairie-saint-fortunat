// Ordre de préséance des personnes pour l'annuaire (vue Liste) et
// l'organigramme. On ne trie PAS par nom de famille : on respecte la
// hiérarchie communale (maire → adjoints par rang → conseillers → agents).

import type { Person } from './people'

const ROLE_RANK: Record<string, number> = { maire: 0, adjoint: 1, elu: 2, agent: 3 }

// DGS / secrétaire de mairie = sommet de la branche administrative.
export function isDGS(p: Person): boolean {
  const s = p.poste.toLowerCase()
  return s.includes('dgs') || s.includes('secrétaire de mairie')
}

// Rang d'un adjoint déduit de son poste : « 1ère adjointe », « 2ème adjoint »…
export function adjointRank(p: Person): number {
  const m = p.poste.match(/(\d+)\s*(?:ère|er|ème|eme|e|nd)\b/i)
  return m ? parseInt(m[1], 10) : 99
}

// Conseiller avec une délégation thématique (poste « Conseiller — … » ou
// « délégué·e ») : placé avant les conseillers sans délégation.
function hasDelegation(p: Person): boolean {
  return p.poste.includes('—') || p.poste.toLowerCase().includes('délégué')
}

export function comparePeople(a: Person, b: Person): number {
  const ra = ROLE_RANK[a.role] ?? 9
  const rb = ROLE_RANK[b.role] ?? 9
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

// Mappers Deliberation (Postgres) ↔ Deliberation (TypeScript app)

import type { Deliberation, DeliberationStatut } from './types'
import type {
  Deliberation as DbDeliberation,
  DeliberationStatut as DbDeliberationStatut,
} from '@prisma/client'

const STATUT_TO_DB: Record<DeliberationStatut, DbDeliberationStatut> = {
  'À venir': 'a_venir',
  Adoptée: 'adoptee',
  Rejetée: 'rejetee',
  Reportée: 'reportee',
}
const STATUT_FROM_DB: Record<DbDeliberationStatut, DeliberationStatut> = {
  a_venir: 'À venir',
  adoptee: 'Adoptée',
  rejetee: 'Rejetée',
  reportee: 'Reportée',
}

export function deliberationStatutToDb(s: DeliberationStatut): DbDeliberationStatut {
  return STATUT_TO_DB[s]
}

export function deliberationFromDb(d: DbDeliberation): Deliberation {
  return {
    id: d.id,
    numero: d.numero,
    objet: d.objet,
    date: d.date.toISOString().slice(0, 10),
    statut: STATUT_FROM_DB[d.statut],
    votePour: d.votePour,
    voteContre: d.voteContre,
    voteAbstention: d.voteAbstention,
    commissionId: d.commissionId ?? undefined,
    notes: d.notes ?? undefined,
    createdAt: d.createdAt.toISOString(),
  }
}

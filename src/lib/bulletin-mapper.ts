// Mapper Bulletin (DB) ↔ Bulletin (TS).
// Les champs snapshot et lignes sont stockés en JSON dans Postgres.

import type { BulletinPaie, BulletinStatut, LigneBulletin } from './types'
import type { BulletinPaie as DbBulletin } from '@prisma/client'

export function bulletinFromDb(b: DbBulletin): BulletinPaie {
  return {
    id: b.id,
    personId: b.personId,
    numero: b.numero,
    mois: b.mois,
    snapshot: b.snapshot as unknown as BulletinPaie['snapshot'],
    lignes: b.lignes as unknown as LigneBulletin[],
    brutTotal: Number(b.brutTotal),
    cotisationsSalariales: Number(b.cotisationsSalariales),
    cotisationsPatronales: Number(b.cotisationsPatronales),
    netImposable: Number(b.netImposable),
    netAPayer: Number(b.netAPayer),
    coutEmployeur: Number(b.coutEmployeur),
    statut: b.statut as BulletinStatut,
    emisAt: b.emisAt.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }
}

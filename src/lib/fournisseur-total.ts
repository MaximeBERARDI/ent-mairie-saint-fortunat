// Compte fournisseur persistant.
//
// Le total engagé d'un fournisseur (cumul des factures validées + payées) est
// stocké sur la ligne Fournisseur plutôt que recalculé à chaque rendu côté
// client. On le recalcule depuis la source de vérité (les factures) à chaque
// mutation de facture, dans la même transaction Postgres — pas d'incrément
// manuel qui pourrait dériver. Les factures payées comptent toujours : le
// compte fournisseur cumule tout ce qu'on lui a effectivement engagé.

import type { Prisma } from '@prisma/client'

export async function recomputeFournisseurTotal(
  tx: Prisma.TransactionClient,
  fournisseurId: string,
): Promise<void> {
  const agg = await tx.facture.aggregate({
    where: { fournisseurId, statut: { in: ['validee', 'payee'] } },
    _sum: { montantTTC: true },
  })
  await tx.fournisseur.update({
    where: { id: fournisseurId },
    data: { totalEngage: agg._sum.montantTTC ?? 0 },
  })
}

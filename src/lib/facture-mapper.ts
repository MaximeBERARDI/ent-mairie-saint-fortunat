// Mappers Facture (Postgres) ↔ Facture (TypeScript app)

import type { Facture, FactureStatut, TaskDocument } from './types'
import type {
  Facture as DbFacture,
  FactureStatut as DbFactureStatut,
  Document as DbDocument,
} from '@prisma/client'

const STATUT_TO_DB: Record<FactureStatut, DbFactureStatut> = {
  'À soumettre': 'a_soumettre',
  'En attente validation': 'en_attente_validation',
  Validée: 'validee',
  Payée: 'payee',
  Rejetée: 'rejetee',
}
const STATUT_FROM_DB: Record<DbFactureStatut, FactureStatut> = {
  a_soumettre: 'À soumettre',
  en_attente_validation: 'En attente validation',
  validee: 'Validée',
  payee: 'Payée',
  rejetee: 'Rejetée',
}

export function statutToDb(s: FactureStatut): DbFactureStatut {
  return STATUT_TO_DB[s]
}
export function statutFromDb(s: DbFactureStatut): FactureStatut {
  return STATUT_FROM_DB[s]
}

function documentFromDb(d: DbDocument): TaskDocument {
  return {
    id: d.id,
    name: d.name,
    size: d.size,
    type: d.type,
    dataUrl: d.dataUrl ?? d.storageUrl ?? '',
    uploadedAt: d.uploadedAt.toISOString(),
  }
}

export function factureFromDb(f: DbFacture & { documents?: DbDocument[] }): Facture {
  return {
    id: f.id,
    numero: f.numero,
    fournisseurId: f.fournisseurId,
    montantTTC: Number(f.montantTTC),
    posteCode: f.posteCode,
    dateFacture: f.dateFacture.toISOString().slice(0, 10),
    dateEcheance: f.dateEcheance ? f.dateEcheance.toISOString().slice(0, 10) : undefined,
    statut: statutFromDb(f.statut),
    submittedById: f.submittedById,
    submittedAt: f.submittedAt.toISOString(),
    validatedById: f.validatedById ?? undefined,
    validatedAt: f.validatedAt?.toISOString(),
    rejectedById: f.rejectedById ?? undefined,
    rejectedAt: f.rejectedAt?.toISOString(),
    rejectionReason: f.rejectionReason ?? undefined,
    paidById: f.paidById ?? undefined,
    paidAt: f.paidAt?.toISOString(),
    datePaiement: f.datePaiement ? f.datePaiement.toISOString().slice(0, 10) : undefined,
    documents: f.documents?.map(documentFromDb) ?? [],
    notes: f.notes ?? undefined,
    createdAt: f.createdAt.toISOString(),
  }
}

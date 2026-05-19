// Mappers Immobilier (Postgres) ↔ TypeScript.
// Biens, locataires, baux, quittances.

import type {
  Bail,
  BienImmobilier,
  Locataire,
  ModeReglement,
  Quittance,
  StatutBail,
  StatutQuittance,
  TaskDocument,
  TypeBien,
} from './types'
import type {
  Bail as DbBail,
  BienImmobilier as DbBien,
  Document as DbDocument,
  Locataire as DbLocataire,
  Quittance as DbQuittance,
  StatutBail as DbStatutBail,
  StatutQuittance as DbStatutQuittance,
} from '@prisma/client'

// ─── StatutBail ─────────────────────────────────────────────────

const BAIL_STATUT_TO_DB: Record<StatutBail, DbStatutBail> = {
  'En cours': 'en_cours',
  Préavis: 'preavis',
  Terminé: 'termine',
}
const BAIL_STATUT_FROM_DB: Record<DbStatutBail, StatutBail> = {
  en_cours: 'En cours',
  preavis: 'Préavis',
  termine: 'Terminé',
}
export const bailStatutToDb = (s: StatutBail) => BAIL_STATUT_TO_DB[s]
export const bailStatutFromDb = (s: DbStatutBail) => BAIL_STATUT_FROM_DB[s]

// ─── StatutQuittance ────────────────────────────────────────────

const QUITT_STATUT_TO_DB: Record<StatutQuittance, DbStatutQuittance> = {
  'À émettre': 'a_emettre',
  Émise: 'emise',
  Payée: 'payee',
  Impayée: 'impayee',
  Relancée: 'relancee',
}
const QUITT_STATUT_FROM_DB: Record<DbStatutQuittance, StatutQuittance> = {
  a_emettre: 'À émettre',
  emise: 'Émise',
  payee: 'Payée',
  impayee: 'Impayée',
  relancee: 'Relancée',
}
export const quittStatutToDb = (s: StatutQuittance) => QUITT_STATUT_TO_DB[s]
export const quittStatutFromDb = (s: DbStatutQuittance) => QUITT_STATUT_FROM_DB[s]

// ─── Helpers ────────────────────────────────────────────────────

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

// ─── Bien ───────────────────────────────────────────────────────

export function bienFromDb(b: DbBien & { documents?: DbDocument[] }): BienImmobilier {
  return {
    id: b.id,
    reference: b.reference,
    nom: b.nom,
    type: b.type as TypeBien,
    adresse: b.adresse,
    surface: Number(b.surface),
    pieces: b.pieces ?? undefined,
    loyerMensuel: Number(b.loyerMensuel),
    chargesMensuelles: Number(b.chargesMensuelles),
    notes: b.notes ?? undefined,
    documents: b.documents?.map(documentFromDb) ?? [],
    active: b.active,
    createdAt: b.createdAt.toISOString(),
  }
}

// ─── Locataire ──────────────────────────────────────────────────

export function locataireFromDb(l: DbLocataire): Locataire {
  return {
    id: l.id,
    prenom: l.prenom,
    nom: l.nom,
    fullName: l.fullName,
    email: l.email ?? undefined,
    phone: l.phone ?? undefined,
    adresseFacturation: l.adresseFacturation ?? undefined,
    notes: l.notes ?? undefined,
    createdAt: l.createdAt.toISOString(),
  }
}

// ─── Bail ───────────────────────────────────────────────────────

export function bailFromDb(b: DbBail & { documents?: DbDocument[] }): Bail {
  return {
    id: b.id,
    bienId: b.bienId,
    locataireId: b.locataireId,
    dateDebut: b.dateDebut.toISOString().slice(0, 10),
    dateFin: b.dateFin?.toISOString().slice(0, 10),
    loyerMensuel: Number(b.loyerMensuel),
    chargesMensuelles: Number(b.chargesMensuelles),
    depotGarantie: Number(b.depotGarantie),
    statut: bailStatutFromDb(b.statut),
    notes: b.notes ?? undefined,
    documents: b.documents?.map(documentFromDb) ?? [],
    createdAt: b.createdAt.toISOString(),
  }
}

// ─── Quittance ──────────────────────────────────────────────────

export function quittanceFromDb(q: DbQuittance): Quittance {
  return {
    id: q.id,
    bailId: q.bailId,
    mois: q.mois,
    numero: q.numero,
    loyerHC: Number(q.loyerHC),
    charges: Number(q.charges),
    total: Number(q.total),
    statut: quittStatutFromDb(q.statut),
    emiseAt: q.emiseAt?.toISOString(),
    payeeAt: q.payeeAt?.toISOString(),
    modeReglement: q.modeReglement as ModeReglement | undefined,
    notes: q.notes ?? undefined,
    createdAt: q.createdAt.toISOString(),
  }
}

// Mappers RH (Postgres) ↔ TypeScript app
// Employees, leave requests, missions.

import type {
  EmployeeRecord,
  LeaveRequest,
  LeaveStatut,
  Mission,
  Pointage,
  PointageType,
  PointageValidationStatut,
  TaskDocument,
  TypeContrat,
} from './types'
import type {
  EmployeeRecord as DbEmployee,
  LeaveRequest as DbLeave,
  LeaveStatut as DbLeaveStatut,
  Mission as DbMission,
  Pointage as DbPointage,
  PointageType as DbPointageType,
  PointageValidationStatut as DbPointageValidationStatut,
  Document as DbDocument,
  TypeContrat as DbTypeContrat,
} from '@prisma/client'

// ─── TypeContrat ────────────────────────────────────────────────

const CONTRAT_TO_DB: Record<TypeContrat, DbTypeContrat> = {
  Titulaire: 'titulaire',
  'Contractuel CDI': 'contractuel_cdi',
  'Contractuel CDD': 'contractuel_cdd',
  Stagiaire: 'stagiaire',
  Apprenti: 'apprenti',
}
const CONTRAT_FROM_DB: Record<DbTypeContrat, TypeContrat> = {
  titulaire: 'Titulaire',
  contractuel_cdi: 'Contractuel CDI',
  contractuel_cdd: 'Contractuel CDD',
  stagiaire: 'Stagiaire',
  apprenti: 'Apprenti',
}
export const contratToDb = (c: TypeContrat) => CONTRAT_TO_DB[c]
export const contratFromDb = (c: DbTypeContrat) => CONTRAT_FROM_DB[c]

// ─── LeaveStatut ────────────────────────────────────────────────

const LEAVE_STATUT_TO_DB: Record<LeaveStatut, DbLeaveStatut> = {
  'En attente': 'en_attente',
  Approuvée: 'approuvee',
  Refusée: 'refusee',
  Annulée: 'annulee',
}
const LEAVE_STATUT_FROM_DB: Record<DbLeaveStatut, LeaveStatut> = {
  en_attente: 'En attente',
  approuvee: 'Approuvée',
  refusee: 'Refusée',
  annulee: 'Annulée',
}
export const leaveStatutToDb = (s: LeaveStatut) => LEAVE_STATUT_TO_DB[s]
export const leaveStatutFromDb = (s: DbLeaveStatut) => LEAVE_STATUT_FROM_DB[s]

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

// ─── Employee ───────────────────────────────────────────────────

export function employeeFromDb(e: DbEmployee): EmployeeRecord {
  return {
    personId: e.personId,
    numAgent: e.numAgent,
    contrat: contratFromDb(e.contrat),
    cadre: (e.cadre as 'A' | 'B' | 'C' | null) ?? undefined,
    grade: e.grade ?? undefined,
    echelon: e.echelon ?? undefined,
    tempsTravailHeures: Number(e.tempsTravailHeures),
    dateEmbauche: e.dateEmbauche.toISOString().slice(0, 10),
    dateFinContrat: e.dateFinContrat?.toISOString().slice(0, 10),
    salaireBrut: Number(e.salaireBrut),
    primes: e.primes ? Number(e.primes) : undefined,
    ifse: e.ifse ? Number(e.ifse) : undefined,
    congesAnnuelsAcquis: Number(e.congesAnnuelsAcquis),
    congesAnnuelsPris: Number(e.congesAnnuelsPris),
    rttAcquis: Number(e.rttAcquis),
    rttPris: Number(e.rttPris),
    joursMaladie: Number(e.joursMaladie),
    notes: e.notes ?? undefined,
    createdAt: e.createdAt.toISOString(),
  }
}

// ─── LeaveRequest ───────────────────────────────────────────────

export function leaveFromDb(l: DbLeave & { documents?: DbDocument[] }): LeaveRequest {
  return {
    id: l.id,
    personId: l.personId,
    type: l.type as LeaveRequest['type'],
    dateDebut: l.dateDebut.toISOString().slice(0, 10),
    dateFin: l.dateFin.toISOString().slice(0, 10),
    nbJoursOuvres: Number(l.nbJoursOuvres),
    motif: l.motif ?? undefined,
    statut: leaveStatutFromDb(l.statut),
    submittedAt: l.submittedAt.toISOString(),
    decidedById: l.decidedById ?? undefined,
    decidedAt: l.decidedAt?.toISOString(),
    decisionMotif: l.decisionMotif ?? undefined,
    documents: l.documents?.map(documentFromDb) ?? [],
    createdAt: l.createdAt.toISOString(),
  }
}

// ─── Pointage ───────────────────────────────────────────────────

const POINTAGE_TYPE_TO_DB: Record<PointageType, DbPointageType> = {
  entree: 'entree',
  sortie: 'sortie',
  'pause-debut': 'pause_debut',
  'pause-fin': 'pause_fin',
}
const POINTAGE_TYPE_FROM_DB: Record<DbPointageType, PointageType> = {
  entree: 'entree',
  sortie: 'sortie',
  pause_debut: 'pause-debut',
  pause_fin: 'pause-fin',
}
export const pointageTypeToDb = (t: PointageType) => POINTAGE_TYPE_TO_DB[t]
export const pointageTypeFromDb = (t: DbPointageType) => POINTAGE_TYPE_FROM_DB[t]

const POINTAGE_VAL_TO_DB: Record<PointageValidationStatut, DbPointageValidationStatut> = {
  'En attente': 'en_attente',
  Approuvée: 'approuvee',
  Refusée: 'refusee',
}
const POINTAGE_VAL_FROM_DB: Record<DbPointageValidationStatut, PointageValidationStatut> = {
  en_attente: 'En attente',
  approuvee: 'Approuvée',
  refusee: 'Refusée',
}
export const pointageValToDb = (v: PointageValidationStatut) => POINTAGE_VAL_TO_DB[v]
export const pointageValFromDb = (v: DbPointageValidationStatut) => POINTAGE_VAL_FROM_DB[v]

export function pointageFromDb(p: DbPointage): Pointage {
  return {
    id: p.id,
    personId: p.personId,
    type: pointageTypeFromDb(p.type),
    timestamp: p.timestamp.toISOString(),
    manuel: p.manuel,
    motif: p.motif ?? undefined,
    validationStatut: p.validationStatut ? pointageValFromDb(p.validationStatut) : undefined,
    validateurId: p.validateurId ?? undefined,
    validatedAt: p.validatedAt?.toISOString(),
    validationMotif: p.validationMotif ?? undefined,
    createdAt: p.createdAt.toISOString(),
    createdById: p.createdById,
  }
}

// ─── Mission ────────────────────────────────────────────────────

export function missionFromDb(m: DbMission & { documents?: DbDocument[] }): Mission {
  return {
    id: m.id,
    personId: m.personId,
    label: m.label,
    description: m.description ?? undefined,
    dateDebut: m.dateDebut.toISOString().slice(0, 10),
    dateFin: m.dateFin?.toISOString().slice(0, 10),
    lieu: m.lieu ?? undefined,
    documents: m.documents?.map(documentFromDb) ?? [],
    createdAt: m.createdAt.toISOString(),
  }
}

// Mappers Subvention + Projet (Postgres) ↔ TypeScript

import type {
  DemandeSubvention,
  FinancementProjet,
  Projet,
  SourceFinancement,
  SourceSubvention,
  StatutSubvention,
} from './types'
import type {
  DemandeSubvention as DbSubvention,
  FinancementProjet as DbFinancement,
  Projet as DbProjet,
} from '@prisma/client'

export function subventionFromDb(s: DbSubvention): DemandeSubvention {
  return {
    id: s.id,
    reference: s.reference,
    intitule: s.intitule,
    description: s.description ?? undefined,
    source: s.source as SourceSubvention,
    organisme: s.organisme,
    contactNom: s.contactNom ?? undefined,
    contactEmail: s.contactEmail ?? undefined,
    montantProjet: Number(s.montantProjet),
    montantDemande: Number(s.montantDemande),
    montantAccorde: s.montantAccorde ? Number(s.montantAccorde) : undefined,
    montantVerse: s.montantVerse ? Number(s.montantVerse) : undefined,
    dateDepot: s.dateDepot?.toISOString().slice(0, 10),
    dateDecision: s.dateDecision?.toISOString().slice(0, 10),
    datePrevisionVersement: s.datePrevisionVersement?.toISOString().slice(0, 10),
    statut: s.statut as StatutSubvention,
    motifRefus: s.motifRefus ?? undefined,
    imputationCompte: s.imputationCompte ?? undefined,
    notes: s.notes ?? undefined,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export function financementFromDb(f: DbFinancement): FinancementProjet {
  return {
    id: f.id,
    source: f.source as SourceFinancement,
    organisme: f.organisme ?? undefined,
    montant: Number(f.montant),
    dureeAnnees: f.dureeAnnees ?? undefined,
    tauxInteret: f.tauxInteret ? Number(f.tauxInteret) : undefined,
    anneeVersement: f.anneeVersement ?? undefined,
    certitude: f.certitude as FinancementProjet['certitude'] | undefined,
    subventionId: f.subventionId ?? undefined,
  }
}

export function projetFromDb(p: DbProjet & { financements?: DbFinancement[] }): Projet {
  return {
    id: p.id,
    nom: p.nom,
    description: p.description ?? undefined,
    coutTotal: Number(p.coutTotal),
    coutHT: p.coutHT ? Number(p.coutHT) : undefined,
    imputationCompte: p.imputationCompte,
    anneeDebut: p.anneeDebut,
    anneesEtalement: p.anneesEtalement,
    tauxFCTVA: p.tauxFCTVA ? Number(p.tauxFCTVA) : undefined,
    notes: p.notes ?? undefined,
    financements: p.financements?.map(financementFromDb) ?? [],
    createdAt: p.createdAt.toISOString(),
  }
}

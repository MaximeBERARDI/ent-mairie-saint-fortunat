// Génère un fichier SQL complet pour seeder Supabase via le SQL Editor,
// sans avoir besoin d'accès direct à la base depuis Node.
//
// Usage : npx tsx prisma/generate-seed-sql.ts
// Produit : prisma/seed.sql

import bcrypt from 'bcryptjs'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { PEOPLE } from '../src/lib/people'
import { COMMISSIONS, EMPLOYEE_RECORDS, FOURNISSEURS, TASKS, FACTURES, LEAVE_REQUESTS, MISSIONS, POINTAGES, BIENS_IMMOBILIERS, LOCATAIRES, BAUX, QUITTANCES, DEMANDES_SUBVENTIONS, PROJETS } from '../src/lib/data'
import { COMPTES_M14 } from '../src/lib/m14-plan'
import type { TaskPriority, TaskStatus } from '../src/lib/types'

const FACTURE_STATUT_TO_DB: Record<string, string> = {
  'À soumettre': 'a_soumettre',
  'En attente validation': 'en_attente_validation',
  'Validée': 'validee',
  'Rejetée': 'rejetee',
}

const LEAVE_STATUT_TO_DB: Record<string, string> = {
  'En attente': 'en_attente',
  'Approuvée': 'approuvee',
  'Refusée': 'refusee',
  'Annulée': 'annulee',
}

const POINTAGE_TYPE_TO_DB: Record<string, string> = {
  entree: 'entree',
  sortie: 'sortie',
  'pause-debut': 'pause_debut',
  'pause-fin': 'pause_fin',
}
const POINTAGE_VAL_TO_DB: Record<string, string> = {
  'En attente': 'en_attente',
  'Approuvée': 'approuvee',
  'Refusée': 'refusee',
}

const BAIL_STATUT_TO_DB: Record<string, string> = {
  'En cours': 'en_cours',
  'Préavis': 'preavis',
  'Terminé': 'termine',
}

const QUITT_STATUT_TO_DB: Record<string, string> = {
  'À émettre': 'a_emettre',
  'Émise': 'emise',
  'Payée': 'payee',
  'Impayée': 'impayee',
  'Relancée': 'relancee',
}

const DEFAULT_PASSWORD = 'saintfortunat2026'

// ─── Helpers d'échappement ────────────────────────────────────────

function sqlString(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'NULL'
  return `'${v.replace(/'/g, "''")}'`
}

function sqlBool(v: boolean | undefined): string {
  return v ? 'TRUE' : 'FALSE'
}

function sqlNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'NULL'
  return String(v)
}

function sqlDate(v: string | null | undefined): string {
  if (!v) return 'NULL'
  // Si la date est au format YYYY-MM-DD seul, on en fait un timestamp à midi UTC
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v
  return `'${iso}'::timestamptz`
}

function sqlTextArray(arr: readonly string[] | undefined): string {
  if (!arr || arr.length === 0) return "'{}'::text[]"
  const escaped = arr.map((s) => `"${s.replace(/"/g, '\\"')}"`).join(',')
  return `'{${escaped}}'::text[]`
}

// Conversion auth-level kebab → snake_case (pour les enums Postgres)
function authLevelToEnum(v: string): string {
  return v.replace(/-/g, '_')
}

// Conversion type contrat libellé → enum Postgres
function contratToEnum(v: string): string {
  const map: Record<string, string> = {
    Titulaire: 'titulaire',
    'Contractuel CDI': 'contractuel_cdi',
    'Contractuel CDD': 'contractuel_cdd',
    Stagiaire: 'stagiaire',
    Apprenti: 'apprenti',
    Contractuel: 'contractuel_cdd',
  }
  return map[v] ?? 'contractuel_cdd'
}

function taskPriorityToEnum(v: TaskPriority): string {
  return { Urgent: 'urgent', Normal: 'normal', Faible: 'faible' }[v]
}

function taskStatusToEnum(v: TaskStatus): string {
  return {
    'À faire': 'a_faire',
    'En cours': 'en_cours',
    'En attente validation': 'en_attente_validation',
    'Terminé': 'termine',
  }[v]
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  const lines: string[] = []

  lines.push(
    '-- ╔══════════════════════════════════════════════════════════╗',
    '-- ║  SEED initial — Mairie de Saint-Fortunat-sur-Eyrieux     ║',
    '-- ║  Persons + Users + Commissions + Plan M14 + Fournisseurs ║',
    '-- ║  + EmployeeRecords                                       ║',
    '-- ║                                                          ║',
    "-- ║  Mot de passe par défaut : 'saintfortunat2026'           ║",
    '-- ║  (à changer à la 1ʳᵉ connexion)                          ║',
    '-- ╚══════════════════════════════════════════════════════════╝',
    '',
    '-- Idempotent : peut être relancé sans erreur grâce aux ON CONFLICT.',
    'BEGIN;',
    '',
  )

  // 1. Persons
  lines.push('-- ─── 1. Persons ─────────────────────────────────────────────')
  for (const p of PEOPLE) {
    const startDate = p.startDate ? `'${p.startDate}'::date` : 'NULL'
    lines.push(
      `INSERT INTO persons (id, prenom, nom, "fullName", role, poste, email, phone, color, initials, "authLevel", "customPermissions", "canSign", "signatureDomains", "responsibleCommissions", active, "startDate") VALUES (`,
      `  ${sqlString(p.id)},`,
      `  ${sqlString(p.prenom)},`,
      `  ${sqlString(p.nom)},`,
      `  ${sqlString(p.fullName)},`,
      `  '${p.role}'::"PersonRole",`,
      `  ${sqlString(p.poste)},`,
      `  ${sqlString(p.email)},`,
      `  ${sqlString(p.phone)},`,
      `  ${sqlString(p.color)},`,
      `  ${sqlString(p.initials)},`,
      `  '${authLevelToEnum(p.authLevel)}'::"AuthLevel",`,
      `  ${sqlTextArray(p.customPermissions)},`,
      `  ${sqlBool(p.canSign)},`,
      `  ${sqlTextArray(p.signatureDomains)},`,
      `  ${sqlTextArray(p.responsibleCommissions)},`,
      `  ${sqlBool(p.active)},`,
      `  ${startDate}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 2. Users (1 user par person, mot de passe partagé)
  lines.push('-- ─── 2. Users (NextAuth) ────────────────────────────────────')
  lines.push(`-- Mot de passe partagé : '${DEFAULT_PASSWORD}' (hashé bcrypt)`)
  for (const p of PEOPLE) {
    const userId = `user-${p.id}`
    lines.push(
      `INSERT INTO users (id, email, name, "hashedPassword", "personId", "createdAt", "updatedAt") VALUES (`,
      `  ${sqlString(userId)},`,
      `  ${sqlString(p.email)},`,
      `  ${sqlString(p.fullName)},`,
      `  ${sqlString(hashedPassword)},`,
      `  ${sqlString(p.id)},`,
      `  NOW(),`,
      `  NOW()`,
      `) ON CONFLICT (email) DO NOTHING;`,
      '',
    )
  }

  // 3. Commissions
  lines.push('-- ─── 3. Commissions ─────────────────────────────────────────')
  for (const c of COMMISSIONS) {
    lines.push(
      `INSERT INTO commissions (id, name, color, "nextMeeting") VALUES (`,
      `  ${sqlString(c.id)},`,
      `  ${sqlString(c.name)},`,
      `  ${sqlString(c.color)},`,
      `  ${sqlString(c.nextMeeting)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 4. Plan comptable M14
  lines.push('-- ─── 4. Plan comptable M14 ──────────────────────────────────')
  for (const c of COMPTES_M14) {
    lines.push(
      `INSERT INTO comptes_m14 (code, label, "chapitreCode", section, sens, "budgetAlloue", "consommationInitiale") VALUES (`,
      `  ${sqlString(c.code)},`,
      `  ${sqlString(c.label)},`,
      `  ${sqlString(c.chapitreCode)},`,
      `  ${sqlString(c.section)},`,
      `  ${sqlString(c.sens)},`,
      `  ${sqlNum(c.budgetAlloue)},`,
      `  ${sqlNum(c.consommationInitiale)}`,
      `) ON CONFLICT (code) DO NOTHING;`,
      '',
    )
  }

  // 5. Fournisseurs
  lines.push('-- ─── 5. Fournisseurs ────────────────────────────────────────')
  for (const f of FOURNISSEURS) {
    lines.push(
      `INSERT INTO fournisseurs (id, nom, categorie, siret, email, phone, "numClient", "posteParDefaut", "delaiPaiement", active, "createdAt") VALUES (`,
      `  ${sqlString(f.id)},`,
      `  ${sqlString(f.nom)},`,
      `  ${sqlString(f.categorie)},`,
      `  ${sqlString(f.siret)},`,
      `  ${sqlString(f.email)},`,
      `  ${sqlString(f.phone)},`,
      `  ${sqlString(f.numClient)},`,
      `  ${sqlString(f.posteParDefaut)},`,
      `  ${sqlNum(f.delaiPaiement)},`,
      `  ${sqlBool(f.active)},`,
      `  ${sqlDate(f.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 6. EmployeeRecords
  lines.push('-- ─── 6. Employee records ────────────────────────────────────')
  for (const e of EMPLOYEE_RECORDS) {
    lines.push(
      `INSERT INTO employee_records ("personId", "numAgent", contrat, cadre, grade, echelon, "tempsTravailHeures", "dateEmbauche", "dateFinContrat", "salaireBrut", primes, ifse, "congesAnnuelsAcquis", "congesAnnuelsPris", "rttAcquis", "rttPris", "joursMaladie", notes, "createdAt") VALUES (`,
      `  ${sqlString(e.personId)},`,
      `  ${sqlString(e.numAgent)},`,
      `  '${contratToEnum(e.contrat)}'::"TypeContrat",`,
      `  ${sqlString(e.cadre)},`,
      `  ${sqlString(e.grade)},`,
      `  ${sqlNum(e.echelon)},`,
      `  ${sqlNum(e.tempsTravailHeures)},`,
      `  ${sqlDate(e.dateEmbauche)},`,
      `  ${sqlDate(e.dateFinContrat)},`,
      `  ${sqlNum(e.salaireBrut)},`,
      `  ${sqlNum(e.primes)},`,
      `  ${sqlNum(e.ifse)},`,
      `  ${sqlNum(e.congesAnnuelsAcquis)},`,
      `  ${sqlNum(e.congesAnnuelsPris)},`,
      `  ${sqlNum(e.rttAcquis)},`,
      `  ${sqlNum(e.rttPris)},`,
      `  ${sqlNum(e.joursMaladie)},`,
      `  ${sqlString(e.notes)},`,
      `  ${sqlDate(e.createdAt)}`,
      `) ON CONFLICT ("personId") DO NOTHING;`,
      '',
    )
  }

  // 7. Tâches initiales
  lines.push('-- ─── 7. Tâches initiales ────────────────────────────────────')
  for (const t of TASKS) {
    const id = t.id.startsWith('task-') ? t.id : `task-seed-${t.id}`
    lines.push(
      `INSERT INTO tasks (id, label, description, "commissionIds", "assigneeIds", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (`,
      `  ${sqlString(id)},`,
      `  ${sqlString(t.label)},`,
      `  ${sqlString(t.description)},`,
      `  ${t.commissionIds.length ? `ARRAY[${t.commissionIds.map(c => sqlString(c)).join(', ')}]::text[]` : `'{}'`},`,
      `  ${t.assigneeIds.length ? `ARRAY[${t.assigneeIds.map(a => sqlString(a)).join(', ')}]::text[]` : `'{}'`},`,
      `  ${sqlString(t.validatorId)},`,
      `  ${sqlString(t.createdById)},`,
      `  ${t.dueDate ? `'${t.dueDate}'::date` : 'NULL'},`,
      `  '${taskPriorityToEnum(t.priority)}'::"TaskPriority",`,
      `  '${taskStatusToEnum(t.status)}'::"TaskStatus",`,
      `  ${sqlDate(t.createdAt)},`,
      `  ${sqlDate(t.updatedAt ?? t.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 8. Factures initiales
  lines.push('-- ─── 8. Factures initiales ──────────────────────────────────')
  for (const f of FACTURES) {
    lines.push(
      `INSERT INTO factures (id, numero, "fournisseurId", "montantTTC", "posteCode", "dateFacture", "dateEcheance", statut, "submittedById", "submittedAt", "validatedById", "validatedAt", "rejectedById", "rejectedAt", "rejectionReason", notes, "createdAt") VALUES (`,
      `  ${sqlString(f.id)},`,
      `  ${sqlString(f.numero)},`,
      `  ${sqlString(f.fournisseurId)},`,
      `  ${sqlNum(f.montantTTC)},`,
      `  ${sqlString(f.posteCode)},`,
      `  '${f.dateFacture}'::date,`,
      `  ${f.dateEcheance ? `'${f.dateEcheance}'::date` : 'NULL'},`,
      `  '${FACTURE_STATUT_TO_DB[f.statut]}'::"FactureStatut",`,
      `  ${sqlString(f.submittedById)},`,
      `  ${sqlDate(f.submittedAt)},`,
      `  ${sqlString(f.validatedById)},`,
      `  ${sqlDate(f.validatedAt)},`,
      `  ${sqlString(f.rejectedById)},`,
      `  ${sqlDate(f.rejectedAt)},`,
      `  ${sqlString(f.rejectionReason)},`,
      `  ${sqlString(f.notes)},`,
      `  ${sqlDate(f.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 9. Demandes de congés
  lines.push('-- ─── 9. Demandes de congés ──────────────────────────────────')
  for (const l of LEAVE_REQUESTS) {
    lines.push(
      `INSERT INTO leave_requests (id, "personId", type, "dateDebut", "dateFin", "nbJoursOuvres", motif, statut, "submittedAt", "decidedById", "decidedAt", "decisionMotif", "createdAt") VALUES (`,
      `  ${sqlString(l.id)},`,
      `  ${sqlString(l.personId)},`,
      `  ${sqlString(l.type)},`,
      `  '${l.dateDebut}'::date,`,
      `  '${l.dateFin}'::date,`,
      `  ${sqlNum(l.nbJoursOuvres)},`,
      `  ${sqlString(l.motif)},`,
      `  '${LEAVE_STATUT_TO_DB[l.statut]}'::"LeaveStatut",`,
      `  ${sqlDate(l.submittedAt)},`,
      `  ${sqlString(l.decidedById)},`,
      `  ${sqlDate(l.decidedAt)},`,
      `  ${sqlString(l.decisionMotif)},`,
      `  ${sqlDate(l.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 10. Missions
  lines.push('-- ─── 10. Missions ───────────────────────────────────────────')
  for (const m of MISSIONS) {
    lines.push(
      `INSERT INTO missions (id, "personId", label, description, "dateDebut", "dateFin", lieu, "createdAt") VALUES (`,
      `  ${sqlString(m.id)},`,
      `  ${sqlString(m.personId)},`,
      `  ${sqlString(m.label)},`,
      `  ${sqlString(m.description)},`,
      `  '${m.dateDebut}'::date,`,
      `  ${m.dateFin ? `'${m.dateFin}'::date` : 'NULL'},`,
      `  ${sqlString(m.lieu)},`,
      `  ${sqlDate(m.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 11. Pointages
  lines.push('-- ─── 11. Pointages ──────────────────────────────────────────')
  for (const p of POINTAGES) {
    lines.push(
      `INSERT INTO pointages (id, "personId", type, timestamp, manuel, motif, "validationStatut", "validateurId", "validatedAt", "validationMotif", "createdAt", "createdById") VALUES (`,
      `  ${sqlString(p.id)},`,
      `  ${sqlString(p.personId)},`,
      `  '${POINTAGE_TYPE_TO_DB[p.type]}'::"PointageType",`,
      `  ${sqlDate(p.timestamp)},`,
      `  ${sqlBool(p.manuel)},`,
      `  ${sqlString(p.motif)},`,
      `  ${p.validationStatut ? `'${POINTAGE_VAL_TO_DB[p.validationStatut]}'::"PointageValidationStatut"` : 'NULL'},`,
      `  ${sqlString(p.validateurId)},`,
      `  ${sqlDate(p.validatedAt)},`,
      `  ${sqlString(p.validationMotif)},`,
      `  ${sqlDate(p.createdAt)},`,
      `  ${sqlString(p.createdById)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 12. Biens immobiliers
  lines.push('-- ─── 12. Biens immobiliers ──────────────────────────────────')
  for (const b of BIENS_IMMOBILIERS) {
    lines.push(
      `INSERT INTO biens_immobiliers (id, reference, nom, type, adresse, surface, pieces, "loyerMensuel", "chargesMensuelles", notes, active, "createdAt") VALUES (`,
      `  ${sqlString(b.id)},`,
      `  ${sqlString(b.reference)},`,
      `  ${sqlString(b.nom)},`,
      `  ${sqlString(b.type)},`,
      `  ${sqlString(b.adresse)},`,
      `  ${sqlNum(b.surface)},`,
      `  ${sqlNum(b.pieces)},`,
      `  ${sqlNum(b.loyerMensuel)},`,
      `  ${sqlNum(b.chargesMensuelles)},`,
      `  ${sqlString(b.notes)},`,
      `  ${sqlBool(b.active)},`,
      `  ${sqlDate(b.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 13. Locataires
  lines.push('-- ─── 13. Locataires ─────────────────────────────────────────')
  for (const l of LOCATAIRES) {
    lines.push(
      `INSERT INTO locataires (id, prenom, nom, "fullName", email, phone, "adresseFacturation", notes, "createdAt") VALUES (`,
      `  ${sqlString(l.id)},`,
      `  ${sqlString(l.prenom)},`,
      `  ${sqlString(l.nom)},`,
      `  ${sqlString(l.fullName)},`,
      `  ${sqlString(l.email)},`,
      `  ${sqlString(l.phone)},`,
      `  ${sqlString(l.adresseFacturation)},`,
      `  ${sqlString(l.notes)},`,
      `  ${sqlDate(l.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 14. Baux
  lines.push('-- ─── 14. Baux ───────────────────────────────────────────────')
  for (const b of BAUX) {
    lines.push(
      `INSERT INTO baux (id, "bienId", "locataireId", "dateDebut", "dateFin", "loyerMensuel", "chargesMensuelles", "depotGarantie", statut, notes, "createdAt") VALUES (`,
      `  ${sqlString(b.id)},`,
      `  ${sqlString(b.bienId)},`,
      `  ${sqlString(b.locataireId)},`,
      `  '${b.dateDebut}'::date,`,
      `  ${b.dateFin ? `'${b.dateFin}'::date` : 'NULL'},`,
      `  ${sqlNum(b.loyerMensuel)},`,
      `  ${sqlNum(b.chargesMensuelles)},`,
      `  ${sqlNum(b.depotGarantie)},`,
      `  '${BAIL_STATUT_TO_DB[b.statut]}'::"StatutBail",`,
      `  ${sqlString(b.notes)},`,
      `  ${sqlDate(b.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 15. Quittances
  lines.push('-- ─── 15. Quittances ─────────────────────────────────────────')
  for (const q of QUITTANCES) {
    lines.push(
      `INSERT INTO quittances (id, "bailId", mois, numero, "loyerHC", charges, total, statut, "emiseAt", "payeeAt", "modeReglement", notes, "createdAt") VALUES (`,
      `  ${sqlString(q.id)},`,
      `  ${sqlString(q.bailId)},`,
      `  ${sqlString(q.mois)},`,
      `  ${sqlString(q.numero)},`,
      `  ${sqlNum(q.loyerHC)},`,
      `  ${sqlNum(q.charges)},`,
      `  ${sqlNum(q.total)},`,
      `  '${QUITT_STATUT_TO_DB[q.statut]}'::"StatutQuittance",`,
      `  ${sqlDate(q.emiseAt)},`,
      `  ${sqlDate(q.payeeAt)},`,
      `  ${sqlString(q.modeReglement)},`,
      `  ${sqlString(q.notes)},`,
      `  ${sqlDate(q.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 16. Demandes de subventions
  lines.push('-- ─── 16. Demandes de subventions ────────────────────────────')
  for (const s of DEMANDES_SUBVENTIONS) {
    lines.push(
      `INSERT INTO demandes_subventions (id, reference, intitule, description, source, organisme, "contactNom", "contactEmail", "montantProjet", "montantDemande", "montantAccorde", "montantVerse", "dateDepot", "dateDecision", "datePrevisionVersement", statut, "motifRefus", "imputationCompte", notes, "createdAt", "updatedAt") VALUES (`,
      `  ${sqlString(s.id)},`,
      `  ${sqlString(s.reference)},`,
      `  ${sqlString(s.intitule)},`,
      `  ${sqlString(s.description)},`,
      `  ${sqlString(s.source)},`,
      `  ${sqlString(s.organisme)},`,
      `  ${sqlString(s.contactNom)},`,
      `  ${sqlString(s.contactEmail)},`,
      `  ${sqlNum(s.montantProjet)},`,
      `  ${sqlNum(s.montantDemande)},`,
      `  ${sqlNum(s.montantAccorde)},`,
      `  ${sqlNum(s.montantVerse)},`,
      `  ${s.dateDepot ? `'${s.dateDepot}'::date` : 'NULL'},`,
      `  ${s.dateDecision ? `'${s.dateDecision}'::date` : 'NULL'},`,
      `  ${s.datePrevisionVersement ? `'${s.datePrevisionVersement}'::date` : 'NULL'},`,
      `  ${sqlString(s.statut)},`,
      `  ${sqlString(s.motifRefus)},`,
      `  ${sqlString(s.imputationCompte)},`,
      `  ${sqlString(s.notes)},`,
      `  ${sqlDate(s.createdAt)},`,
      `  ${sqlDate(s.updatedAt ?? s.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
  }

  // 17. Projets (avec financements en cascade)
  lines.push('-- ─── 17. Projets d\'investissement + financements ───────────')
  for (const p of PROJETS) {
    lines.push(
      `INSERT INTO projets (id, nom, description, "coutTotal", "coutHT", "imputationCompte", "anneeDebut", "anneesEtalement", "tauxFCTVA", notes, "createdAt") VALUES (`,
      `  ${sqlString(p.id)},`,
      `  ${sqlString(p.nom)},`,
      `  ${sqlString(p.description)},`,
      `  ${sqlNum(p.coutTotal)},`,
      `  ${sqlNum(p.coutHT)},`,
      `  ${sqlString(p.imputationCompte)},`,
      `  ${sqlNum(p.anneeDebut)},`,
      `  ${sqlNum(p.anneesEtalement)},`,
      `  ${sqlNum(p.tauxFCTVA)},`,
      `  ${sqlString(p.notes)},`,
      `  ${sqlDate(p.createdAt)}`,
      `) ON CONFLICT (id) DO NOTHING;`,
      '',
    )
    for (const f of p.financements) {
      lines.push(
        `INSERT INTO financements_projet (id, "projetId", source, organisme, montant, "dureeAnnees", "tauxInteret", "anneeVersement", certitude, "subventionId") VALUES (`,
        `  ${sqlString(f.id)},`,
        `  ${sqlString(p.id)},`,
        `  ${sqlString(f.source)},`,
        `  ${sqlString(f.organisme)},`,
        `  ${sqlNum(f.montant)},`,
        `  ${sqlNum(f.dureeAnnees)},`,
        `  ${sqlNum(f.tauxInteret)},`,
        `  ${sqlNum(f.anneeVersement)},`,
        `  ${sqlString(f.certitude)},`,
        `  ${sqlString(f.subventionId)}`,
        `) ON CONFLICT (id) DO NOTHING;`,
        '',
      )
    }
  }

  lines.push(
    '-- ─── Fin du seed ────────────────────────────────────────────────',
    'COMMIT;',
    '',
  )

  const out = resolve(__dirname, 'seed.sql')
  writeFileSync(out, lines.join('\n'))
  console.log(`✓ ${lines.length} lignes écrites dans ${out}`)
  console.log(`  ${PEOPLE.length} persons/users, ${COMMISSIONS.length} commissions, ${COMPTES_M14.length} comptes M14, ${FOURNISSEURS.length} fournisseurs, ${EMPLOYEE_RECORDS.length} employees, ${TASKS.length} tasks, ${FACTURES.length} factures, ${LEAVE_REQUESTS.length} leaves, ${MISSIONS.length} missions, ${POINTAGES.length} pointages, ${BIENS_IMMOBILIERS.length} biens, ${LOCATAIRES.length} locataires, ${BAUX.length} baux, ${QUITTANCES.length} quittances, ${DEMANDES_SUBVENTIONS.length} subventions, ${PROJETS.length} projets`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

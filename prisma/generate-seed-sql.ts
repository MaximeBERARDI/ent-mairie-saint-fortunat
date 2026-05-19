// Génère un fichier SQL complet pour seeder Supabase via le SQL Editor,
// sans avoir besoin d'accès direct à la base depuis Node.
//
// Usage : npx tsx prisma/generate-seed-sql.ts
// Produit : prisma/seed.sql

import bcrypt from 'bcryptjs'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { PEOPLE } from '../src/lib/people'
import { COMMISSIONS, EMPLOYEE_RECORDS, FOURNISSEURS, TASKS, FACTURES } from '../src/lib/data'
import { COMPTES_M14 } from '../src/lib/m14-plan'
import type { TaskPriority, TaskStatus } from '../src/lib/types'

const FACTURE_STATUT_TO_DB: Record<string, string> = {
  'À soumettre': 'a_soumettre',
  'En attente validation': 'en_attente_validation',
  'Validée': 'validee',
  'Rejetée': 'rejetee',
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
      `INSERT INTO tasks (id, label, description, "commissionId", "assigneeId", "validatorId", "createdById", "dueDate", priority, status, "createdAt", "updatedAt") VALUES (`,
      `  ${sqlString(id)},`,
      `  ${sqlString(t.label)},`,
      `  ${sqlString(t.description)},`,
      `  ${sqlString(t.commissionId)},`,
      `  ${sqlString(t.assigneeId)},`,
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

  lines.push(
    '-- ─── Fin du seed ────────────────────────────────────────────────',
    'COMMIT;',
    '',
  )

  const out = resolve(__dirname, 'seed.sql')
  writeFileSync(out, lines.join('\n'))
  console.log(`✓ ${lines.length} lignes écrites dans ${out}`)
  console.log(`  ${PEOPLE.length} persons / users, ${COMMISSIONS.length} commissions, ${COMPTES_M14.length} comptes M14, ${FOURNISSEURS.length} fournisseurs, ${EMPLOYEE_RECORDS.length} employee records, ${TASKS.length} tasks, ${FACTURES.length} factures`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

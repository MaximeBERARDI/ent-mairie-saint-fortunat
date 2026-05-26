// Mapper Personnes (Postgres) ↔ TypeScript app
//
// La seule divergence réelle est l'enum authLevel : la base utilise des
// underscores (super_admin) alors que l'app utilise des tirets (super-admin).
// Le reste (PersonRole, tableaux de clés) est identique des deux côtés.

import type { Person, PersonRole } from './people'
import type { AuthLevel, Permission, SignatureDomain } from './permissions'
import type { Person as DbPerson, AuthLevel as DbAuthLevel } from '@prisma/client'

// ─── AuthLevel ──────────────────────────────────────────────────

const AUTH_LEVEL_FROM_DB: Record<DbAuthLevel, AuthLevel> = {
  super_admin: 'super-admin',
  admin: 'admin',
  gestionnaire: 'gestionnaire',
  contributeur: 'contributeur',
  lecteur: 'lecteur',
}
const AUTH_LEVEL_TO_DB: Record<AuthLevel, DbAuthLevel> = {
  'super-admin': 'super_admin',
  admin: 'admin',
  gestionnaire: 'gestionnaire',
  contributeur: 'contributeur',
  lecteur: 'lecteur',
}
export const authLevelFromDb = (a: DbAuthLevel): AuthLevel => AUTH_LEVEL_FROM_DB[a]
export const authLevelToDb = (a: AuthLevel): DbAuthLevel => AUTH_LEVEL_TO_DB[a]

// ─── Helpers ────────────────────────────────────────────────────

export function deriveInitials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

// ─── Person ─────────────────────────────────────────────────────

export function personFromDb(p: DbPerson): Person {
  return {
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    fullName: p.fullName,
    role: p.role as PersonRole,
    poste: p.poste,
    email: p.email,
    phone: p.phone ?? undefined,
    color: p.color,
    initials: p.initials,
    authLevel: authLevelFromDb(p.authLevel),
    customPermissions: p.customPermissions as Permission[],
    canSign: p.canSign,
    signatureDomains: p.signatureDomains as SignatureDomain[],
    responsibleCommissions: p.responsibleCommissions,
    active: p.active,
    startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : undefined,
  }
}

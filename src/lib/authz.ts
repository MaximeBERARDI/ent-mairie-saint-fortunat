// Helper d'autorisation côté serveur.
//
// Charge la Person de l'utilisateur courant (via la session NextAuth) et
// expose un `can(permission)` calculé sur ses droits réels (authLevel +
// customPermissions). À utiliser dans les routes API pour enforcer les
// permissions au-delà du simple "authentifié".

import { auth } from './auth'
import { db } from './db'
import { authLevelFromDb } from './team-mapper'
import { hasPermission, type Permission } from './permissions'
import type { Person as DbPerson } from '@prisma/client'

export interface AuthContext {
  userId: string
  actor: DbPerson
  can: (perm: Permission) => boolean
}

/**
 * Retourne le contexte d'autorisation (acteur + can) ou null si non
 * authentifié / profil introuvable.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth()
  if (!session?.user?.personId) return null

  const actor = await db.person.findUnique({ where: { id: session.user.personId } })
  if (!actor) return null

  const level = authLevelFromDb(actor.authLevel)
  return {
    userId: session.user.id,
    actor,
    can: (perm: Permission) =>
      hasPermission(level, perm, actor.customPermissions as Permission[]),
  }
}

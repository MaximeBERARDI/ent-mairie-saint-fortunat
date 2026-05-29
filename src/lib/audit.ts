// Journal d'audit : écriture best-effort d'une trace d'action sensible.
// N'interrompt jamais la mutation appelante (les erreurs sont avalées).

import { db } from './db'
import type { AuthContext } from './authz'

export async function logAudit(
  ctx: AuthContext | null,
  e: { action: string; entity: string; entityId?: string; summary: string },
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: ctx?.actor.id ?? null,
        actorName: ctx?.actor.fullName ?? 'Système',
        action: e.action,
        entity: e.entity,
        entityId: e.entityId ?? null,
        summary: e.summary,
      },
    })
  } catch (err) {
    console.error('[audit] échec écriture journal:', err)
  }
}

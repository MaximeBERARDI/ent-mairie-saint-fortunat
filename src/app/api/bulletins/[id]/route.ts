// PATCH  /api/bulletins/[id]  → update statut
// DELETE /api/bulletins/[id]

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { logAudit } from '@/lib/audit'
import { bulletinFromDb } from '@/lib/bulletin-mapper'
import type { BulletinStatut } from '@/lib/types'

// Gestion de la paie (émission, statut, suppression) : réservée au RH.
const canManagePayslips = (ctx: { can: (p: 'hr.generate-payslips' | 'hr.manage') => boolean }) =>
  ctx.can('hr.generate-payslips') || ctx.can('hr.manage')

interface PatchBody {
  statut?: BulletinStatut
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!canManagePayslips(ctx)) return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.statut) {
    return NextResponse.json({ error: 'Statut requis.' }, { status: 400 })
  }

  try {
    const updated = await db.bulletinPaie.update({
      where: { id: params.id },
      data: { statut: body.statut },
    })
    return NextResponse.json(bulletinFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!canManagePayslips(ctx)) return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })

  try {
    const removed = await db.bulletinPaie.delete({ where: { id: params.id } })
    await logAudit(ctx, {
      action: 'bulletin.delete', entity: 'bulletin', entityId: params.id,
      summary: `Suppression du bulletin ${removed.numero} (${removed.mois})`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }
}

// PATCH  /api/leaves/[id]  → workflow + édition (action: approve/reject/reopen)
// DELETE /api/leaves/[id]
//
// L'approbation décrémente les compteurs sur EmployeeRecord, dans la
// même transaction que l'update du leave. La réouverture / suppression
// d'un leave Approuvé re-crédite les compteurs.

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/authz'
import { logAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { leaveFromDb } from '@/lib/rh-mapper'
import type { LeaveType } from '@/lib/types'
import type { LeaveRequest as DbLeave, Prisma } from '@prisma/client'

// Effet d'une approbation (sign=+1) ou d'une révocation (sign=-1)
// sur les compteurs d'un EmployeeRecord. Met aussi un plancher à 0.
function deltaForEmployee(
  leave: Pick<DbLeave, 'type' | 'nbJoursOuvres'>,
  sign: 1 | -1,
): Prisma.EmployeeRecordUpdateInput {
  const j = Number(leave.nbJoursOuvres) * sign
  switch (leave.type as LeaveType) {
    case 'Congés annuels':
      return { congesAnnuelsPris: { increment: j } }
    case 'RTT':
      return { rttPris: { increment: j } }
    case 'Maladie':
      return { joursMaladie: { increment: j } }
    default:
      return {}
  }
}

interface PatchBody {
  action?: 'approve' | 'reject' | 'reopen'
  decisionMotif?: string
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  // Décisions de congés (approuver/refuser/rouvrir) : réservées aux valideurs RH.
  if (!ctx.can('hr.validate-leaves')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.leaveRequest.findUnique({ where: { id: params.id } })
      if (!current) throw new Error('not found')

      const data: Record<string, unknown> = {}

      if (body.action === 'approve') {
        data.statut = 'approuvee'
        data.decidedById = ctx.actor.id
        data.decidedAt = new Date()
        data.decisionMotif = null
        // Compteurs employé : crédite (sign +1)
        const delta = deltaForEmployee(current, 1)
        if (Object.keys(delta).length > 0) {
          await tx.employeeRecord.update({ where: { personId: current.personId }, data: delta })
        }
      } else if (body.action === 'reject') {
        if (!body.decisionMotif?.trim()) {
          throw new Error('motif required')
        }
        // Si on rejette un leave qui était Approuvé, on inverse les compteurs
        if (current.statut === 'approuvee') {
          const delta = deltaForEmployee(current, -1)
          if (Object.keys(delta).length > 0) {
            await tx.employeeRecord.update({ where: { personId: current.personId }, data: delta })
          }
        }
        data.statut = 'refusee'
        data.decidedById = ctx.actor.id
        data.decidedAt = new Date()
        data.decisionMotif = body.decisionMotif.trim()
      } else if (body.action === 'reopen') {
        // Si on rouvre un leave qui était Approuvé, on inverse les compteurs
        if (current.statut === 'approuvee') {
          const delta = deltaForEmployee(current, -1)
          if (Object.keys(delta).length > 0) {
            await tx.employeeRecord.update({ where: { personId: current.personId }, data: delta })
          }
        }
        data.statut = 'en_attente'
        data.decidedById = null
        data.decidedAt = null
        data.decisionMotif = null
      }

      return tx.leaveRequest.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    if (body.action) {
      const labels: Record<string, string> = { approve: 'Approbation', reject: 'Refus', reopen: 'Réouverture' }
      const requester = await db.person.findUnique({ where: { id: result.personId } })
      await logAudit(ctx, {
        action: `leave.${body.action}`, entity: 'leave', entityId: params.id,
        summary: `${labels[body.action] ?? body.action} d'un congé — ${requester?.fullName ?? result.personId}`,
      })
    }
    return NextResponse.json(leaveFromDb(result))
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'motif required') {
      return NextResponse.json({ error: 'Motif de refus requis.' }, { status: 400 })
    }
    console.error('[api/leaves PATCH]', e)
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('hr.validate-leaves')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.$transaction(async (tx) => {
      const current = await tx.leaveRequest.findUnique({ where: { id: params.id } })
      if (!current) throw new Error('not found')
      // Si on supprime un leave Approuvé, on rend les jours
      if (current.statut === 'approuvee') {
        const delta = deltaForEmployee(current, -1)
        if (Object.keys(delta).length > 0) {
          await tx.employeeRecord.update({ where: { personId: current.personId }, data: delta })
        }
      }
      await tx.leaveRequest.delete({ where: { id: params.id } })
    })
    await logAudit(ctx, { action: 'leave.delete', entity: 'leave', entityId: params.id, summary: 'Suppression d\'une demande de congé' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
  }
}

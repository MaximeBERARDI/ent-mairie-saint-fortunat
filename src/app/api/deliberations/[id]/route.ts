// PATCH  /api/deliberations/[id]  → update (permission commissions.manage)
// DELETE /api/deliberations/[id]  → delete (permission commissions.manage)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { deliberationFromDb, deliberationStatutToDb } from '@/lib/deliberation-mapper'
import type { DeliberationStatut } from '@/lib/types'

interface PatchBody {
  numero?: string
  objet?: string
  date?: string
  statut?: DeliberationStatut
  votePour?: number
  voteContre?: number
  voteAbstention?: number
  commissionId?: string | null
  notes?: string | null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('commissions.manage')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.numero !== undefined) data.numero = body.numero.trim()
  if (body.objet !== undefined) data.objet = body.objet.trim()
  if (body.date !== undefined) data.date = new Date(body.date)
  if (body.statut !== undefined) data.statut = deliberationStatutToDb(body.statut)
  if (body.votePour !== undefined) data.votePour = body.votePour
  if (body.voteContre !== undefined) data.voteContre = body.voteContre
  if (body.voteAbstention !== undefined) data.voteAbstention = body.voteAbstention
  if (body.commissionId !== undefined) data.commissionId = body.commissionId
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.deliberation.update({ where: { id: params.id }, data })
    return NextResponse.json(deliberationFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Délibération introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('commissions.manage')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.deliberation.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Délibération introuvable.' }, { status: 404 })
  }
}

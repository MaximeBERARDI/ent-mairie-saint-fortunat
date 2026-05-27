// PATCH  /api/meetings/[id]  → édition (permission commissions.manage)
// DELETE /api/meetings/[id]  → suppression (permission commissions.manage)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { meetingFromDb } from '@/lib/meeting-mapper'
import type { AgendaItem } from '@/lib/types'

interface PatchBody {
  date?: string
  heure?: string | null
  lieu?: string | null
  titre?: string | null
  notes?: string | null
  agenda?: AgendaItem[]
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
  if (body.date !== undefined) data.date = new Date(body.date)
  if (body.heure !== undefined) data.heure = body.heure?.trim() || null
  if (body.lieu !== undefined) data.lieu = body.lieu?.trim() || null
  if (body.titre !== undefined) data.titre = body.titre?.trim() || null
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.agenda !== undefined) data.agenda = body.agenda as object[]

  try {
    const updated = await db.meeting.update({ where: { id: params.id }, data })
    return NextResponse.json(meetingFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('commissions.manage')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.meeting.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable.' }, { status: 404 })
  }
}

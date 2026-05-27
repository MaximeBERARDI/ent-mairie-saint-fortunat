// GET  /api/meetings?commissionId=...  → liste (filtrée par commission si fourni)
// POST /api/meetings                    → create (permission commissions.manage)

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { meetingFromDb } from '@/lib/meeting-mapper'
import type { AgendaItem } from '@/lib/types'

interface PostBody {
  commissionId?: string
  date?: string
  heure?: string | null
  lieu?: string | null
  titre?: string | null
  notes?: string | null
  agenda?: AgendaItem[]
}

export async function GET(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const commissionId = new URL(req.url).searchParams.get('commissionId') ?? undefined
  const rows = await db.meeting.findMany({
    where: commissionId ? { commissionId } : undefined,
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(rows.map(meetingFromDb))
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('commissions.manage')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PostBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.commissionId || !body.date) {
    return NextResponse.json({ error: 'Commission et date sont requises.' }, { status: 400 })
  }

  const created = await db.meeting.create({
    data: {
      commissionId: body.commissionId,
      date: new Date(body.date),
      heure: body.heure?.trim() || null,
      lieu: body.lieu?.trim() || null,
      titre: body.titre?.trim() || null,
      notes: body.notes?.trim() || null,
      agenda: (body.agenda ?? []) as unknown as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json(meetingFromDb(created))
}

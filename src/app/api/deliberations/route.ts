// GET  /api/deliberations?commissionId=... → liste (filtrée si fourni)
// POST /api/deliberations                   → create (permission commissions.manage)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { deliberationFromDb, deliberationStatutToDb } from '@/lib/deliberation-mapper'
import type { DeliberationStatut } from '@/lib/types'

interface PostBody {
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

export async function GET(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const commissionId = new URL(req.url).searchParams.get('commissionId') ?? undefined
  const rows = await db.deliberation.findMany({
    where: commissionId ? { commissionId } : undefined,
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(rows.map(deliberationFromDb))
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

  if (!body.numero?.trim() || !body.objet?.trim() || !body.date) {
    return NextResponse.json({ error: 'Numéro, objet et date sont requis.' }, { status: 400 })
  }

  const created = await db.deliberation.create({
    data: {
      numero: body.numero.trim(),
      objet: body.objet.trim(),
      date: new Date(body.date),
      statut: deliberationStatutToDb(body.statut ?? 'À venir'),
      votePour: body.votePour ?? 0,
      voteContre: body.voteContre ?? 0,
      voteAbstention: body.voteAbstention ?? 0,
      commissionId: body.commissionId ?? null,
      notes: body.notes?.trim() || null,
    },
  })
  return NextResponse.json(deliberationFromDb(created))
}

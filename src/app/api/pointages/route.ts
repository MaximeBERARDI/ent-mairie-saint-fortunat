// GET  /api/pointages  → liste
// POST /api/pointages  → création (badger ou saisie manuelle)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pointageTypeToDb, pointageFromDb } from '@/lib/rh-mapper'
import type { PointageType } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.pointage.findMany({ orderBy: { timestamp: 'desc' } })
  return NextResponse.json(rows.map(pointageFromDb))
}

interface CreateBody {
  personId?: string
  type?: PointageType
  timestamp?: string
  manuel?: boolean
  motif?: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.personId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.personId || !body.type || !body.timestamp) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const manuel = body.manuel ?? false
  const created = await db.pointage.create({
    data: {
      personId: body.personId,
      type: pointageTypeToDb(body.type),
      timestamp: new Date(body.timestamp),
      manuel,
      motif: body.motif?.trim() || null,
      validationStatut: manuel ? 'en_attente' : null,
      createdById: session.user.personId,
    },
  })
  return NextResponse.json(pointageFromDb(created))
}

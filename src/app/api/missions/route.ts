// GET  /api/missions  → liste
// POST /api/missions  → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { missionFromDb } from '@/lib/rh-mapper'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.mission.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { dateDebut: 'desc' },
  })
  return NextResponse.json(rows.map(missionFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface CreateBody {
  personId?: string
  label?: string
  description?: string
  dateDebut?: string
  dateFin?: string | null
  lieu?: string
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.personId || !body.label?.trim() || !body.dateDebut) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.mission.create({
    data: {
      personId: body.personId,
      label: body.label.trim(),
      description: body.description?.trim() || null,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      lieu: body.lieu?.trim() || null,
      documents: body.documents && body.documents.length > 0
        ? { create: body.documents.map((d) => ({ name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })) }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(missionFromDb(created))
}

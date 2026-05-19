// GET  /api/leaves  → liste (avec documents)
// POST /api/leaves  → submit (statut "en_attente")

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { leaveFromDb } from '@/lib/rh-mapper'
import type { LeaveType } from '@/lib/types'

function countOuvres(dateDebut: string, dateFin: string): number {
  const start = new Date(dateDebut + 'T00:00:00')
  const end = new Date(dateFin + 'T00:00:00')
  if (end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.leaveRequest.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows.map(leaveFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface SubmitBody {
  personId?: string
  type?: LeaveType
  dateDebut?: string
  dateFin?: string
  motif?: string
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: SubmitBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.personId || !body.type || !body.dateDebut || !body.dateFin) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.leaveRequest.create({
    data: {
      personId: body.personId,
      type: body.type,
      dateDebut: new Date(body.dateDebut),
      dateFin: new Date(body.dateFin),
      nbJoursOuvres: countOuvres(body.dateDebut, body.dateFin),
      motif: body.motif?.trim() || null,
      statut: 'en_attente',
      submittedAt: new Date(),
      documents: body.documents && body.documents.length > 0
        ? {
            create: body.documents.map((d) => ({
              name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl,
            })),
          }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(leaveFromDb(created))
}

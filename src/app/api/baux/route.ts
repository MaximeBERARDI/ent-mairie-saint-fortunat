// GET  /api/baux  → liste (avec documents)
// POST /api/baux  → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bailFromDb, bailStatutToDb } from '@/lib/immo-mapper'
import type { StatutBail } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.bail.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { dateDebut: 'desc' },
  })
  return NextResponse.json(rows.map(bailFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface CreateBody {
  bienId?: string
  locataireId?: string
  dateDebut?: string
  dateFin?: string | null
  loyerMensuel?: number
  chargesMensuelles?: number
  depotGarantie?: number
  statut?: StatutBail
  notes?: string
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.bienId || !body.locataireId || !body.dateDebut || !body.statut ||
      body.loyerMensuel === undefined || body.chargesMensuelles === undefined || body.depotGarantie === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.bail.create({
    data: {
      bienId: body.bienId,
      locataireId: body.locataireId,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      loyerMensuel: body.loyerMensuel,
      chargesMensuelles: body.chargesMensuelles,
      depotGarantie: body.depotGarantie,
      statut: bailStatutToDb(body.statut),
      notes: body.notes?.trim() || null,
      documents: body.documents && body.documents.length > 0
        ? { create: body.documents.map((d) => ({ name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })) }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(bailFromDb(created))
}

// GET  /api/biens  → liste
// POST /api/biens  → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bienFromDb } from '@/lib/immo-mapper'
import type { TypeBien } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.bienImmobilier.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { reference: 'asc' },
  })
  return NextResponse.json(rows.map(bienFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface CreateBody {
  reference?: string
  nom?: string
  type?: TypeBien
  adresse?: string
  surface?: number
  pieces?: number
  loyerMensuel?: number
  chargesMensuelles?: number
  notes?: string
  active?: boolean
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.reference || !body.nom || !body.type || !body.adresse ||
      body.surface === undefined || body.loyerMensuel === undefined || body.chargesMensuelles === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.bienImmobilier.create({
    data: {
      reference: body.reference.trim(),
      nom: body.nom.trim(),
      type: body.type,
      adresse: body.adresse.trim(),
      surface: body.surface,
      pieces: body.pieces ?? null,
      loyerMensuel: body.loyerMensuel,
      chargesMensuelles: body.chargesMensuelles,
      notes: body.notes?.trim() || null,
      active: body.active ?? true,
      documents: body.documents && body.documents.length > 0
        ? { create: body.documents.map((d) => ({ name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })) }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(bienFromDb(created))
}

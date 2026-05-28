// GET  /api/quittances  → liste
// POST /api/quittances  → create (numéro auto Q-YYYY-MM-NNN)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quittanceFromDb, quittStatutToDb } from '@/lib/immo-mapper'
import type { ModeReglement, StatutQuittance } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.quittance.findMany({ orderBy: [{ mois: 'desc' }, { numero: 'desc' }] })
  return NextResponse.json(rows.map(quittanceFromDb))
}

async function nextNumero(mois: string): Promise<string> {
  const prefix = `Q-${mois}-`
  const existing = await db.quittance.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
  })
  const max = existing
    .map((q) => parseInt(q.numero.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

interface CreateBody {
  bailId?: string
  mois?: string
  loyerHC?: number
  charges?: number
  chargesOrdures?: number
  chargesGaz?: number
  chargesAutres?: number
  total?: number
  statut?: StatutQuittance
  emiseAt?: string
  payeeAt?: string
  modeReglement?: ModeReglement
  notes?: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.bailId || !body.mois || body.loyerHC === undefined || body.charges === undefined ||
      body.total === undefined || !body.statut) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const numero = await nextNumero(body.mois)
  const created = await db.quittance.create({
    data: {
      bailId: body.bailId,
      mois: body.mois,
      numero,
      loyerHC: body.loyerHC,
      charges: body.charges,
      chargesOrdures: body.chargesOrdures ?? 0,
      chargesGaz: body.chargesGaz ?? 0,
      chargesAutres: body.chargesAutres ?? body.charges,
      total: body.total,
      statut: quittStatutToDb(body.statut),
      emiseAt: body.emiseAt ? new Date(body.emiseAt) : null,
      payeeAt: body.payeeAt ? new Date(body.payeeAt) : null,
      modeReglement: body.modeReglement ?? null,
      notes: body.notes?.trim() || null,
    },
  })
  return NextResponse.json(quittanceFromDb(created))
}

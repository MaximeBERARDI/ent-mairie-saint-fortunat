// PATCH  /api/quittances/[id]  → update / action (payee/impayee/relancee)
// DELETE /api/quittances/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quittanceFromDb, quittStatutToDb } from '@/lib/immo-mapper'
import type { ModeReglement, StatutQuittance } from '@/lib/types'

interface PatchBody {
  action?: 'markPayee' | 'markImpayee' | 'markRelancee'
  modeReglement?: ModeReglement
  // Édition générale
  loyerHC?: number
  charges?: number
  chargesOrdures?: number
  chargesGaz?: number
  chargesAutres?: number
  total?: number
  statut?: StatutQuittance
  emiseAt?: string
  payeeAt?: string | null
  notes?: string | null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}

  // Workflow
  if (body.action === 'markPayee') {
    data.statut = 'payee'
    data.payeeAt = new Date()
    data.modeReglement = body.modeReglement ?? null
  } else if (body.action === 'markImpayee') {
    data.statut = 'impayee'
    data.payeeAt = null
    data.modeReglement = null
  } else if (body.action === 'markRelancee') {
    data.statut = 'relancee'
  }

  // Édition générale
  if (body.loyerHC !== undefined) data.loyerHC = body.loyerHC
  if (body.charges !== undefined) data.charges = body.charges
  if (body.chargesOrdures !== undefined) data.chargesOrdures = body.chargesOrdures
  if (body.chargesGaz !== undefined) data.chargesGaz = body.chargesGaz
  if (body.chargesAutres !== undefined) data.chargesAutres = body.chargesAutres
  if (body.total !== undefined) data.total = body.total
  if (body.statut !== undefined && body.action === undefined) data.statut = quittStatutToDb(body.statut)
  if (body.emiseAt !== undefined) data.emiseAt = body.emiseAt ? new Date(body.emiseAt) : null
  if (body.payeeAt !== undefined && body.action === undefined) {
    data.payeeAt = body.payeeAt ? new Date(body.payeeAt) : null
  }
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.quittance.update({ where: { id: params.id }, data })
    return NextResponse.json(quittanceFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Quittance introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.quittance.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Quittance introuvable.' }, { status: 404 })
  }
}

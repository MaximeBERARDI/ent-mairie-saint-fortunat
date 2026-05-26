// PATCH  /api/budget/[code]  → édite un poste (montants, libellé…).
// DELETE /api/budget/[code]  → supprime un poste.
// Permission finance.manage-budget.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { Section, Sens } from '@/lib/types'

interface PatchBody {
  label?: string
  chapitreCode?: string
  section?: Section
  sens?: Sens
  budgetAlloue?: number
  consommationInitiale?: number
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.label !== undefined) data.label = body.label
  if (body.chapitreCode !== undefined) data.chapitreCode = body.chapitreCode
  if (body.section !== undefined) data.section = body.section
  if (body.sens !== undefined) data.sens = body.sens
  if (body.budgetAlloue !== undefined) data.budgetAlloue = body.budgetAlloue
  if (body.consommationInitiale !== undefined) data.consommationInitiale = body.consommationInitiale

  try {
    await db.compteM14.update({ where: { code: params.code }, data })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Poste introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { code: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.compteM14.delete({ where: { code: params.code } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Poste introuvable.' }, { status: 404 })
  }
}

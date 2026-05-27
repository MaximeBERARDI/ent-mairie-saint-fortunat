// PATCH  /api/scenarios/[id]  → update (permission finance.manage-budget)
// DELETE /api/scenarios/[id]  → delete (permission finance.manage-budget)

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { scenarioFromDb } from '@/lib/scenario-mapper'
import type { ScenarioParams } from '@/lib/types'

interface PatchBody {
  nom?: string
  description?: string | null
  horizon?: number
  croissance?: number
  params?: ScenarioParams
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
  if (body.nom !== undefined) data.nom = body.nom.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.horizon !== undefined) data.horizon = body.horizon
  if (body.croissance !== undefined) data.croissance = body.croissance
  if (body.params !== undefined) data.params = body.params as Prisma.InputJsonValue

  try {
    const updated = await db.scenario.update({ where: { id: params.id }, data })
    return NextResponse.json(scenarioFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Scénario introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.scenario.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Scénario introuvable.' }, { status: 404 })
  }
}

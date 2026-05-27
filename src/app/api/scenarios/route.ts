// GET  /api/scenarios  → liste (permission finance.view-all)
// POST /api/scenarios  → create (permission finance.manage-budget)

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { scenarioFromDb } from '@/lib/scenario-mapper'
import type { ScenarioParams } from '@/lib/types'

interface PostBody {
  nom?: string
  description?: string | null
  horizon?: number
  croissance?: number
  params?: ScenarioParams
}

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const rows = await db.scenario.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(rows.map(scenarioFromDb))
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PostBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.nom?.trim()) {
    return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
  }

  const created = await db.scenario.create({
    data: {
      nom: body.nom.trim(),
      description: body.description?.trim() || null,
      horizon: body.horizon ?? 5,
      croissance: body.croissance ?? 1.5,
      params: (body.params ?? {}) as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json(scenarioFromDb(created))
}

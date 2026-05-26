// GET  /api/budget  → plan comptable M14 (postes, triés par code)
// POST /api/budget  → créer un poste. Permission finance.manage-budget.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { CompteM14, Section, Sens } from '@/lib/types'

type DbRow = NonNullable<Awaited<ReturnType<typeof db.compteM14.findFirst>>>

function compteFromDb(r: DbRow): CompteM14 {
  return {
    code: r.code,
    label: r.label,
    chapitreCode: r.chapitreCode,
    section: r.section as Section,
    sens: r.sens as Sens,
    budgetAlloue: Number(r.budgetAlloue),
    consommationInitiale: Number(r.consommationInitiale),
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.compteM14.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json(rows.map(compteFromDb))
}

interface CreateBody {
  code?: string
  label?: string
  chapitreCode?: string
  section?: Section
  sens?: Sens
  budgetAlloue?: number
  consommationInitiale?: number
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.code || !body.label || !body.chapitreCode || !body.section || !body.sens) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  try {
    const created = await db.compteM14.create({
      data: {
        code: body.code,
        label: body.label,
        chapitreCode: body.chapitreCode,
        section: body.section,
        sens: body.sens,
        budgetAlloue: body.budgetAlloue ?? 0,
        consommationInitiale: body.consommationInitiale ?? 0,
      },
    })
    return NextResponse.json(compteFromDb(created))
  } catch {
    return NextResponse.json({ error: 'Code déjà existant ?' }, { status: 409 })
  }
}

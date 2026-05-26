// GET  /api/historique  → liste des exercices (triés par année)
// POST /api/historique  → upsert (clé : exercice). Accepte un objet ou un
//                         tableau (import en masse). Permission finance.manage-budget.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { ExerciceHistorique } from '@/lib/types'

type DbRow = Awaited<ReturnType<typeof db.exerciceHistorique.findFirst>>

export function historiqueFromDb(r: NonNullable<DbRow>): ExerciceHistorique {
  return {
    id: r.id,
    exercice: r.exercice,
    population: r.population,
    rrf: Number(r.rrf),
    drf: Number(r.drf),
    charges011: Number(r.charges011),
    charges012: Number(r.charges012),
    charges65: Number(r.charges65),
    charges66: Number(r.charges66),
    produits73: Number(r.produits73),
    produits74: Number(r.produits74),
    produits7411: Number(r.produits7411),
    produits7311: Number(r.produits7311),
    depEquipement: Number(r.depEquipement),
    recettesInvest: Number(r.recettesInvest),
    encoursDette: Number(r.encoursDette),
    capitalRembourse: Number(r.capitalRembourse),
    notes: r.notes ?? undefined,
    importedAt: r.importedAt.toISOString(),
  }
}

type Input = Omit<ExerciceHistorique, 'id' | 'importedAt'>

function toData(e: Input) {
  return {
    exercice: e.exercice,
    population: e.population,
    rrf: e.rrf, drf: e.drf,
    charges011: e.charges011, charges012: e.charges012,
    charges65: e.charges65, charges66: e.charges66,
    produits73: e.produits73, produits74: e.produits74,
    produits7411: e.produits7411, produits7311: e.produits7311,
    depEquipement: e.depEquipement, recettesInvest: e.recettesInvest,
    encoursDette: e.encoursDette, capitalRembourse: e.capitalRembourse,
    notes: e.notes ?? null,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.exerciceHistorique.findMany({ orderBy: { exercice: 'asc' } })
  return NextResponse.json(rows.map(historiqueFromDb))
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: Input | Input[]
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const inputs = Array.isArray(body) ? body : [body]
  if (inputs.some(e => typeof e.exercice !== 'number')) {
    return NextResponse.json({ error: 'Champ exercice (année) requis.' }, { status: 400 })
  }

  const saved = await Promise.all(
    inputs.map(e =>
      db.exerciceHistorique.upsert({
        where: { exercice: e.exercice },
        create: toData(e),
        update: { ...toData(e), importedAt: new Date() },
      }),
    ),
  )
  return NextResponse.json(saved.map(historiqueFromDb))
}

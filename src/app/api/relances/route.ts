// GET  /api/relances           → liste de toutes les relances (le client filtre)
// POST /api/relances           → crée une relance pour une quittance
//
// Permissions :
//  - GET  : finance.view-all
//  - POST : parc.manage-relances

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { CanalRelance, ResultatRelance, Relance } from '@/lib/types'

function relanceFromDb(r: {
  id: string
  quittanceId: string
  date: Date
  canal: string
  contenu: string | null
  resultat: string | null
  createdById: string
  createdAt: Date
}): Relance {
  return {
    id: r.id,
    quittanceId: r.quittanceId,
    date: r.date.toISOString().slice(0, 10),
    canal: r.canal as CanalRelance,
    contenu: r.contenu ?? undefined,
    resultat: (r.resultat ?? undefined) as ResultatRelance | undefined,
    createdById: r.createdById,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }
  const rows = await db.relance.findMany({ orderBy: [{ date: 'desc' }] })
  return NextResponse.json(rows.map(relanceFromDb))
}

interface CreateBody {
  quittanceId?: string
  date?: string
  canal?: CanalRelance
  contenu?: string
  resultat?: ResultatRelance
}

const VALID_CANAL: CanalRelance[] = ['Courrier', 'Email', 'SMS', 'Téléphone', 'En personne', 'Autre']
const VALID_RESULTAT: ResultatRelance[] = ['Sans réponse', 'Engagement de paiement', 'Payée', 'Refus', 'Autre']

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('parc.manage-relances')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.quittanceId || !body.date || !body.canal) {
    return NextResponse.json({ error: 'Champs requis : quittanceId, date, canal.' }, { status: 400 })
  }
  if (!VALID_CANAL.includes(body.canal)) {
    return NextResponse.json({ error: 'Canal de relance invalide.' }, { status: 400 })
  }
  if (body.resultat && !VALID_RESULTAT.includes(body.resultat)) {
    return NextResponse.json({ error: 'Résultat de relance invalide.' }, { status: 400 })
  }

  const quittance = await db.quittance.findUnique({ where: { id: body.quittanceId }, select: { id: true } })
  if (!quittance) return NextResponse.json({ error: 'Quittance introuvable.' }, { status: 404 })

  const created = await db.relance.create({
    data: {
      quittanceId: body.quittanceId,
      date: new Date(body.date),
      canal: body.canal,
      contenu: body.contenu?.trim() || null,
      resultat: body.resultat ?? null,
      createdById: ctx.actor.id,
    },
  })
  return NextResponse.json(relanceFromDb(created))
}

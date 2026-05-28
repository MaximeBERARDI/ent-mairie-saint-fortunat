// PATCH  /api/relances/[id]   → mise à jour (résultat saisi a posteriori, etc.)
// DELETE /api/relances/[id]   → suppression
//
// Permission : parc.manage-relances

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { CanalRelance, ResultatRelance, Relance } from '@/lib/types'

function relanceFromDb(r: {
  id: string; quittanceId: string; date: Date; canal: string
  contenu: string | null; resultat: string | null; createdById: string; createdAt: Date
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

interface PatchBody {
  date?: string
  canal?: CanalRelance
  contenu?: string | null
  resultat?: ResultatRelance | null
}

const VALID_CANAL: CanalRelance[] = ['Courrier', 'Email', 'SMS', 'Téléphone', 'En personne', 'Autre']
const VALID_RESULTAT: ResultatRelance[] = ['Sans réponse', 'Engagement de paiement', 'Payée', 'Refus', 'Autre']

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('parc.manage-relances')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.date !== undefined) data.date = new Date(body.date)
  if (body.canal !== undefined) {
    if (!VALID_CANAL.includes(body.canal)) return NextResponse.json({ error: 'Canal invalide.' }, { status: 400 })
    data.canal = body.canal
  }
  if (body.contenu !== undefined) data.contenu = body.contenu?.trim() || null
  if (body.resultat !== undefined) {
    if (body.resultat !== null && !VALID_RESULTAT.includes(body.resultat)) {
      return NextResponse.json({ error: 'Résultat invalide.' }, { status: 400 })
    }
    data.resultat = body.resultat ?? null
  }

  try {
    const updated = await db.relance.update({ where: { id: params.id }, data })
    return NextResponse.json(relanceFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Relance introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('parc.manage-relances')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }
  try {
    await db.relance.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Relance introuvable.' }, { status: 404 })
  }
}

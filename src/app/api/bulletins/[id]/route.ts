// PATCH  /api/bulletins/[id]  → update statut
// DELETE /api/bulletins/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bulletinFromDb } from '@/lib/bulletin-mapper'
import type { BulletinStatut } from '@/lib/types'

interface PatchBody {
  statut?: BulletinStatut
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.statut) {
    return NextResponse.json({ error: 'Statut requis.' }, { status: 400 })
  }

  try {
    const updated = await db.bulletinPaie.update({
      where: { id: params.id },
      data: { statut: body.statut },
    })
    return NextResponse.json(bulletinFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.bulletinPaie.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }
}

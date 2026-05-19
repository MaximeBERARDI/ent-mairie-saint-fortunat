// PATCH  /api/pointages/[id]  → action: validate / refuse
// DELETE /api/pointages/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pointageFromDb } from '@/lib/rh-mapper'

interface PatchBody {
  action?: 'validate' | 'refuse'
  validationMotif?: string
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.personId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.action === 'validate') {
    data.validationStatut = 'approuvee'
    data.validateurId = session.user.personId
    data.validatedAt = new Date()
    data.validationMotif = null
  } else if (body.action === 'refuse') {
    if (!body.validationMotif?.trim()) {
      return NextResponse.json({ error: 'Motif de refus requis.' }, { status: 400 })
    }
    data.validationStatut = 'refusee'
    data.validateurId = session.user.personId
    data.validatedAt = new Date()
    data.validationMotif = body.validationMotif.trim()
  } else {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
  }

  try {
    const updated = await db.pointage.update({ where: { id: params.id }, data })
    return NextResponse.json(pointageFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Pointage introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.pointage.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Pointage introuvable.' }, { status: 404 })
  }
}

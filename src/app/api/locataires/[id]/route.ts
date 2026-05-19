// PATCH  /api/locataires/[id]
// DELETE /api/locataires/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { locataireFromDb } from '@/lib/immo-mapper'

interface PatchBody {
  prenom?: string
  nom?: string
  email?: string | null
  phone?: string | null
  adresseFacturation?: string | null
  notes?: string | null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  // Recharger pour calculer fullName si prenom ou nom change
  const current = await db.locataire.findUnique({ where: { id: params.id } })
  if (!current) return NextResponse.json({ error: 'Locataire introuvable.' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.prenom !== undefined) data.prenom = body.prenom.trim()
  if (body.nom !== undefined) data.nom = body.nom.trim()
  if (body.prenom !== undefined || body.nom !== undefined) {
    const prenom = body.prenom?.trim() ?? current.prenom
    const nom = body.nom?.trim() ?? current.nom
    data.fullName = `${prenom} ${nom}`
  }
  if (body.email !== undefined) data.email = body.email?.trim() || null
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null
  if (body.adresseFacturation !== undefined) data.adresseFacturation = body.adresseFacturation?.trim() || null
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  const updated = await db.locataire.update({ where: { id: params.id }, data })
  return NextResponse.json(locataireFromDb(updated))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.locataire.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Locataire introuvable ou utilisé.' }, { status: 400 })
  }
}

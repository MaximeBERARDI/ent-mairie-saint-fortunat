// PATCH  /api/fournisseurs/[id]  → update
// DELETE /api/fournisseurs/[id]  → delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Fournisseur as DbFournisseur } from '@prisma/client'

function toApi(f: DbFournisseur) {
  return {
    id: f.id,
    nom: f.nom,
    categorie: f.categorie,
    siret: f.siret ?? undefined,
    email: f.email ?? undefined,
    phone: f.phone ?? undefined,
    numClient: f.numClient ?? undefined,
    posteParDefaut: f.posteParDefaut ?? undefined,
    delaiPaiement: f.delaiPaiement ?? undefined,
    active: f.active,
    createdAt: f.createdAt.toISOString(),
  }
}

interface PatchBody {
  nom?: string
  categorie?: string
  siret?: string | null
  email?: string | null
  phone?: string | null
  numClient?: string | null
  posteParDefaut?: string | null
  delaiPaiement?: number | null
  active?: boolean
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

  const data: Record<string, unknown> = {}
  if (body.nom !== undefined) data.nom = body.nom.trim()
  if (body.categorie !== undefined) data.categorie = body.categorie.trim()
  if (body.siret !== undefined) data.siret = body.siret?.trim() || null
  if (body.email !== undefined) data.email = body.email?.trim() || null
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null
  if (body.numClient !== undefined) data.numClient = body.numClient?.trim() || null
  if (body.posteParDefaut !== undefined) data.posteParDefaut = body.posteParDefaut?.trim() || null
  if (body.delaiPaiement !== undefined) data.delaiPaiement = body.delaiPaiement
  if (body.active !== undefined) data.active = body.active

  try {
    const updated = await db.fournisseur.update({ where: { id: params.id }, data })
    return NextResponse.json(toApi(updated))
  } catch {
    return NextResponse.json({ error: 'Fournisseur introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.fournisseur.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Fournisseur introuvable ou utilisé.' }, { status: 400 })
  }
}

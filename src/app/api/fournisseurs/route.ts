// GET  /api/fournisseurs  → liste
// POST /api/fournisseurs  → create

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

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.fournisseur.findMany({ orderBy: { nom: 'asc' } })
  return NextResponse.json(rows.map(toApi))
}

interface CreateBody {
  nom?: string
  categorie?: string
  siret?: string
  email?: string
  phone?: string
  numClient?: string
  posteParDefaut?: string
  delaiPaiement?: number
  active?: boolean
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.nom?.trim() || !body.categorie?.trim()) {
    return NextResponse.json({ error: 'Nom et catégorie requis.' }, { status: 400 })
  }

  const created = await db.fournisseur.create({
    data: {
      nom: body.nom.trim(),
      categorie: body.categorie.trim(),
      siret: body.siret?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      numClient: body.numClient?.trim() || null,
      posteParDefaut: body.posteParDefaut?.trim() || null,
      delaiPaiement: body.delaiPaiement ?? null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json(toApi(created))
}

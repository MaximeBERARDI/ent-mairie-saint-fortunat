// GET  /api/locataires  → liste
// POST /api/locataires  → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { locataireFromDb } from '@/lib/immo-mapper'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.locataire.findMany({ orderBy: { nom: 'asc' } })
  return NextResponse.json(rows.map(locataireFromDb))
}

interface CreateBody {
  prenom?: string
  nom?: string
  email?: string
  phone?: string
  adresseFacturation?: string
  notes?: string
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.prenom?.trim() || !body.nom?.trim()) {
    return NextResponse.json({ error: 'Prénom et nom requis.' }, { status: 400 })
  }

  const created = await db.locataire.create({
    data: {
      prenom: body.prenom.trim(),
      nom: body.nom.trim(),
      fullName: `${body.prenom.trim()} ${body.nom.trim()}`,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      adresseFacturation: body.adresseFacturation?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  })
  return NextResponse.json(locataireFromDb(created))
}

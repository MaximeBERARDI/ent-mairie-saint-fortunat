// GET  /api/projets  → liste (avec financements)
// POST /api/projets  → create (avec financements en cascade)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projetFromDb } from '@/lib/subvention-projet-mapper'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.projet.findMany({
    include: { financements: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows.map(projetFromDb))
}

interface FinancementInput {
  source: string
  organisme?: string
  montant: number
  dureeAnnees?: number
  tauxInteret?: number
  anneeVersement?: number
  certitude?: string
  subventionId?: string
}

interface CreateBody {
  nom?: string
  description?: string
  coutTotal?: number
  coutHT?: number
  imputationCompte?: string
  anneeDebut?: number
  anneesEtalement?: number
  tauxFCTVA?: number
  notes?: string
  financements?: FinancementInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.nom?.trim() || body.coutTotal === undefined || !body.imputationCompte ||
      body.anneeDebut === undefined || body.anneesEtalement === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.projet.create({
    data: {
      nom: body.nom.trim(),
      description: body.description?.trim() || null,
      coutTotal: body.coutTotal,
      coutHT: body.coutHT ?? null,
      imputationCompte: body.imputationCompte,
      anneeDebut: body.anneeDebut,
      anneesEtalement: body.anneesEtalement,
      tauxFCTVA: body.tauxFCTVA ?? null,
      notes: body.notes?.trim() || null,
      financements: body.financements && body.financements.length > 0
        ? {
            create: body.financements.map((f) => ({
              source: f.source,
              organisme: f.organisme || null,
              montant: f.montant,
              dureeAnnees: f.dureeAnnees ?? null,
              tauxInteret: f.tauxInteret ?? null,
              anneeVersement: f.anneeVersement ?? null,
              certitude: f.certitude || null,
              subventionId: f.subventionId || null,
            })),
          }
        : undefined,
    },
    include: { financements: true },
  })
  return NextResponse.json(projetFromDb(created))
}

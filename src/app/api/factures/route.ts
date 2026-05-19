// GET  /api/factures  → liste (avec documents)
// POST /api/factures  → submit (création en statut "en_attente_validation")

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { factureFromDb } from '@/lib/facture-mapper'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.facture.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows.map(factureFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface SubmitBody {
  fournisseurId?: string
  montantTTC?: number
  posteCode?: string
  dateFacture?: string
  dateEcheance?: string | null
  notes?: string
  documents?: DocumentInput[]
}

// Génère un numéro de facture incrémental "FAC-YYYY-NNN" basé sur le
// plus haut existant pour l'année courante (au sein d'une transaction
// pour éviter les collisions concurrentes).
async function nextNumero(year: number): Promise<string> {
  const prefix = `FAC-${year}-`
  const lastForYear = await db.facture.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
  })
  const max = lastForYear
    .map((f) => parseInt(f.numero.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.personId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: SubmitBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.fournisseurId || !body.posteCode || !body.dateFacture || body.montantTTC === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const numero = await nextNumero(new Date().getFullYear())
  const created = await db.facture.create({
    data: {
      numero,
      fournisseurId: body.fournisseurId,
      montantTTC: body.montantTTC,
      posteCode: body.posteCode,
      dateFacture: new Date(body.dateFacture),
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
      statut: 'en_attente_validation',
      submittedById: session.user.personId,
      submittedAt: new Date(),
      notes: body.notes?.trim() || null,
      documents: body.documents && body.documents.length > 0
        ? {
            create: body.documents.map((d) => ({
              name: d.name,
              size: d.size,
              type: d.type,
              dataUrl: d.dataUrl,
            })),
          }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(factureFromDb(created))
}

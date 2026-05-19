// GET  /api/subventions  → liste
// POST /api/subventions  → create (référence auto SUB-YYYY-NNN)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subventionFromDb } from '@/lib/subvention-projet-mapper'
import type { SourceSubvention, StatutSubvention } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const rows = await db.demandeSubvention.findMany({
    include: { documents: { orderBy: { uploadedAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows.map(subventionFromDb))
}

async function nextReference(year: number): Promise<string> {
  const prefix = `SUB-${year}-`
  const existing = await db.demandeSubvention.findMany({
    where: { reference: { startsWith: prefix } },
    select: { reference: true },
  })
  const max = existing
    .map((s) => parseInt(s.reference.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface CreateBody {
  intitule?: string
  description?: string
  source?: SourceSubvention
  organisme?: string
  contactNom?: string
  contactEmail?: string
  montantProjet?: number
  montantDemande?: number
  montantAccorde?: number
  montantVerse?: number
  dateDepot?: string
  dateDecision?: string
  datePrevisionVersement?: string
  statut?: StatutSubvention
  motifRefus?: string
  imputationCompte?: string
  notes?: string
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.intitule?.trim() || !body.source || !body.organisme?.trim() ||
      body.montantProjet === undefined || body.montantDemande === undefined || !body.statut) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const reference = await nextReference(new Date().getFullYear())
  const created = await db.demandeSubvention.create({
    data: {
      reference,
      intitule: body.intitule.trim(),
      description: body.description?.trim() || null,
      source: body.source,
      organisme: body.organisme.trim(),
      contactNom: body.contactNom?.trim() || null,
      contactEmail: body.contactEmail?.trim() || null,
      montantProjet: body.montantProjet,
      montantDemande: body.montantDemande,
      montantAccorde: body.montantAccorde ?? null,
      montantVerse: body.montantVerse ?? null,
      dateDepot: body.dateDepot ? new Date(body.dateDepot) : null,
      dateDecision: body.dateDecision ? new Date(body.dateDecision) : null,
      datePrevisionVersement: body.datePrevisionVersement ? new Date(body.datePrevisionVersement) : null,
      statut: body.statut,
      motifRefus: body.motifRefus?.trim() || null,
      imputationCompte: body.imputationCompte?.trim() || null,
      notes: body.notes?.trim() || null,
      documents: body.documents && body.documents.length > 0
        ? { create: body.documents.map((d) => ({ name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })) }
        : undefined,
    },
    include: { documents: true },
  })
  return NextResponse.json(subventionFromDb(created))
}

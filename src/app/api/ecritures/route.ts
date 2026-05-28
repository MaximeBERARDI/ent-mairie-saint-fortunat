// GET    /api/ecritures            → liste (avec lignes), récentes d'abord
// POST   /api/ecritures            → crée (équilibre vérifié, numéro auto par
//                                     exercice, dédup des écritures auto-générées)
// DELETE /api/ecritures?factureId= → suppression en masse par rattachement
//                                     (factureId | quittanceId | subventionId)
// Permission finance.view-all (utilisateurs des finances).

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { Prisma } from '@prisma/client'
import type { Ecriture, JournalCode } from '@/lib/types'

type DbRow = Prisma.EcritureGetPayload<{ include: { lignes: true } }>

function ecritureFromDb(r: DbRow): Ecriture {
  return {
    id: r.id,
    numero: r.numero,
    exercice: r.exercice,
    date: r.date.toISOString().slice(0, 10),
    journal: r.journal as JournalCode,
    libelle: r.libelle,
    pieceRef: r.pieceRef ?? undefined,
    factureId: r.factureId ?? undefined,
    quittanceId: r.quittanceId ?? undefined,
    subventionId: r.subventionId ?? undefined,
    lignes: r.lignes.map((l) => ({
      id: l.id,
      compteCode: l.compteCode,
      libelle: l.libelle ?? undefined,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdById,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.ecriture.findMany({
    include: { lignes: true },
    orderBy: [{ exercice: 'desc' }, { numero: 'desc' }],
  })
  return NextResponse.json(rows.map(ecritureFromDb))
}

interface LigneInput { compteCode: string; libelle?: string; debit: number; credit: number }
interface CreateBody {
  date?: string
  journal?: JournalCode
  libelle?: string
  pieceRef?: string
  factureId?: string
  quittanceId?: string
  subventionId?: string
  lignes?: LigneInput[]
  createdBy?: string
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const lignes = body.lignes ?? []
  if (!body.date || !body.journal || !body.libelle?.trim() || lignes.length === 0) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }
  // Équilibre débit / crédit (à 1 centime près)
  const totalD = lignes.reduce((acc, l) => acc + (l.debit || 0), 0)
  const totalC = lignes.reduce((acc, l) => acc + (l.credit || 0), 0)
  if (Math.abs(totalD - totalC) >= 0.01 || totalD <= 0) {
    return NextResponse.json({ error: 'Écriture non équilibrée.' }, { status: 400 })
  }

  // Dédup des écritures auto-générées (rattachement + journal identiques).
  const dedupWhere =
    body.factureId ? { factureId: body.factureId, journal: body.journal }
    : body.quittanceId ? { quittanceId: body.quittanceId, journal: body.journal }
    : body.subventionId ? { subventionId: body.subventionId, journal: body.journal }
    : null
  if (dedupWhere) {
    const existing = await db.ecriture.findFirst({ where: dedupWhere, include: { lignes: true } })
    if (existing) return NextResponse.json(ecritureFromDb(existing))
  }

  const exercice = new Date(body.date).getFullYear()
  const createdById = body.createdBy ?? ctx.actor.id

  const created = await db.$transaction(async (tx) => {
    const last = await tx.ecriture.findFirst({ where: { exercice }, orderBy: { numero: 'desc' } })
    const numero = (last?.numero ?? 0) + 1
    return tx.ecriture.create({
      data: {
        numero,
        exercice,
        date: new Date(body.date as string),
        journal: body.journal as string,
        libelle: body.libelle!.trim(),
        pieceRef: body.pieceRef ?? null,
        factureId: body.factureId ?? null,
        quittanceId: body.quittanceId ?? null,
        subventionId: body.subventionId ?? null,
        createdById,
        lignes: {
          create: lignes.map((l) => ({
            compteCode: l.compteCode,
            libelle: l.libelle ?? null,
            debit: l.debit || 0,
            credit: l.credit || 0,
          })),
        },
      },
      include: { lignes: true },
    })
  })
  return NextResponse.json(ecritureFromDb(created))
}

export async function DELETE(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const factureId = searchParams.get('factureId')
  const quittanceId = searchParams.get('quittanceId')
  const subventionId = searchParams.get('subventionId')
  const journal = searchParams.get('journal') ?? undefined
  const base = factureId ? { factureId }
    : quittanceId ? { quittanceId }
    : subventionId ? { subventionId }
    : null
  if (!base) return NextResponse.json({ error: 'Filtre de suppression requis.' }, { status: 400 })
  const where = journal ? { ...base, journal } : base

  const { count } = await db.ecriture.deleteMany({ where })
  return NextResponse.json({ ok: true, count })
}

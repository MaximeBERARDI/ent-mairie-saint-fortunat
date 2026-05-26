// GET  /api/comptes-rendus  → liste (récents d'abord)
// POST /api/comptes-rendus  → créer (uploadedBy = utilisateur courant). Permission cr.upload.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import type { CompteRendu } from '@/lib/types'

type DbRow = NonNullable<Awaited<ReturnType<typeof db.compteRendu.findFirst>>>

function compteRenduFromDb(r: DbRow): CompteRendu {
  return {
    id: r.id,
    filename: r.filename,
    commissionId: r.commissionId ?? undefined,
    meetingDate: r.meetingDate ? r.meetingDate.toISOString().slice(0, 10) : undefined,
    importedAt: r.importedAt.toISOString(),
    taskIds: r.taskIds,
    pdfDataUrl: r.pdfDataUrl ?? undefined,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.compteRendu.findMany({ orderBy: { importedAt: 'desc' } })
  return NextResponse.json(rows.map(compteRenduFromDb))
}

interface CreateBody {
  filename?: string
  commissionId?: string | null
  meetingDate?: string | null
  taskIds?: string[]
  pdfDataUrl?: string | null
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('cr.upload')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.filename?.trim()) {
    return NextResponse.json({ error: 'Nom de fichier requis.' }, { status: 400 })
  }

  const created = await db.compteRendu.create({
    data: {
      filename: body.filename.trim(),
      commissionId: body.commissionId ?? null,
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
      pdfDataUrl: body.pdfDataUrl ?? null,
      taskIds: body.taskIds ?? [],
      uploadedById: ctx.actor.id,
    },
  })
  return NextResponse.json(compteRenduFromDb(created))
}

// PATCH  /api/missions/[id]  → update
// DELETE /api/missions/[id]  → delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { missionFromDb } from '@/lib/rh-mapper'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  personId?: string
  label?: string
  description?: string | null
  dateDebut?: string
  dateFin?: string | null
  lieu?: string | null
  documents?: DocumentInput[]
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
  if (body.personId !== undefined) data.personId = body.personId
  if (body.label !== undefined) data.label = body.label.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.dateDebut !== undefined) data.dateDebut = new Date(body.dateDebut)
  if (body.dateFin !== undefined) data.dateFin = body.dateFin ? new Date(body.dateFin) : null
  if (body.lieu !== undefined) data.lieu = body.lieu?.trim() || null

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        const keptIds = body.documents.filter((d) => d.id && !d.id.startsWith('tmp-')).map((d) => d.id!)
        await tx.document.deleteMany({
          where: { missionId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter((d) => !d.id || d.id.startsWith('tmp-'))
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({
              missionId: params.id, name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl,
            })),
          })
        }
      }
      return tx.mission.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    return NextResponse.json(missionFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.mission.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 })
  }
}

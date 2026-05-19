// PATCH  /api/baux/[id]
// DELETE /api/baux/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bailFromDb, bailStatutToDb } from '@/lib/immo-mapper'
import type { StatutBail } from '@/lib/types'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  bienId?: string
  locataireId?: string
  dateDebut?: string
  dateFin?: string | null
  loyerMensuel?: number
  chargesMensuelles?: number
  depotGarantie?: number
  statut?: StatutBail
  notes?: string | null
  documents?: DocumentInput[]
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.bienId !== undefined) data.bienId = body.bienId
  if (body.locataireId !== undefined) data.locataireId = body.locataireId
  if (body.dateDebut !== undefined) data.dateDebut = new Date(body.dateDebut)
  if (body.dateFin !== undefined) data.dateFin = body.dateFin ? new Date(body.dateFin) : null
  if (body.loyerMensuel !== undefined) data.loyerMensuel = body.loyerMensuel
  if (body.chargesMensuelles !== undefined) data.chargesMensuelles = body.chargesMensuelles
  if (body.depotGarantie !== undefined) data.depotGarantie = body.depotGarantie
  if (body.statut !== undefined) data.statut = bailStatutToDb(body.statut)
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        const keptIds = body.documents.filter((d) => d.id && !d.id.startsWith('tmp-')).map((d) => d.id!)
        await tx.document.deleteMany({
          where: { bailId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter((d) => !d.id || d.id.startsWith('tmp-'))
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({ bailId: params.id, name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })),
          })
        }
      }
      return tx.bail.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    return NextResponse.json(bailFromDb(updated))
  } catch (e) {
    console.error('[api/baux PATCH]', e)
    return NextResponse.json({ error: 'Bail introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.bail.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bail introuvable ou utilisé.' }, { status: 400 })
  }
}

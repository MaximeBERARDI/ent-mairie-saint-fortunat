// PATCH  /api/biens/[id]  → update (+ remplacement documents si fourni)
// DELETE /api/biens/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bienFromDb } from '@/lib/immo-mapper'
import type { TypeBien } from '@/lib/types'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  reference?: string
  nom?: string
  type?: TypeBien
  adresse?: string
  surface?: number
  pieces?: number | null
  loyerMensuel?: number
  chargesMensuelles?: number
  notes?: string | null
  codeInsee?: string | null
  sectionCadastrale?: string | null
  numeroParcelle?: string | null
  active?: boolean
  documents?: DocumentInput[]
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.reference !== undefined) data.reference = body.reference.trim()
  if (body.nom !== undefined) data.nom = body.nom.trim()
  if (body.type !== undefined) data.type = body.type
  if (body.adresse !== undefined) data.adresse = body.adresse.trim()
  if (body.surface !== undefined) data.surface = body.surface
  if (body.pieces !== undefined) data.pieces = body.pieces
  if (body.loyerMensuel !== undefined) data.loyerMensuel = body.loyerMensuel
  if (body.chargesMensuelles !== undefined) data.chargesMensuelles = body.chargesMensuelles
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.codeInsee !== undefined) data.codeInsee = body.codeInsee?.trim() || null
  if (body.sectionCadastrale !== undefined) data.sectionCadastrale = body.sectionCadastrale?.trim() || null
  if (body.numeroParcelle !== undefined) data.numeroParcelle = body.numeroParcelle?.trim() || null
  if (body.active !== undefined) data.active = body.active

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        const keptIds = body.documents.filter((d) => d.id && !d.id.startsWith('tmp-')).map((d) => d.id!)
        await tx.document.deleteMany({
          where: { bienId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter((d) => !d.id || d.id.startsWith('tmp-'))
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({ bienId: params.id, name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl })),
          })
        }
      }
      return tx.bienImmobilier.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    return NextResponse.json(bienFromDb(updated))
  } catch (e) {
    console.error('[api/biens PATCH]', e)
    return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.bienImmobilier.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bien introuvable ou utilisé.' }, { status: 400 })
  }
}

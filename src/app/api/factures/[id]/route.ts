// PATCH  /api/factures/[id]   → update (édition + actions validate/reject/reopen)
// DELETE /api/factures/[id]   → delete
//
// Le PATCH gère plusieurs cas selon les champs envoyés :
// - action: 'validate' / 'reject' / 'reopen' → workflow
// - sinon : édition de champs (sauf statut qui passe par action)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { factureFromDb } from '@/lib/facture-mapper'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  action?: 'validate' | 'reject' | 'reopen'
  rejectionReason?: string
  // Champs éditables
  fournisseurId?: string
  montantTTC?: number
  posteCode?: string
  dateFacture?: string
  dateEcheance?: string | null
  notes?: string | null
  documents?: DocumentInput[]
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.personId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  // Workflow d'action
  if (body.action === 'validate') {
    data.statut = 'validee'
    data.validatedById = session.user.personId
    data.validatedAt = new Date()
    data.rejectedById = null
    data.rejectedAt = null
    data.rejectionReason = null
  } else if (body.action === 'reject') {
    if (!body.rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Motif de rejet requis.' }, { status: 400 })
    }
    data.statut = 'rejetee'
    data.rejectedById = session.user.personId
    data.rejectedAt = new Date()
    data.rejectionReason = body.rejectionReason.trim()
    data.validatedById = null
    data.validatedAt = null
  } else if (body.action === 'reopen') {
    data.statut = 'en_attente_validation'
    data.validatedById = null
    data.validatedAt = null
    data.rejectedById = null
    data.rejectedAt = null
    data.rejectionReason = null
  }

  // Édition de champs (compatibles avec le workflow)
  if (body.fournisseurId !== undefined) data.fournisseurId = body.fournisseurId
  if (body.montantTTC !== undefined) data.montantTTC = body.montantTTC
  if (body.posteCode !== undefined) data.posteCode = body.posteCode
  if (body.dateFacture !== undefined) data.dateFacture = new Date(body.dateFacture)
  if (body.dateEcheance !== undefined) {
    data.dateEcheance = body.dateEcheance ? new Date(body.dateEcheance) : null
  }
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        const keptIds = body.documents
          .filter((d) => d.id && !d.id.startsWith('tmp-'))
          .map((d) => d.id!)
        await tx.document.deleteMany({
          where: { factureId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter((d) => !d.id || d.id.startsWith('tmp-'))
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({
              factureId: params.id,
              name: d.name,
              size: d.size,
              type: d.type,
              dataUrl: d.dataUrl,
            })),
          })
        }
      }
      return tx.facture.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    return NextResponse.json(factureFromDb(updated))
  } catch (e) {
    console.error('[api/factures PATCH]', e)
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.facture.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
  }
}

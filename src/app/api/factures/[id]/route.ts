// PATCH  /api/factures/[id]   → update (édition + actions validate/reject/reopen/pay/unpay)
// DELETE /api/factures/[id]   → delete
//
// Le PATCH gère plusieurs cas selon les champs envoyés :
// - action: 'validate' / 'reject' / 'reopen' → workflow de validation, réservé
//   aux personnes habilitées (permission finance.validate-invoices)
// - action: 'pay' / 'unpay' → mandatement (paiement), permission séparée
//   finance.pay-invoices, précondition de statut imposée serveur
// - sinon : édition de champs (sauf statut qui passe par action)
//
// Toute mutation recalcule le compte fournisseur persistant (totalEngage).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { factureFromDb } from '@/lib/facture-mapper'
import { recomputeFournisseurTotal } from '@/lib/fournisseur-total'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  action?: 'validate' | 'reject' | 'reopen' | 'pay' | 'unpay'
  rejectionReason?: string
  datePaiement?: string
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
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  // Permissions par action — la validation/rejet/réouverture exige
  // finance.validate-invoices ; le paiement (mandatement) exige la permission
  // séparée finance.pay-invoices.
  const validateActions = new Set(['validate', 'reject', 'reopen'])
  const payActions = new Set(['pay', 'unpay'])
  if (body.action && validateActions.has(body.action) && !ctx.can('finance.validate-invoices')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }
  if (body.action && payActions.has(body.action) && !ctx.can('finance.pay-invoices')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  // Préconditions de statut pour les actions de paiement (lecture nécessaire)
  let currentStatut: string | null = null
  if (body.action && payActions.has(body.action)) {
    const cur = await db.facture.findUnique({
      where: { id: params.id },
      select: { statut: true },
    })
    if (!cur) return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
    currentStatut = cur.statut
    if (body.action === 'pay' && currentStatut !== 'validee') {
      return NextResponse.json({ error: 'La facture doit être validée avant d\'être payée.' }, { status: 409 })
    }
    if (body.action === 'unpay' && currentStatut !== 'payee') {
      return NextResponse.json({ error: 'La facture n\'est pas marquée comme payée.' }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = {}

  // Workflow d'action
  if (body.action === 'validate') {
    data.statut = 'validee'
    data.validatedById = ctx.actor.id
    data.validatedAt = new Date()
    data.rejectedById = null
    data.rejectedAt = null
    data.rejectionReason = null
  } else if (body.action === 'reject') {
    if (!body.rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Motif de rejet requis.' }, { status: 400 })
    }
    data.statut = 'rejetee'
    data.rejectedById = ctx.actor.id
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
  } else if (body.action === 'pay') {
    data.statut = 'payee'
    data.paidById = ctx.actor.id
    data.paidAt = new Date()
    data.datePaiement = body.datePaiement ? new Date(body.datePaiement) : new Date()
  } else if (body.action === 'unpay') {
    data.statut = 'validee'
    data.paidById = null
    data.paidAt = null
    data.datePaiement = null
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

  const existing = await db.facture.findUnique({
    where: { id: params.id },
    select: { fournisseurId: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
  }

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
      const f = await tx.facture.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
      // Recalcule le compte de l'ancien et du nouveau fournisseur (si déplacement).
      const affected = existing.fournisseurId === f.fournisseurId
        ? [f.fournisseurId]
        : [existing.fournisseurId, f.fournisseurId]
      for (const fid of affected) await recomputeFournisseurTotal(tx, fid)
      return f
    })
    return NextResponse.json(factureFromDb(updated))
  } catch (e) {
    console.error('[api/factures PATCH]', e)
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.validate-invoices')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const existing = await db.facture.findUnique({
    where: { id: params.id },
    select: { fournisseurId: true },
  })

  try {
    await db.$transaction(async (tx) => {
      await tx.facture.delete({ where: { id: params.id } })
      if (existing) await recomputeFournisseurTotal(tx, existing.fournisseurId)
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 })
  }
}

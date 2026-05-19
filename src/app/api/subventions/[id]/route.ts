// PATCH  /api/subventions/[id]
// DELETE /api/subventions/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subventionFromDb } from '@/lib/subvention-projet-mapper'
import type { SourceSubvention, StatutSubvention } from '@/lib/types'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  intitule?: string
  description?: string | null
  source?: SourceSubvention
  organisme?: string
  contactNom?: string | null
  contactEmail?: string | null
  montantProjet?: number
  montantDemande?: number
  montantAccorde?: number | null
  montantVerse?: number | null
  dateDepot?: string | null
  dateDecision?: string | null
  datePrevisionVersement?: string | null
  statut?: StatutSubvention
  motifRefus?: string | null
  imputationCompte?: string | null
  notes?: string | null
  documents?: DocumentInput[]
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.intitule !== undefined) data.intitule = body.intitule.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.source !== undefined) data.source = body.source
  if (body.organisme !== undefined) data.organisme = body.organisme.trim()
  if (body.contactNom !== undefined) data.contactNom = body.contactNom?.trim() || null
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail?.trim() || null
  if (body.montantProjet !== undefined) data.montantProjet = body.montantProjet
  if (body.montantDemande !== undefined) data.montantDemande = body.montantDemande
  if (body.montantAccorde !== undefined) data.montantAccorde = body.montantAccorde
  if (body.montantVerse !== undefined) data.montantVerse = body.montantVerse
  if (body.dateDepot !== undefined) data.dateDepot = body.dateDepot ? new Date(body.dateDepot) : null
  if (body.dateDecision !== undefined) data.dateDecision = body.dateDecision ? new Date(body.dateDecision) : null
  if (body.datePrevisionVersement !== undefined) data.datePrevisionVersement = body.datePrevisionVersement ? new Date(body.datePrevisionVersement) : null
  if (body.statut !== undefined) data.statut = body.statut
  if (body.motifRefus !== undefined) data.motifRefus = body.motifRefus?.trim() || null
  if (body.imputationCompte !== undefined) data.imputationCompte = body.imputationCompte?.trim() || null
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        const keptIds = body.documents.filter((d) => d.id && !d.id.startsWith('tmp-')).map((d) => d.id!)
        await tx.document.deleteMany({
          where: { subventionId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter((d) => !d.id || d.id.startsWith('tmp-'))
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({
              subventionId: params.id, name: d.name, size: d.size, type: d.type, dataUrl: d.dataUrl,
            })),
          })
        }
      }
      return tx.demandeSubvention.update({
        where: { id: params.id },
        data,
        include: { documents: { orderBy: { uploadedAt: 'asc' } } },
      })
    })
    return NextResponse.json(subventionFromDb(updated))
  } catch (e) {
    console.error('[api/subventions PATCH]', e)
    return NextResponse.json({ error: 'Subvention introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.demandeSubvention.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Subvention introuvable.' }, { status: 404 })
  }
}

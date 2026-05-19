// PATCH  /api/projets/[id]  → update (remplace financements si fournis)
// DELETE /api/projets/[id]

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projetFromDb } from '@/lib/subvention-projet-mapper'

interface FinancementInput {
  id?: string
  source: string
  organisme?: string
  montant: number
  dureeAnnees?: number
  tauxInteret?: number
  anneeVersement?: number
  certitude?: string
  subventionId?: string
}

interface PatchBody {
  nom?: string
  description?: string | null
  coutTotal?: number
  coutHT?: number | null
  imputationCompte?: string
  anneeDebut?: number
  anneesEtalement?: number
  tauxFCTVA?: number | null
  notes?: string | null
  financements?: FinancementInput[]
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: Record<string, unknown> = {}
  if (body.nom !== undefined) data.nom = body.nom.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.coutTotal !== undefined) data.coutTotal = body.coutTotal
  if (body.coutHT !== undefined) data.coutHT = body.coutHT
  if (body.imputationCompte !== undefined) data.imputationCompte = body.imputationCompte
  if (body.anneeDebut !== undefined) data.anneeDebut = body.anneeDebut
  if (body.anneesEtalement !== undefined) data.anneesEtalement = body.anneesEtalement
  if (body.tauxFCTVA !== undefined) data.tauxFCTVA = body.tauxFCTVA
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  try {
    const updated = await db.$transaction(async (tx) => {
      if (body.financements !== undefined) {
        // Stratégie simple : on supprime tous les financements existants
        // et on les recrée. Les ids éventuellement passés sont ignorés
        // (de toute façon les ids sont des cuid générés à la création).
        await tx.financementProjet.deleteMany({ where: { projetId: params.id } })
        if (body.financements.length > 0) {
          await tx.financementProjet.createMany({
            data: body.financements.map((f) => ({
              projetId: params.id,
              source: f.source,
              organisme: f.organisme || null,
              montant: f.montant,
              dureeAnnees: f.dureeAnnees ?? null,
              tauxInteret: f.tauxInteret ?? null,
              anneeVersement: f.anneeVersement ?? null,
              certitude: f.certitude || null,
              subventionId: f.subventionId || null,
            })),
          })
        }
      }
      return tx.projet.update({
        where: { id: params.id },
        data,
        include: { financements: true },
      })
    })
    return NextResponse.json(projetFromDb(updated))
  } catch (e) {
    console.error('[api/projets PATCH]', e)
    return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    await db.projet.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  }
}

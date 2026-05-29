// GET  /api/bulletins  → liste
// POST /api/bulletins  → crée un bulletin (le client envoie le calcul complet)
//
// Le calcul est effectué côté client via computeBulletin() puis envoyé
// pour stockage. Cela évite de dupliquer la logique métier côté serveur.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { bulletinFromDb } from '@/lib/bulletin-mapper'
import type { BulletinPaie } from '@/lib/types'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  // Confidentialité de la paie : seuls les profils RH voient tous les
  // bulletins ; les autres ne voient que les leurs (profil agent).
  const canViewAll = ctx.can('hr.view-all') || ctx.can('hr.manage') || ctx.can('hr.generate-payslips')
  const where = canViewAll ? {} : { personId: ctx.actor.id }

  const rows = await db.bulletinPaie.findMany({ where, orderBy: [{ mois: 'desc' }, { emisAt: 'desc' }] })
  return NextResponse.json(rows.map(bulletinFromDb))
}

type CreateBody = Omit<BulletinPaie, 'id' | 'createdAt'>

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!(ctx.can('hr.generate-payslips') || ctx.can('hr.manage'))) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!body.personId || !body.mois || !body.numero || !body.snapshot || !body.lignes) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  // Idempotence : si un bulletin existe déjà pour ce (person, mois), on
  // le retourne plutôt que d'en créer un doublon.
  const existing = await db.bulletinPaie.findFirst({
    where: { personId: body.personId, mois: body.mois },
  })
  if (existing) {
    return NextResponse.json(bulletinFromDb(existing))
  }

  // Vérifier que l'EmployeeRecord existe (FK)
  const employee = await db.employeeRecord.findUnique({
    where: { personId: body.personId },
  })
  if (!employee) {
    return NextResponse.json(
      { error: "Fiche RH introuvable pour cet agent." },
      { status: 404 },
    )
  }

  const created = await db.bulletinPaie.create({
    data: {
      personId: body.personId,
      employeeId: body.personId,
      numero: body.numero,
      mois: body.mois,
      snapshot: body.snapshot as object,
      lignes: body.lignes as object,
      brutTotal: body.brutTotal,
      cotisationsSalariales: body.cotisationsSalariales,
      cotisationsPatronales: body.cotisationsPatronales,
      netImposable: body.netImposable,
      netAPayer: body.netAPayer,
      coutEmployeur: body.coutEmployeur,
      statut: body.statut,
      emisAt: body.emisAt ? new Date(body.emisAt) : new Date(),
    },
  })
  return NextResponse.json(bulletinFromDb(created))
}

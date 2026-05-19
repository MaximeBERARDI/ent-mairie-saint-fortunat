// POST /api/quittances/generer  → génère les quittances du mois pour
// tous les baux en cours qui n'en ont pas encore une.
// Body: { mois: 'YYYY-MM' }

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quittanceFromDb } from '@/lib/immo-mapper'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: { mois?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }
  if (!body.mois || !/^\d{4}-\d{2}$/.test(body.mois)) {
    return NextResponse.json({ error: 'Mois requis (YYYY-MM).' }, { status: 400 })
  }
  const mois = body.mois

  const created = await db.$transaction(async (tx) => {
    const enCours = await tx.bail.findMany({ where: { statut: 'en_cours' } })

    // Numérotation à partir du plus haut existant pour ce mois
    const prefix = `Q-${mois}-`
    const existing = await tx.quittance.findMany({
      where: { numero: { startsWith: prefix } },
      select: { numero: true },
    })
    let counter = existing
      .map((q) => parseInt(q.numero.slice(prefix.length), 10))
      .filter((n) => !isNaN(n))
      .reduce((acc, n) => Math.max(acc, n), 0)

    const newOnes = []
    for (const bail of enCours) {
      // Le bail couvre-t-il le mois ?
      const moisDebut = bail.dateDebut.toISOString().slice(0, 7)
      if (mois < moisDebut) continue
      if (bail.dateFin && mois > bail.dateFin.toISOString().slice(0, 7)) continue
      // Existe-t-il déjà une quittance pour ce bail + mois ?
      const existsAlready = await tx.quittance.findFirst({ where: { bailId: bail.id, mois } })
      if (existsAlready) continue

      counter++
      const numero = `${prefix}${String(counter).padStart(3, '0')}`
      const q = await tx.quittance.create({
        data: {
          bailId: bail.id,
          mois,
          numero,
          loyerHC: bail.loyerMensuel,
          charges: bail.chargesMensuelles,
          total: Number(bail.loyerMensuel) + Number(bail.chargesMensuelles),
          statut: 'emise',
          emiseAt: new Date(),
        },
      })
      newOnes.push(q)
    }
    return newOnes
  })

  return NextResponse.json(created.map(quittanceFromDb))
}

// Proxy DVF — valeurs foncières par commune (Opendatasoft Caisse des Dépôts).
// GET /api/gouv/dvf?code_insee=07204  → dernière période disponible.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface DvfRecord {
  periode?: string
  nbmutmoy_vente?: number
  vfmed_ventem?: number   // médiane ventes maisons
  vfmed_ventea?: number   // médiane ventes appartements
  nbmutmoy_maison?: number
  nbmutmoy_appart?: number
}

const DATASET = 'donnees-valeurs-foncieres-a-la-commune-par-periode'
const BASE = `https://opendata.caissedesdepots.fr/api/explore/v2.1/catalog/datasets/${DATASET}/records`

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const codeInsee = new URL(req.url).searchParams.get('code_insee')?.trim()
  if (!codeInsee) return NextResponse.json({ error: 'code_insee requis.' }, { status: 400 })

  const params = new URLSearchParams({
    where: `com_code="${codeInsee.replace(/"/g, '')}"`,
    order_by: 'periode desc',
    limit: '1',
  })

  try {
    const upstream = await fetch(`${BASE}?${params.toString()}`, { next: { revalidate: 604800 } })
    if (!upstream.ok) return NextResponse.json({ result: null }, { status: 502 })
    const data = await upstream.json()
    const r: DvfRecord | undefined = data.results?.[0]
    if (!r) return NextResponse.json({ result: null })
    return NextResponse.json({
      result: {
        periode: r.periode,
        ventesParAn: r.nbmutmoy_vente,
        prixMedianMaison: r.vfmed_ventem,
        prixMedianAppart: r.vfmed_ventea,
        nbMaison: r.nbmutmoy_maison,
        nbAppart: r.nbmutmoy_appart,
      },
    })
  } catch {
    return NextResponse.json({ result: null }, { status: 502 })
  }
}

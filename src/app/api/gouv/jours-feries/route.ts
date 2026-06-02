// Proxy API Jours fériés (métropole). GET /api/gouv/jours-feries?year=2026
// Réponse : { 'YYYY-MM-DD': 'libellé' }.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const raw = Number(new URL(req.url).searchParams.get('year'))
  const year = Number.isInteger(raw) && raw >= 2000 && raw <= 2100 ? raw : new Date().getFullYear()

  try {
    const upstream = await fetch(
      `https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`,
      { next: { revalidate: 86400 } },
    )
    if (!upstream.ok) return NextResponse.json({}, { status: 502 })
    return NextResponse.json(await upstream.json())
  } catch {
    return NextResponse.json({}, { status: 502 })
  }
}

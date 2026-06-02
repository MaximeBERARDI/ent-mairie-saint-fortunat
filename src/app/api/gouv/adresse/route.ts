// Proxy Base Adresse Nationale (BAN). GET /api/gouv/adresse?q=...
// Évite le CORS, garde l'app cohérente, met du cache sur la réponse amont.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface BanFeature {
  properties: {
    label: string
    housenumber?: string
    street?: string
    name?: string
    postcode?: string
    city?: string
    citycode?: string
    score?: number
  }
  geometry: { coordinates: [number, number] }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) return NextResponse.json({ results: [] })

  try {
    const upstream = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`,
      { next: { revalidate: 86400 } },
    )
    if (!upstream.ok) return NextResponse.json({ error: 'Service BAN indisponible.' }, { status: 502 })
    const data = await upstream.json()
    const results = (data.features ?? []).map((f: BanFeature) => ({
      label: f.properties.label,
      housenumber: f.properties.housenumber,
      street: f.properties.street ?? f.properties.name,
      postcode: f.properties.postcode,
      city: f.properties.city,
      citycode: f.properties.citycode,
      lon: f.geometry?.coordinates?.[0],
      lat: f.geometry?.coordinates?.[1],
      score: f.properties.score,
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Service BAN injoignable.' }, { status: 502 })
  }
}

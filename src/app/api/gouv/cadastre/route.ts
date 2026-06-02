// Proxy API Carto — cadastre (IGN).
// GET /api/gouv/cadastre?code_insee=07XXX&section=AB&numero=0123

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface CadastreFeature {
  properties: {
    idu?: string
    section?: string
    numero?: string
    contenance?: number
    commune?: string
    code_insee?: string
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const codeInsee = sp.get('code_insee')?.trim()
  if (!codeInsee) return NextResponse.json({ error: 'code_insee requis.' }, { status: 400 })

  const upstreamParams = new URLSearchParams({ code_insee: codeInsee })
  const section = sp.get('section')?.trim()
  const numero = sp.get('numero')?.trim()
  if (section) upstreamParams.set('section', section)
  if (numero) upstreamParams.set('numero', numero)

  try {
    const upstream = await fetch(
      `https://apicarto.ign.fr/api/cadastre/parcelle?${upstreamParams.toString()}`,
      { next: { revalidate: 86400 } },
    )
    if (!upstream.ok) return NextResponse.json({ error: 'Service cadastre indisponible.' }, { status: 502 })
    const data = await upstream.json()
    const results = (data.features ?? []).map((f: CadastreFeature) => ({
      idu: f.properties.idu,
      section: f.properties.section,
      numero: f.properties.numero,
      contenance: f.properties.contenance,
      commune: f.properties.commune,
      codeInsee: f.properties.code_insee,
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Service cadastre injoignable.' }, { status: 502 })
  }
}

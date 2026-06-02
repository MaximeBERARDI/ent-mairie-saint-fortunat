// Proxy Annuaire de l'administration (DILA, Opendatasoft v2.1).
// GET /api/gouv/annuaire?q=...&code_insee=...

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const DATASET = 'api-lannuaire-administration'
const BASE = `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/${DATASET}/records`

// Les champs adresse / telephone / site_internet arrivent en tableaux d'objets
// (parfois sérialisés en chaîne JSON) → on normalise défensivement.
function asArray(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) return v as Record<string, unknown>[]
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

interface AnnuaireRecord {
  nom?: string
  adresse?: unknown
  telephone?: unknown
  adresse_courriel?: string
  site_internet?: unknown
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const q = sp.get('q')?.trim()
  const codeInsee = sp.get('code_insee')?.trim()

  const clauses: string[] = []
  if (codeInsee) clauses.push(`code_insee_commune="${codeInsee.replace(/"/g, '')}"`)
  if (q) clauses.push(`"${q.replace(/"/g, '')}"`)
  if (clauses.length === 0) return NextResponse.json({ results: [] })

  const params = new URLSearchParams({ where: clauses.join(' and '), limit: '10' })

  try {
    const upstream = await fetch(`${BASE}?${params.toString()}`, { next: { revalidate: 86400 } })
    if (!upstream.ok) return NextResponse.json({ error: 'Annuaire indisponible.' }, { status: 502 })
    const data = await upstream.json()
    const results = (data.results ?? []).map((r: AnnuaireRecord) => {
      const adr = asArray(r.adresse)[0] ?? {}
      const tel = asArray(r.telephone)[0] ?? {}
      const site = asArray(r.site_internet)[0] ?? {}
      const adresse = [adr.numero_voie, [adr.code_postal, adr.nom_commune].filter(Boolean).join(' ')]
        .filter(Boolean).join(', ')
      return {
        nom: r.nom ?? '',
        adresse: adresse || undefined,
        telephone: (tel.valeur as string) || undefined,
        email: r.adresse_courriel || undefined,
        siteInternet: (site.valeur as string) || undefined,
        commune: (adr.nom_commune as string) || undefined,
      }
    })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Annuaire injoignable.' }, { status: 502 })
  }
}

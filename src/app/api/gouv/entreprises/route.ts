// Proxy API Recherche d'entreprises. GET /api/gouv/entreprises?q=...
// q accepte un texte (raison sociale) ou un SIREN/SIRET.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface RneResult {
  siren: string
  nom_complet?: string
  nom_raison_sociale?: string
  etat_administratif?: string   // 'A' actif / 'C' cessé
  activite_principale?: string
  siege?: {
    siret?: string
    adresse?: string
    code_postal?: string
    libelle_commune?: string
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) return NextResponse.json({ results: [] })

  try {
    const upstream = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=8`,
      { next: { revalidate: 3600 } },
    )
    if (!upstream.ok) return NextResponse.json({ error: 'Annuaire des entreprises indisponible.' }, { status: 502 })
    const data = await upstream.json()
    const results = (data.results ?? []).map((e: RneResult) => ({
      siren: e.siren,
      siret: e.siege?.siret,
      nom: e.nom_complet || e.nom_raison_sociale || e.siren,
      adresse: e.siege?.adresse,
      codePostal: e.siege?.code_postal,
      commune: e.siege?.libelle_commune,
      actif: e.etat_administratif === 'A',
      naf: e.activite_principale,
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Annuaire des entreprises injoignable.' }, { status: 502 })
  }
}

// API Carto — module cadastre (IGN). Parcelles officielles, sans clé.
// Appels via le proxy serveur /api/gouv/cadastre.
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§3).
//
// Prêt à brancher dans le Parc immobilier ; nécessite côté schéma un champ
// « référence cadastrale » pour persister section/numéro (Phase 1.5).

export interface Parcelle {
  idu?: string
  section?: string
  numero?: string
  contenance?: number   // surface en m²
  commune?: string
  codeInsee?: string
}

export async function fetchParcelles(
  params: { codeInsee: string; section?: string; numero?: string },
  signal?: AbortSignal,
): Promise<Parcelle[]> {
  if (!params.codeInsee) return []
  const sp = new URLSearchParams({ code_insee: params.codeInsee })
  if (params.section) sp.set('section', params.section)
  if (params.numero) sp.set('numero', params.numero)
  try {
    const res = await fetch(`/api/gouv/cadastre?${sp.toString()}`, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []) as Parcelle[]
  } catch {
    return []
  }
}

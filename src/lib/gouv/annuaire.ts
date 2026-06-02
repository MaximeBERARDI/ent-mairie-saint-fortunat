// Annuaire de l'administration et des services publics (DILA, Opendatasoft v2.1).
// Recherche plein-texte via le proxy serveur /api/gouv/annuaire.
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§6).

export interface ServicePublic {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  siteInternet?: string
  commune?: string
}

export async function searchServicesPublics(q: string, signal?: AbortSignal): Promise<ServicePublic[]> {
  const query = q.trim()
  if (query.length < 3) return []
  try {
    const res = await fetch(`/api/gouv/annuaire?q=${encodeURIComponent(query)}`, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []) as ServicePublic[]
  } catch {
    return []
  }
}

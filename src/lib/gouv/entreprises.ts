// API Recherche d'entreprises (base SIRENE + RNE) — annuaire ouvert, sans clé.
// Appels via le proxy serveur /api/gouv/entreprises.
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§1).

export interface EntrepriseResult {
  siren: string
  siret?: string
  nom: string
  adresse?: string
  codePostal?: string
  commune?: string
  actif: boolean        // false = établissement cessé / radié
  naf?: string          // code activité principale
}

export async function searchEntreprises(q: string, signal?: AbortSignal): Promise<EntrepriseResult[]> {
  const query = q.trim()
  if (query.length < 3) return []
  try {
    const res = await fetch(`/api/gouv/entreprises?q=${encodeURIComponent(query)}`, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []) as EntrepriseResult[]
  } catch {
    return []
  }
}

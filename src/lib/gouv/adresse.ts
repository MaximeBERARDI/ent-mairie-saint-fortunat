// Base Adresse Nationale (BAN) — autocomplétion d'adresses.
// Les appels passent par le proxy serveur /api/gouv/adresse (pas de CORS, cache).
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§2).

export interface AddressSuggestion {
  label: string
  housenumber?: string
  street?: string
  postcode?: string
  city?: string
  citycode?: string   // code INSEE de la commune (utile pour le cadastre)
  lon?: number
  lat?: number
  score?: number
}

export async function searchAddress(q: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const query = q.trim()
  if (query.length < 3) return []
  try {
    const res = await fetch(`/api/gouv/adresse?q=${encodeURIComponent(query)}`, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []) as AddressSuggestion[]
  } catch {
    return []
  }
}

// API Jours fériés (calendrier.api.gouv.fr) — métropole.
// Appels via le proxy serveur /api/gouv/jours-feries.
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§5).

// Map { 'YYYY-MM-DD': 'libellé du jour férié' }
export type JoursFeries = Record<string, string>

export async function fetchJoursFeries(year: number): Promise<JoursFeries> {
  try {
    const res = await fetch(`/api/gouv/jours-feries?year=${year}`)
    if (!res.ok) return {}
    return (await res.json()) as JoursFeries
  } catch {
    return {}
  }
}

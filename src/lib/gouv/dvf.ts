// DVF — valeurs foncières agrégées par commune (jeu Caisse des Dépôts, stable).
// Données INDICATIVES (médianes communales sur ~3 ans), via le proxy serveur.
// Cf. docs/integration-etat/phase-1-apis-techniques.md (§4).

export interface DvfCommune {
  periode?: string          // ex: '2020_2022'
  ventesParAn?: number      // nombre moyen de ventes / an
  prixMedianMaison?: number // € (médiane des ventes de maisons)
  prixMedianAppart?: number // € (médiane des ventes d'appartements)
  nbMaison?: number
  nbAppart?: number
}

export async function fetchDvfCommune(codeInsee: string, signal?: AbortSignal): Promise<DvfCommune | null> {
  if (!codeInsee) return null
  try {
    const res = await fetch(`/api/gouv/dvf?code_insee=${encodeURIComponent(codeInsee)}`, { signal })
    if (!res.ok) return null
    const data = await res.json()
    return (data.result ?? null) as DvfCommune | null
  } catch {
    return null
  }
}

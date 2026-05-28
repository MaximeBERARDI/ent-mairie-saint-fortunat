// Fetcher SWR partagé.
//
// SWR cache les réponses par clé (l'URL). Plusieurs composants qui
// appellent `useSWR('/api/tasks')` partagent le même cache → pas de
// refetch quand on navigue entre les pages. Revalidation en arrière-plan
// (focus de la fenêtre, reconnexion réseau) pour garder les données
// fraîches sans bloquer le rendu.

export async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) {
    const err = new Error(`Erreur ${r.status}`) as Error & { status?: number }
    err.status = r.status
    throw err
  }
  return r.json() as Promise<T>
}

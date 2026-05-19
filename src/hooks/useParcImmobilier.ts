'use client'

// Hook unifié pour le parc immobilier (biens + locataires + baux + quittances)
// branché sur les API Prisma. Les 4 listes sont chargées en parallèle au
// montage. Mutations en optimistic update + rollback. Interface publique
// inchangée pour ne pas casser les pages.

import { useEffect, useState, useCallback } from 'react'
import type {
  BienImmobilier, Locataire, Bail, Quittance, ModeReglement,
} from '@/lib/types'

export function useParcImmobilier() {
  const [biens, setBiens] = useState<BienImmobilier[]>([])
  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [baux, setBaux] = useState<Bail[]>([])
  const [quittances, setQuittances] = useState<Quittance[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/biens').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/locataires').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/baux').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/quittances').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, l, bx, q]) => {
        if (!cancelled) {
          setBiens(b)
          setLocataires(l)
          setBaux(bx)
          setQuittances(q)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useParcImmobilier] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  // ─── Biens ───────────────────────────────────────────────────────

  const createBien = useCallback((data: Omit<BienImmobilier, 'id' | 'createdAt'>): BienImmobilier => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: BienImmobilier = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setBiens((prev) => [optimistic, ...prev])

    fetch('/api/biens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: BienImmobilier) => {
        setBiens((prev) => prev.map((b) => (b.id === tempId ? created : b)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] createBien error:', e)
        setBiens((prev) => prev.filter((b) => b.id !== tempId))
        alert('Impossible de créer le bien.')
      })
    return optimistic
  }, [])

  const updateBien = useCallback((id: string, patch: Partial<BienImmobilier>) => {
    let previous: BienImmobilier[] = []
    setBiens((prev) => { previous = prev; return prev.map((b) => (b.id === id ? { ...b, ...patch } : b)) })

    fetch(`/api/biens/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: BienImmobilier) => {
        setBiens((prev) => prev.map((b) => (b.id === id ? updated : b)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] updateBien error:', e)
        setBiens(previous)
        alert('Impossible de mettre à jour le bien.')
      })
  }, [])

  const deleteBien = useCallback((id: string) => {
    let previous: BienImmobilier[] = []
    setBiens((prev) => { previous = prev; return prev.filter((b) => b.id !== id) })
    fetch(`/api/biens/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useParcImmobilier] deleteBien error:', e)
        setBiens(previous)
        alert('Impossible de supprimer (bien utilisé par un bail ?).')
      })
  }, [])

  // ─── Locataires ──────────────────────────────────────────────────

  const createLocataire = useCallback((data: Omit<Locataire, 'id' | 'createdAt' | 'fullName'>): Locataire => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Locataire = {
      ...data, id: tempId, fullName: `${data.prenom} ${data.nom}`, createdAt: new Date().toISOString(),
    }
    setLocataires((prev) => [optimistic, ...prev])

    fetch('/api/locataires', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Locataire) => {
        setLocataires((prev) => prev.map((l) => (l.id === tempId ? created : l)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] createLocataire error:', e)
        setLocataires((prev) => prev.filter((l) => l.id !== tempId))
        alert('Impossible de créer le locataire.')
      })
    return optimistic
  }, [])

  const updateLocataire = useCallback((id: string, patch: Partial<Locataire>) => {
    let previous: Locataire[] = []
    setLocataires((prev) => {
      previous = prev
      return prev.map((l) => {
        if (l.id !== id) return l
        const next = { ...l, ...patch }
        if (patch.prenom || patch.nom) next.fullName = `${next.prenom} ${next.nom}`
        return next
      })
    })

    fetch(`/api/locataires/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Locataire) => {
        setLocataires((prev) => prev.map((l) => (l.id === id ? updated : l)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] updateLocataire error:', e)
        setLocataires(previous)
        alert('Impossible de mettre à jour le locataire.')
      })
  }, [])

  const deleteLocataire = useCallback((id: string) => {
    let previous: Locataire[] = []
    setLocataires((prev) => { previous = prev; return prev.filter((l) => l.id !== id) })
    fetch(`/api/locataires/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useParcImmobilier] deleteLocataire error:', e)
        setLocataires(previous)
        alert('Impossible de supprimer (locataire lié à un bail ?).')
      })
  }, [])

  // ─── Baux ────────────────────────────────────────────────────────

  const createBail = useCallback((data: Omit<Bail, 'id' | 'createdAt'>): Bail => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Bail = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setBaux((prev) => [optimistic, ...prev])

    fetch('/api/baux', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Bail) => {
        setBaux((prev) => prev.map((b) => (b.id === tempId ? created : b)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] createBail error:', e)
        setBaux((prev) => prev.filter((b) => b.id !== tempId))
        alert('Impossible de créer le bail.')
      })
    return optimistic
  }, [])

  const updateBail = useCallback((id: string, patch: Partial<Bail>) => {
    let previous: Bail[] = []
    setBaux((prev) => { previous = prev; return prev.map((b) => (b.id === id ? { ...b, ...patch } : b)) })

    fetch(`/api/baux/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Bail) => {
        setBaux((prev) => prev.map((b) => (b.id === id ? updated : b)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] updateBail error:', e)
        setBaux(previous)
        alert('Impossible de mettre à jour le bail.')
      })
  }, [])

  const deleteBail = useCallback((id: string) => {
    let previous: Bail[] = []
    setBaux((prev) => { previous = prev; return prev.filter((b) => b.id !== id) })
    fetch(`/api/baux/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useParcImmobilier] deleteBail error:', e)
        setBaux(previous)
        alert('Impossible de supprimer le bail.')
      })
  }, [])

  // ─── Quittances ──────────────────────────────────────────────────

  const createQuittance = useCallback((data: Omit<Quittance, 'id' | 'createdAt' | 'numero'>) => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Quittance = {
      ...data,
      id: tempId,
      numero: `Q-${data.mois}-…`,
      createdAt: new Date().toISOString(),
    }
    setQuittances((prev) => [optimistic, ...prev])

    fetch('/api/quittances', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Quittance) => {
        setQuittances((prev) => prev.map((q) => (q.id === tempId ? created : q)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] createQuittance error:', e)
        setQuittances((prev) => prev.filter((q) => q.id !== tempId))
        alert('Impossible de créer la quittance.')
      })
  }, [])

  const updateQuittance = useCallback((id: string, patch: Partial<Quittance>) => {
    let previous: Quittance[] = []
    setQuittances((prev) => { previous = prev; return prev.map((q) => (q.id === id ? { ...q, ...patch } : q)) })

    fetch(`/api/quittances/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Quittance) => {
        setQuittances((prev) => prev.map((q) => (q.id === id ? updated : q)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] updateQuittance error:', e)
        setQuittances(previous)
        alert('Impossible de mettre à jour la quittance.')
      })
  }, [])

  const deleteQuittance = useCallback((id: string) => {
    let previous: Quittance[] = []
    setQuittances((prev) => { previous = prev; return prev.filter((q) => q.id !== id) })
    fetch(`/api/quittances/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useParcImmobilier] deleteQuittance error:', e)
        setQuittances(previous)
        alert('Impossible de supprimer la quittance.')
      })
  }, [])

  const patchAction = useCallback((id: string, body: Record<string, unknown>, errorMsg: string) => {
    const previous = quittances
    fetch(`/api/quittances/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Quittance) => {
        setQuittances((prev) => prev.map((q) => (q.id === id ? updated : q)))
      })
      .catch((e) => {
        console.error('[useParcImmobilier] action error:', e)
        setQuittances(previous)
        alert(errorMsg)
      })
  }, [quittances])

  const markPayee = useCallback((id: string, mode: ModeReglement) => {
    setQuittances((prev) => prev.map((q) => (
      q.id === id ? { ...q, statut: 'Payée', payeeAt: new Date().toISOString(), modeReglement: mode } : q
    )))
    patchAction(id, { action: 'markPayee', modeReglement: mode }, 'Impossible de marquer payée.')
  }, [patchAction])

  const markImpayee = useCallback((id: string) => {
    setQuittances((prev) => prev.map((q) => (
      q.id === id ? { ...q, statut: 'Impayée', payeeAt: undefined, modeReglement: undefined } : q
    )))
    patchAction(id, { action: 'markImpayee' }, 'Impossible de marquer impayée.')
  }, [patchAction])

  const markRelancee = useCallback((id: string) => {
    setQuittances((prev) => prev.map((q) => (q.id === id ? { ...q, statut: 'Relancée' } : q)))
    patchAction(id, { action: 'markRelancee' }, 'Impossible de marquer relancée.')
  }, [patchAction])

  /**
   * Génère les quittances du mois indiqué pour tous les baux en cours.
   * Le serveur fait la logique (transaction Prisma + numérotation).
   */
  const genererQuittancesDuMois = useCallback((mois: string): Quittance[] => {
    // On déclenche la requête et on rafraîchit la liste à la réponse.
    // Le retour synchrone est vide (les vraies quittances arrivent juste après).
    fetch('/api/quittances/generer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mois }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Quittance[]) => {
        setQuittances((prev) => [...created, ...prev])
      })
      .catch((e) => {
        console.error('[useParcImmobilier] generer error:', e)
        alert('Impossible de générer les quittances.')
      })
    return []
  }, [])

  return {
    biens, locataires, baux, quittances,
    hydrated,

    createBien, updateBien, deleteBien,
    createLocataire, updateLocataire, deleteLocataire,
    createBail, updateBail, deleteBail,
    createQuittance, updateQuittance, deleteQuittance,
    markPayee, markImpayee, markRelancee,
    genererQuittancesDuMois,
  }
}

'use client'

// Hook gestion des bulletins de paie branché sur /api/bulletins.
// Le calcul du bulletin reste côté client (computeBulletin) puis
// envoyé à l'API pour stockage en DB (snapshot JSON).

import { useEffect, useState, useCallback } from 'react'
import type { BulletinPaie, EmployeeRecord, BulletinStatut } from '@/lib/types'
import type { Person } from '@/lib/people'
import { computeBulletin } from '@/lib/bulletin-paie-calc'

function nextNumero(bulletins: BulletinPaie[], mois: string): string {
  const prefix = `PAIE-${mois}-`
  const max = bulletins
    .map((b) => b.numero)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function useBulletins() {
  const [bulletins, setBulletins] = useState<BulletinPaie[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/bulletins')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: BulletinPaie[]) => {
        if (!cancelled) {
          setBulletins(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useBulletins] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Sauvegarde un bulletin (calculé côté client) en DB
  const persistBulletin = useCallback((bulletin: BulletinPaie) => {
    // Optimistic insert (l'id est déjà set par computeBulletin)
    setBulletins((prev) => [bulletin, ...prev.filter((b) => b.id !== bulletin.id)])

    const { id: _id, createdAt: _ca, ...payload } = bulletin
    void _id; void _ca
    fetch('/api/bulletins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: BulletinPaie) => {
        setBulletins((prev) => prev.map((b) => (b.id === bulletin.id ? saved : b)))
      })
      .catch((e) => {
        console.error('[useBulletins] save error:', e)
        // Rollback : retire le bulletin optimiste
        setBulletins((prev) => prev.filter((b) => b.id !== bulletin.id))
        alert('Impossible de sauvegarder le bulletin.')
      })
  }, [])

  /**
   * Génère un bulletin individuel pour un agent / mois donné.
   * Si un bulletin existe déjà, il est retourné inchangé.
   */
  const genererBulletin = useCallback((person: Person, employee: EmployeeRecord, mois: string): BulletinPaie => {
    const existing = bulletins.find((b) => b.personId === person.id && b.mois === mois)
    if (existing) return existing
    const numero = nextNumero(bulletins, mois)
    const bulletin = computeBulletin({ person, employee, mois, numero })
    persistBulletin(bulletin)
    return bulletin
  }, [bulletins, persistBulletin])

  /**
   * Génère les bulletins du mois pour TOUS les agents passés. Pour
   * éviter d'envoyer N requêtes parallèles, on les enchaîne en série.
   */
  const genererBulletinsDuMois = useCallback((mois: string, persons: Person[], employees: EmployeeRecord[]): BulletinPaie[] => {
    const newOnes: BulletinPaie[] = []
    let counter = bulletins.filter((b) => b.mois === mois).length
    for (const person of persons) {
      const employee = employees.find((e) => e.personId === person.id)
      if (!employee) continue
      if (bulletins.some((b) => b.personId === person.id && b.mois === mois)) continue
      counter++
      const numero = `PAIE-${mois}-${String(counter).padStart(3, '0')}`
      const bulletin = computeBulletin({ person, employee, mois, numero })
      persistBulletin(bulletin)
      newOnes.push(bulletin)
    }
    return newOnes
  }, [bulletins, persistBulletin])

  const updateStatut = useCallback((id: string, statut: BulletinStatut) => {
    let previous: BulletinPaie[] = []
    setBulletins((prev) => {
      previous = prev
      return prev.map((b) => (b.id === id ? { ...b, statut } : b))
    })

    fetch(`/api/bulletins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useBulletins] update statut error:', e)
        setBulletins(previous)
        alert('Impossible de changer le statut.')
      })
  }, [])

  const deleteBulletin = useCallback((id: string) => {
    let previous: BulletinPaie[] = []
    setBulletins((prev) => {
      previous = prev
      return prev.filter((b) => b.id !== id)
    })

    fetch(`/api/bulletins/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useBulletins] delete error:', e)
        setBulletins(previous)
        alert('Impossible de supprimer le bulletin.')
      })
  }, [])

  const byPerson = useCallback((personId: string) => {
    return bulletins
      .filter((b) => b.personId === personId)
      .sort((a, b) => b.mois.localeCompare(a.mois))
  }, [bulletins])

  const byMois = useCallback((mois: string) => {
    return bulletins.filter((b) => b.mois === mois)
  }, [bulletins])

  return {
    bulletins,
    hydrated,
    genererBulletin,
    genererBulletinsDuMois,
    updateStatut,
    deleteBulletin,
    byPerson,
    byMois,
  }
}

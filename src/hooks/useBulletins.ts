'use client'

// Bulletins de paie branchés sur /api/bulletins.
// Le calcul du bulletin reste côté client (computeBulletin) puis envoyé à
// l'API pour stockage en DB. Cache cross-pages via SWR + mutations optimistes.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { BulletinPaie, EmployeeRecord, BulletinStatut } from '@/lib/types'
import type { Person } from '@/lib/people'
import { computeBulletin } from '@/lib/bulletin-paie-calc'

const KEY = '/api/bulletins'

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
  const { data, mutate } = useSWR<BulletinPaie[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const bulletins = data ?? []
  const hydrated = data !== undefined

  const persistBulletin = useCallback((bulletin: BulletinPaie) => {
    const previous = bulletins
    mutate([bulletin, ...previous.filter((b) => b.id !== bulletin.id)], { revalidate: false })

    const { id: _id, createdAt: _ca, ...payload } = bulletin
    void _id; void _ca
    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((saved: BulletinPaie) => {
        mutate((prev) => (prev ?? []).map((b) => (b.id === bulletin.id ? saved : b)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useBulletins] save error:', e)
        mutate((prev) => (prev ?? []).filter((b) => b.id !== bulletin.id), { revalidate: false })
        alert('Impossible de sauvegarder le bulletin.')
      })
  }, [bulletins, mutate])

  const genererBulletin = useCallback((person: Person, employee: EmployeeRecord, mois: string): BulletinPaie => {
    const existing = bulletins.find((b) => b.personId === person.id && b.mois === mois)
    if (existing) return existing
    const numero = nextNumero(bulletins, mois)
    const bulletin = computeBulletin({ person, employee, mois, numero })
    persistBulletin(bulletin)
    return bulletin
  }, [bulletins, persistBulletin])

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
    const previous = bulletins
    mutate(previous.map((b) => (b.id === id ? { ...b, statut } : b)), { revalidate: false })

    fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useBulletins] update statut error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de changer le statut.')
      })
  }, [bulletins, mutate])

  const deleteBulletin = useCallback((id: string) => {
    const previous = bulletins
    mutate(previous.filter((b) => b.id !== id), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useBulletins] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer le bulletin.')
      })
  }, [bulletins, mutate])

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

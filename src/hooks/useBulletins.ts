'use client'

import { useEffect, useState, useCallback } from 'react'
import type { BulletinPaie, EmployeeRecord, BulletinStatut } from '@/lib/types'
import type { Person } from '@/lib/people'
import { computeBulletin } from '@/lib/bulletin-paie-calc'

const STORAGE_KEY = 'ent-mairie:bulletins:v1'

function load(): BulletinPaie[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(items: BulletinPaie[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function nextNumero(bulletins: BulletinPaie[], mois: string): string {
  const prefix = `PAIE-${mois}-`
  const max = bulletins
    .map(b => b.numero)
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function useBulletins() {
  const [bulletins, setBulletins] = useState<BulletinPaie[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setBulletins(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persist(bulletins)
  }, [bulletins, hydrated])

  /**
   * Génère un bulletin individuel pour un agent / mois donné.
   * Si un bulletin existe déjà, il est retourné inchangé.
   */
  const genererBulletin = useCallback((person: Person, employee: EmployeeRecord, mois: string): BulletinPaie => {
    const existing = bulletins.find(b => b.personId === person.id && b.mois === mois)
    if (existing) return existing
    const numero = nextNumero(bulletins, mois)
    const bulletin = computeBulletin({ person, employee, mois, numero })
    setBulletins(prev => [bulletin, ...prev])
    return bulletin
  }, [bulletins])

  /**
   * Génère les bulletins du mois pour TOUS les agents passés en argument.
   * Retourne les nouveaux bulletins créés (n'inclut pas ceux déjà existants).
   */
  const genererBulletinsDuMois = useCallback((mois: string, persons: Person[], employees: EmployeeRecord[]): BulletinPaie[] => {
    const newOnes: BulletinPaie[] = []
    setBulletins(prev => {
      let counter = prev.filter(b => b.mois === mois).length
      const next = [...prev]
      for (const person of persons) {
        const employee = employees.find(e => e.personId === person.id)
        if (!employee) continue
        if (next.some(b => b.personId === person.id && b.mois === mois)) continue
        counter++
        const numero = `PAIE-${mois}-${String(counter).padStart(3, '0')}`
        const bulletin = computeBulletin({ person, employee, mois, numero })
        next.unshift(bulletin)
        newOnes.push(bulletin)
      }
      return next
    })
    return newOnes
  }, [])

  const updateStatut = useCallback((id: string, statut: BulletinStatut) => {
    setBulletins(prev => prev.map(b => (b.id === id ? { ...b, statut } : b)))
  }, [])

  const deleteBulletin = useCallback((id: string) => {
    setBulletins(prev => prev.filter(b => b.id !== id))
  }, [])

  // Bulletins d'un agent (du plus récent au plus ancien)
  const byPerson = useCallback((personId: string) => {
    return bulletins
      .filter(b => b.personId === personId)
      .sort((a, b) => b.mois.localeCompare(a.mois))
  }, [bulletins])

  // Bulletins d'un mois donné
  const byMois = useCallback((mois: string) => {
    return bulletins.filter(b => b.mois === mois)
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

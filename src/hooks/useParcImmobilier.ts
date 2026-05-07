'use client'

import { useEffect, useState, useCallback } from 'react'
import type {
  BienImmobilier, Locataire, Bail, Quittance, ModeReglement, StatutQuittance,
} from '@/lib/types'
import { BIENS_IMMOBILIERS, LOCATAIRES, BAUX, QUITTANCES } from '@/lib/data'

const KEY_BIENS = 'ent-mairie:biens:v1'
const KEY_LOCATAIRES = 'ent-mairie:locataires:v1'
const KEY_BAUX = 'ent-mairie:baux:v1'
const KEY_QUITTANCES = 'ent-mairie:quittances:v1'

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seed
  } catch {
    return seed
  }
}

function persist<T>(key: string, items: T[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {}
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// Génère un numéro de quittance Q-YYYY-MM-NNN incrémental sur le mois.
function nextQuittanceNumero(quittances: Quittance[], mois: string): string {
  const prefix = `Q-${mois}-`
  const max = quittances
    .map(q => q.numero)
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function useParcImmobilier() {
  const [biens, setBiens] = useState<BienImmobilier[]>(BIENS_IMMOBILIERS)
  const [locataires, setLocataires] = useState<Locataire[]>(LOCATAIRES)
  const [baux, setBaux] = useState<Bail[]>(BAUX)
  const [quittances, setQuittances] = useState<Quittance[]>(QUITTANCES)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setBiens(loadOrSeed(KEY_BIENS, BIENS_IMMOBILIERS))
    setLocataires(loadOrSeed(KEY_LOCATAIRES, LOCATAIRES))
    setBaux(loadOrSeed(KEY_BAUX, BAUX))
    setQuittances(loadOrSeed(KEY_QUITTANCES, QUITTANCES))
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) persist(KEY_BIENS, biens) }, [biens, hydrated])
  useEffect(() => { if (hydrated) persist(KEY_LOCATAIRES, locataires) }, [locataires, hydrated])
  useEffect(() => { if (hydrated) persist(KEY_BAUX, baux) }, [baux, hydrated])
  useEffect(() => { if (hydrated) persist(KEY_QUITTANCES, quittances) }, [quittances, hydrated])

  // ─── Biens ───────────────────────────────────────────────────────

  const createBien = useCallback((data: Omit<BienImmobilier, 'id' | 'createdAt'>): BienImmobilier => {
    const item: BienImmobilier = { ...data, id: newId('imm'), createdAt: new Date().toISOString() }
    setBiens(prev => [item, ...prev])
    return item
  }, [])

  const updateBien = useCallback((id: string, patch: Partial<BienImmobilier>) => {
    setBiens(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const deleteBien = useCallback((id: string) => {
    setBiens(prev => prev.filter(b => b.id !== id))
  }, [])

  // ─── Locataires ──────────────────────────────────────────────────

  const createLocataire = useCallback((data: Omit<Locataire, 'id' | 'createdAt' | 'fullName'>): Locataire => {
    const item: Locataire = {
      ...data,
      id: newId('loc'),
      fullName: `${data.prenom} ${data.nom}`,
      createdAt: new Date().toISOString(),
    }
    setLocataires(prev => [item, ...prev])
    return item
  }, [])

  const updateLocataire = useCallback((id: string, patch: Partial<Locataire>) => {
    setLocataires(prev => prev.map(l => {
      if (l.id !== id) return l
      const next = { ...l, ...patch }
      if (patch.prenom || patch.nom) next.fullName = `${next.prenom} ${next.nom}`
      return next
    }))
  }, [])

  const deleteLocataire = useCallback((id: string) => {
    setLocataires(prev => prev.filter(l => l.id !== id))
  }, [])

  // ─── Baux ────────────────────────────────────────────────────────

  const createBail = useCallback((data: Omit<Bail, 'id' | 'createdAt'>): Bail => {
    const item: Bail = { ...data, id: newId('bail'), createdAt: new Date().toISOString() }
    setBaux(prev => [item, ...prev])
    return item
  }, [])

  const updateBail = useCallback((id: string, patch: Partial<Bail>) => {
    setBaux(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  const deleteBail = useCallback((id: string) => {
    setBaux(prev => prev.filter(b => b.id !== id))
  }, [])

  // ─── Quittances ──────────────────────────────────────────────────

  const createQuittance = useCallback((data: Omit<Quittance, 'id' | 'createdAt' | 'numero'>) => {
    setQuittances(prev => {
      const numero = nextQuittanceNumero(prev, data.mois)
      const item: Quittance = {
        ...data,
        id: newId('q'),
        numero,
        createdAt: new Date().toISOString(),
      }
      return [item, ...prev]
    })
  }, [])

  const updateQuittance = useCallback((id: string, patch: Partial<Quittance>) => {
    setQuittances(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }, [])

  const deleteQuittance = useCallback((id: string) => {
    setQuittances(prev => prev.filter(q => q.id !== id))
  }, [])

  // Marque une quittance comme payée
  const markPayee = useCallback((id: string, mode: ModeReglement) => {
    setQuittances(prev => prev.map(q => (
      q.id === id
        ? { ...q, statut: 'Payée' as StatutQuittance, payeeAt: new Date().toISOString(), modeReglement: mode }
        : q
    )))
  }, [])

  const markImpayee = useCallback((id: string) => {
    setQuittances(prev => prev.map(q => (
      q.id === id ? { ...q, statut: 'Impayée' as StatutQuittance, payeeAt: undefined, modeReglement: undefined } : q
    )))
  }, [])

  const markRelancee = useCallback((id: string) => {
    setQuittances(prev => prev.map(q => (
      q.id === id ? { ...q, statut: 'Relancée' as StatutQuittance } : q
    )))
  }, [])

  /**
   * Génère les quittances du mois indiqué pour tous les baux en cours
   * qui n'en ont pas déjà une. Retourne les nouvelles quittances créées.
   *
   * @param mois — format 'YYYY-MM'
   */
  const genererQuittancesDuMois = useCallback((mois: string): Quittance[] => {
    let created: Quittance[] = []
    setQuittances(prev => {
      const next = [...prev]
      let counter = 0
      const prefix = `Q-${mois}-`
      const max = prev
        .map(q => q.numero)
        .filter(n => n.startsWith(prefix))
        .map(n => parseInt(n.slice(prefix.length), 10))
        .filter(n => !isNaN(n))
        .reduce((acc, n) => Math.max(acc, n), 0)
      counter = max
      for (const bail of baux) {
        if (bail.statut !== 'En cours') continue
        // Vérifie que le bail couvre le mois
        const moisDebut = bail.dateDebut.slice(0, 7)
        if (mois < moisDebut) continue
        if (bail.dateFin && mois > bail.dateFin.slice(0, 7)) continue
        // Skip si quittance existe déjà
        if (prev.some(q => q.bailId === bail.id && q.mois === mois)) continue
        counter++
        const q: Quittance = {
          id: newId('q'),
          bailId: bail.id,
          mois,
          numero: `${prefix}${String(counter).padStart(3, '0')}`,
          loyerHC: bail.loyerMensuel,
          charges: bail.chargesMensuelles,
          total: bail.loyerMensuel + bail.chargesMensuelles,
          statut: 'Émise',
          emiseAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
        next.unshift(q)
        created.push(q)
      }
      return next
    })
    return created
  }, [baux])

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

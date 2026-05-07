'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Projet, FinancementProjet, ProjectionAnnuelle } from '@/lib/types'
import type { RatiosM14 } from '@/lib/ratios'
import { PROJETS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:projets:v1'

function load(): Projet[] {
  if (typeof window === 'undefined') return PROJETS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return PROJETS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PROJETS
  } catch {
    return PROJETS
  }
}

function persist(items: Projet[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function newId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function newFinId(): string {
  return `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function useProjets() {
  const [projets, setProjets] = useState<Projet[]>(PROJETS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProjets(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persist(projets)
  }, [projets, hydrated])

  const createProjet = useCallback((data: Omit<Projet, 'id' | 'createdAt'>): Projet => {
    const item: Projet = {
      ...data,
      id: newId(),
      createdAt: new Date().toISOString(),
      financements: data.financements.map(f => f.id ? f : { ...f, id: newFinId() }),
    }
    setProjets(prev => [item, ...prev])
    return item
  }, [])

  const updateProjet = useCallback((id: string, patch: Partial<Projet>) => {
    setProjets(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const deleteProjet = useCallback((id: string) => {
    setProjets(prev => prev.filter(p => p.id !== id))
  }, [])

  return {
    projets,
    hydrated,
    createProjet,
    updateProjet,
    deleteProjet,
  }
}

// ─── Calculs de projection ──────────────────────────────────────────

/**
 * Calcule l'annuité constante d'un emprunt.
 * Formule : A = K × i / (1 - (1+i)^-n) où K=capital, i=taux annuel, n=années.
 */
export function annuiteConstante(capital: number, tauxPct: number, dureeAnnees: number): number {
  if (dureeAnnees <= 0) return 0
  const i = tauxPct / 100
  if (i === 0) return capital / dureeAnnees
  return capital * i / (1 - Math.pow(1 + i, -dureeAnnees))
}

/**
 * Décompose une annuité en intérêts + capital pour une année donnée
 * (méthode amortissement constant des intérêts).
 */
export function decomposeAnnuite(capital: number, tauxPct: number, dureeAnnees: number, anneeNum: number): { interets: number; capital: number } {
  const i = tauxPct / 100
  const annuite = annuiteConstante(capital, tauxPct, dureeAnnees)
  // Capital restant dû en début d'année anneeNum (1-indexé)
  // CRD(k) = K × (1+i)^(k-1) - A × ((1+i)^(k-1) - 1) / i
  if (i === 0) {
    return { interets: 0, capital: capital / dureeAnnees }
  }
  const k = anneeNum
  const crdDebut = capital * Math.pow(1 + i, k - 1) - annuite * (Math.pow(1 + i, k - 1) - 1) / i
  const interets = Math.max(0, crdDebut * i)
  const capitalRembourse = Math.max(0, annuite - interets)
  return { interets, capital: capitalRembourse }
}

/**
 * Calcule la projection d'UN projet sur N années à partir d'une année de
 * référence et des ratios actuels (sans projet).
 *
 * @param projet le projet à simuler
 * @param baseRatios ratios M14 actuels (avant le projet, point de départ)
 * @param horizonAnnees nombre d'années à projeter (5 par défaut)
 * @param croissanceAnnuellePct évolution des recettes/dépenses courantes (ex: 1.5%)
 */
export function projeterProjet(
  projet: Projet,
  baseRatios: RatiosM14,
  horizonAnnees: number = 5,
  croissanceAnnuellePct: number = 1.5,
): ProjectionAnnuelle[] {
  const result: ProjectionAnnuelle[] = []
  const tauxFCTVA = (projet.tauxFCTVA ?? 16.404) / 100
  const coutHT = projet.coutHT ?? projet.coutTotal / 1.20  // approximation TVA 20% si pas fourni
  const fctvaTotal = coutHT * tauxFCTVA

  // Capital emprunté total (somme des emprunts)
  const empruntsActifs = projet.financements
    .filter(f => f.source === 'Emprunt')
    .map(f => ({ ...f, anneeContrat: f.anneeVersement ?? projet.anneeDebut }))

  // Encours dette de départ (de la commune avant projet)
  let encoursDetteCumul = baseRatios.encoursDette

  for (let i = 0; i < horizonAnnees; i++) {
    const annee = projet.anneeDebut + i

    // ─── Dépenses d'équipement de l'année ───
    let depEquipement = 0
    if (i < projet.anneesEtalement) {
      depEquipement = projet.coutTotal / projet.anneesEtalement
    }

    // ─── Recettes d'investissement de l'année ───
    let recettesInvest = 0
    let empruntEncaisse = 0
    let subventionsRecues = 0
    let fctvaRecu = 0

    projet.financements.forEach(f => {
      if (f.anneeVersement === annee) {
        if (f.source === 'Emprunt') {
          empruntEncaisse += f.montant
        } else if (f.source === 'FCTVA') {
          fctvaRecu += f.montant
        } else if (f.source === 'Autofinancement') {
          // L'autofin n'apparaît pas en recette d'invest, c'est une utilisation de la CAF
        } else {
          subventionsRecues += f.montant
        }
      }
    })
    recettesInvest = empruntEncaisse + subventionsRecues + fctvaRecu

    // ─── Impact sur la fonctionnement (intérêts + remb. capital) ───
    let interetsAnnee = 0
    let capitalAnnee = 0
    empruntsActifs.forEach(emp => {
      if (annee < emp.anneeContrat) return
      if (emp.dureeAnnees && annee >= emp.anneeContrat + emp.dureeAnnees) return
      const anneeNum = annee - emp.anneeContrat + 1
      const { interets, capital } = decomposeAnnuite(emp.montant, emp.tauxInteret ?? 3.5, emp.dureeAnnees ?? 15, anneeNum)
      interetsAnnee += interets
      capitalAnnee += capital
    })

    // ─── Mise à jour de l'encours dette ───
    encoursDetteCumul += empruntEncaisse - capitalAnnee

    // ─── Recettes/Dépenses projetées avec inflation ───
    const facteurCroissance = Math.pow(1 + croissanceAnnuellePct / 100, i)
    const rrf = baseRatios.rrf * facteurCroissance
    const drf = baseRatios.drf * facteurCroissance + interetsAnnee
    const cafBrute = rrf - drf
    const capaciteDesendettement = cafBrute > 0 ? Math.round((encoursDetteCumul / cafBrute) * 10) / 10 : 0
    const detteParHab = baseRatios.population > 0 ? Math.round(encoursDetteCumul / baseRatios.population) : 0
    const drfParHab = baseRatios.population > 0 ? Math.round(drf / baseRatios.population) : 0

    result.push({
      annee,
      depEquipement,
      recettesInvest,
      interetsDette: interetsAnnee,
      remboursementCapital: capitalAnnee,
      encoursDetteEndAnnee: encoursDetteCumul,
      rrf,
      drf,
      cafBrute,
      capaciteDesendettement,
      detteParHab,
      drfParHab,
    })
  }

  return result
}

/**
 * Combine plusieurs projets en une seule projection cumulée.
 */
export function combinerProjections(projections: ProjectionAnnuelle[][]): ProjectionAnnuelle[] {
  if (projections.length === 0) return []
  if (projections.length === 1) return projections[0]

  // On suppose que toutes les projections couvrent la même plage d'années
  const allAnnees = new Set<number>()
  projections.forEach(p => p.forEach(a => allAnnees.add(a.annee)))
  const anneesSorted = Array.from(allAnnees).sort((a, b) => a - b)

  return anneesSorted.map(annee => {
    const slices = projections
      .map(p => p.find(a => a.annee === annee))
      .filter((a): a is ProjectionAnnuelle => a !== undefined)
    return {
      annee,
      depEquipement: slices.reduce((acc, s) => acc + s.depEquipement, 0),
      recettesInvest: slices.reduce((acc, s) => acc + s.recettesInvest, 0),
      interetsDette: slices.reduce((acc, s) => acc + s.interetsDette, 0),
      remboursementCapital: slices.reduce((acc, s) => acc + s.remboursementCapital, 0),
      encoursDetteEndAnnee: slices.reduce((acc, s) => acc + s.encoursDetteEndAnnee, 0) - (slices.length - 1) * slices[0].encoursDetteEndAnnee + slices[0].encoursDetteEndAnnee,
      // Ratios : on prend la moyenne pondérée — pas parfait mais suffisant
      rrf: slices[0].rrf,  // RRF ne change pas avec les projets
      drf: slices[0].drf + slices.slice(1).reduce((acc, s) => acc + (s.interetsDette - slices[0].interetsDette), 0),
      cafBrute: slices[0].rrf - slices[0].drf,
      capaciteDesendettement: 0,  // recalculé après
      detteParHab: 0,
      drfParHab: 0,
    }
  })
}

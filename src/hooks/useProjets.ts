'use client'

// Hook gestion des projets d'investissement branché sur /api/projets.
// Pattern optimistic update + rollback. Les helpers de projection
// (annuiteConstante, projeterProjet, combinerProjections) restent
// purs et indépendants du stockage.

import { useEffect, useState, useCallback } from 'react'
import type { Projet, ProjectionAnnuelle } from '@/lib/types'
import type { RatiosM14 } from '@/lib/ratios'

export function useProjets() {
  const [projets, setProjets] = useState<Projet[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/projets')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Projet[]) => {
        if (!cancelled) {
          setProjets(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useProjets] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const createProjet = useCallback((data: Omit<Projet, 'id' | 'createdAt'>): Projet => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Projet = { ...data, id: tempId, createdAt: new Date().toISOString() }
    setProjets((prev) => [optimistic, ...prev])

    fetch('/api/projets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Projet) => {
        setProjets((prev) => prev.map((p) => (p.id === tempId ? created : p)))
      })
      .catch((e) => {
        console.error('[useProjets] create error:', e)
        setProjets((prev) => prev.filter((p) => p.id !== tempId))
        alert('Impossible de créer le projet.')
      })
    return optimistic
  }, [])

  const updateProjet = useCallback((id: string, patch: Partial<Projet>) => {
    let previous: Projet[] = []
    setProjets((prev) => { previous = prev; return prev.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

    fetch(`/api/projets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Projet) => {
        setProjets((prev) => prev.map((p) => (p.id === id ? updated : p)))
      })
      .catch((e) => {
        console.error('[useProjets] update error:', e)
        setProjets(previous)
        alert('Impossible de mettre à jour le projet.')
      })
  }, [])

  const deleteProjet = useCallback((id: string) => {
    let previous: Projet[] = []
    setProjets((prev) => { previous = prev; return prev.filter((p) => p.id !== id) })
    fetch(`/api/projets/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useProjets] delete error:', e)
        setProjets(previous)
        alert('Impossible de supprimer le projet.')
      })
  }, [])

  return { projets, hydrated, createProjet, updateProjet, deleteProjet }
}

// ─── Calculs de projection (inchangés, purs) ────────────────────────

export function annuiteConstante(capital: number, tauxPct: number, dureeAnnees: number): number {
  if (dureeAnnees <= 0) return 0
  const i = tauxPct / 100
  if (i === 0) return capital / dureeAnnees
  return capital * i / (1 - Math.pow(1 + i, -dureeAnnees))
}

export function decomposeAnnuite(capital: number, tauxPct: number, dureeAnnees: number, anneeNum: number): { interets: number; capital: number } {
  const i = tauxPct / 100
  const annuite = annuiteConstante(capital, tauxPct, dureeAnnees)
  if (i === 0) {
    return { interets: 0, capital: capital / dureeAnnees }
  }
  const k = anneeNum
  const crdDebut = capital * Math.pow(1 + i, k - 1) - annuite * (Math.pow(1 + i, k - 1) - 1) / i
  const interets = Math.max(0, crdDebut * i)
  const capitalRembourse = Math.max(0, annuite - interets)
  return { interets, capital: capitalRembourse }
}

export function projeterProjet(
  projet: Projet,
  baseRatios: RatiosM14,
  horizonAnnees: number = 5,
  croissanceAnnuellePct: number = 1.5,
): ProjectionAnnuelle[] {
  const result: ProjectionAnnuelle[] = []
  const tauxFCTVA = (projet.tauxFCTVA ?? 16.404) / 100
  const coutHT = projet.coutHT ?? projet.coutTotal / 1.20
  void tauxFCTVA
  void coutHT

  const empruntsActifs = projet.financements
    .filter((f) => f.source === 'Emprunt')
    .map((f) => ({ ...f, anneeContrat: f.anneeVersement ?? projet.anneeDebut }))

  let encoursDetteCumul = baseRatios.encoursDette

  for (let i = 0; i < horizonAnnees; i++) {
    const annee = projet.anneeDebut + i

    let depEquipement = 0
    if (i < projet.anneesEtalement) {
      depEquipement = projet.coutTotal / projet.anneesEtalement
    }

    let recettesInvest = 0
    let empruntEncaisse = 0
    let subventionsRecues = 0
    let fctvaRecu = 0

    projet.financements.forEach((f) => {
      if (f.anneeVersement === annee) {
        if (f.source === 'Emprunt') {
          empruntEncaisse += f.montant
        } else if (f.source === 'FCTVA') {
          fctvaRecu += f.montant
        } else if (f.source === 'Autofinancement') {
          // L'autofin n'apparaît pas en recette d'invest
        } else {
          subventionsRecues += f.montant
        }
      }
    })
    recettesInvest = empruntEncaisse + subventionsRecues + fctvaRecu

    let interetsAnnee = 0
    let capitalAnnee = 0
    empruntsActifs.forEach((emp) => {
      if (annee < emp.anneeContrat) return
      if (emp.dureeAnnees && annee >= emp.anneeContrat + emp.dureeAnnees) return
      const anneeNum = annee - emp.anneeContrat + 1
      const { interets, capital } = decomposeAnnuite(emp.montant, emp.tauxInteret ?? 3.5, emp.dureeAnnees ?? 15, anneeNum)
      interetsAnnee += interets
      capitalAnnee += capital
    })

    encoursDetteCumul += empruntEncaisse - capitalAnnee

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

export function combinerProjections(projections: ProjectionAnnuelle[][]): ProjectionAnnuelle[] {
  if (projections.length === 0) return []
  if (projections.length === 1) return projections[0]

  const allAnnees = new Set<number>()
  projections.forEach((p) => p.forEach((a) => allAnnees.add(a.annee)))
  const anneesSorted = Array.from(allAnnees).sort((a, b) => a - b)

  return anneesSorted.map((annee) => {
    const slices = projections
      .map((p) => p.find((a) => a.annee === annee))
      .filter((a): a is ProjectionAnnuelle => a !== undefined)
    return {
      annee,
      depEquipement: slices.reduce((acc, s) => acc + s.depEquipement, 0),
      recettesInvest: slices.reduce((acc, s) => acc + s.recettesInvest, 0),
      interetsDette: slices.reduce((acc, s) => acc + s.interetsDette, 0),
      remboursementCapital: slices.reduce((acc, s) => acc + s.remboursementCapital, 0),
      encoursDetteEndAnnee: slices.reduce((acc, s) => acc + s.encoursDetteEndAnnee, 0) - (slices.length - 1) * slices[0].encoursDetteEndAnnee + slices[0].encoursDetteEndAnnee,
      rrf: slices[0].rrf,
      drf: slices[0].drf + slices.slice(1).reduce((acc, s) => acc + (s.interetsDette - slices[0].interetsDette), 0),
      cafBrute: slices[0].rrf - slices[0].drf,
      capaciteDesendettement: 0,
      detteParHab: 0,
      drfParHab: 0,
    }
  })
}

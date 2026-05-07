'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Pointage, PointageType, ConfigHSup, EmployeeRecord } from '@/lib/types'
import { POINTAGES, DEFAULT_CONFIG_HSUP } from '@/lib/data'

const KEY_POINTAGES = 'ent-mairie:pointages:v1'
const KEY_CONFIG = 'ent-mairie:hsup-config:v1'

function loadPointages(): Pointage[] {
  if (typeof window === 'undefined') return POINTAGES
  try {
    const raw = window.localStorage.getItem(KEY_POINTAGES)
    if (!raw) return POINTAGES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : POINTAGES
  } catch {
    return POINTAGES
  }
}

function loadConfig(): ConfigHSup {
  if (typeof window === 'undefined') return DEFAULT_CONFIG_HSUP
  try {
    const raw = window.localStorage.getItem(KEY_CONFIG)
    if (!raw) return DEFAULT_CONFIG_HSUP
    return { ...DEFAULT_CONFIG_HSUP, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG_HSUP
  }
}

function persistPointages(items: Pointage[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY_POINTAGES, JSON.stringify(items)) } catch {}
}

function persistConfig(cfg: ConfigHSup) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY_CONFIG, JSON.stringify(cfg)) } catch {}
}

function newId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Helpers de date ────────────────────────────────────────────────

const dateOnly = (iso: string) => iso.slice(0, 10)

// Numéro de semaine ISO (lundi = 1ᵉʳ jour). Renvoie 'YYYY-Www'.
export function isoWeek(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Mois ISO 'YYYY-MM' à partir d'une date ISO.
const isoMonth = (iso: string) => iso.slice(0, 7)

// ─── Calcul du temps travaillé sur une journée ───────────────────────

/**
 * À partir d'une liste de pointages d'un agent sur une journée, calcule
 * le temps de travail effectif en minutes. Algorithme :
 * 1. On trie les pointages par timestamp.
 * 2. On parcourt et on accumule la durée entre `entree` et `sortie`,
 *    en soustrayant les périodes `pause-debut` → `pause-fin`.
 * 3. Si pas de pause badgée et que la journée fait > 6h, on retire la
 *    pause déjeuner forfaitaire (config.pauseDejeunerMinutes).
 *
 * Renvoie 0 si données incohérentes (ex: pas de paire entrée/sortie).
 */
export function computeMinutesWorked(
  pointagesDuJour: Pointage[],
  config: ConfigHSup,
): number {
  // Ne compter que les pointages validés ou non-manuels
  const valid = pointagesDuJour.filter(p =>
    !p.manuel || p.validationStatut === 'Approuvée'
  )
  const sorted = [...valid].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  if (sorted.length === 0) return 0

  let total = 0
  let lastEntree: Date | null = null
  let lastPauseDebut: Date | null = null
  let pauseAccumuleeMs = 0
  let pauseBadgee = false

  for (const p of sorted) {
    const t = new Date(p.timestamp)
    if (p.type === 'entree' && !lastEntree) {
      lastEntree = t
    } else if (p.type === 'pause-debut' && lastEntree && !lastPauseDebut) {
      lastPauseDebut = t
      pauseBadgee = true
    } else if (p.type === 'pause-fin' && lastPauseDebut) {
      pauseAccumuleeMs += (+t - +lastPauseDebut)
      lastPauseDebut = null
    } else if (p.type === 'sortie' && lastEntree) {
      total += (+t - +lastEntree) - pauseAccumuleeMs
      lastEntree = null
      lastPauseDebut = null
      pauseAccumuleeMs = 0
    }
  }

  // Si toujours pas sorti et pas badgé : durée 0 (en cours, pas terminée)
  if (lastEntree) return 0

  let totalMinutes = Math.max(0, Math.round(total / 60000))

  // Pause forfaitaire si pas de pause badgée et journée > 6 h
  if (!pauseBadgee && totalMinutes > 360) {
    totalMinutes = Math.max(0, totalMinutes - config.pauseDejeunerMinutes)
  }
  return totalMinutes
}

// ─── Hook ──────────────────────────────────────────────────────────

export interface NewPointageInput {
  personId: string
  type: PointageType
  timestamp: string
  manuel?: boolean
  motif?: string
  createdById: string
}

export function usePointages() {
  const [pointages, setPointages] = useState<Pointage[]>(POINTAGES)
  const [config, setConfig] = useState<ConfigHSup>(DEFAULT_CONFIG_HSUP)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPointages(loadPointages())
    setConfig(loadConfig())
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) persistPointages(pointages) }, [pointages, hydrated])
  useEffect(() => { if (hydrated) persistConfig(config) }, [config, hydrated])

  // ─── CRUD ──────────────────────────────────────────────────────

  const badger = useCallback((personId: string, type: PointageType): Pointage => {
    const item: Pointage = {
      id: newId(),
      personId,
      type,
      timestamp: new Date().toISOString(),
      manuel: false,
      createdAt: new Date().toISOString(),
      createdById: personId,
    }
    setPointages(prev => [item, ...prev])
    return item
  }, [])

  const ajouterManuel = useCallback((data: NewPointageInput): Pointage => {
    const item: Pointage = {
      id: newId(),
      personId: data.personId,
      type: data.type,
      timestamp: data.timestamp,
      manuel: true,
      motif: data.motif,
      validationStatut: 'En attente',
      createdAt: new Date().toISOString(),
      createdById: data.createdById,
    }
    setPointages(prev => [item, ...prev])
    return item
  }, [])

  const validerPointage = useCallback((id: string, validateurId: string) => {
    setPointages(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            validationStatut: 'Approuvée',
            validateurId,
            validatedAt: new Date().toISOString(),
            validationMotif: undefined,
          }
        : p,
    ))
  }, [])

  const refuserPointage = useCallback((id: string, validateurId: string, motif: string) => {
    setPointages(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            validationStatut: 'Refusée',
            validateurId,
            validatedAt: new Date().toISOString(),
            validationMotif: motif,
          }
        : p,
    ))
  }, [])

  const supprimerPointage = useCallback((id: string) => {
    setPointages(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateConfig = useCallback((patch: Partial<ConfigHSup>) => {
    setConfig(prev => ({ ...prev, ...patch }))
  }, [])

  // ─── Calculs ───────────────────────────────────────────────────

  // Pointages d'une personne sur une période
  const byPerson = useCallback((personId: string) =>
    pointages.filter(p => p.personId === personId),
  [pointages])

  // Pointages d'un jour donné pour une personne
  const byPersonDay = useCallback((personId: string, dateIso: string) =>
    pointages.filter(p => p.personId === personId && dateOnly(p.timestamp) === dateIso),
  [pointages])

  // Minutes travaillées par jour pour une personne. Renvoie un Map<dateIso, minutes>.
  const minutesByDay = useCallback((personId: string): Map<string, number> => {
    const result = new Map<string, number>()
    const personPoints = pointages.filter(p => p.personId === personId)
    const days = new Set(personPoints.map(p => dateOnly(p.timestamp)))
    days.forEach(day => {
      const dayPoints = personPoints.filter(p => dateOnly(p.timestamp) === day)
      result.set(day, computeMinutesWorked(dayPoints, config))
    })
    return result
  }, [pointages, config])

  // Heures supplémentaires hebdomadaires pour une personne sur une semaine ISO.
  // Hsup = travaillé - heures contractuelles hebdo (selon EmployeeRecord).
  const hSupHebdo = useCallback((personId: string, week: string, employee?: EmployeeRecord): number => {
    const minutes = minutesByDay(personId)
    let totalMin = 0
    Array.from(minutes.entries()).forEach(([day, min]) => {
      if (isoWeek(day) === week) totalMin += min
    })
    const totalH = totalMin / 60
    const ref = employee ? employee.tempsTravailHeures : config.heuresHebdoReference
    return Math.max(0, Math.round((totalH - ref) * 4) / 4) // arrondi au quart d'heure
  }, [minutesByDay, config])

  // HSup mensuel cumulé (somme des HSup hebdo pour les semaines qui touchent ce mois)
  const hSupMensuel = useCallback((personId: string, month: string, employee?: EmployeeRecord): number => {
    const minutes = minutesByDay(personId)
    const weeks = new Set<string>()
    Array.from(minutes.keys()).forEach(d => {
      if (isoMonth(d) === month) weeks.add(isoWeek(d))
    })
    let total = 0
    weeks.forEach(w => { total += hSupHebdo(personId, w, employee) })
    return Math.round(total * 4) / 4
  }, [minutesByDay, hSupHebdo])

  // Total des heures travaillées sur une période
  const heuresTotalSemaine = useCallback((personId: string, week: string): number => {
    const minutes = minutesByDay(personId)
    let totalMin = 0
    Array.from(minutes.entries()).forEach(([day, min]) => {
      if (isoWeek(day) === week) totalMin += min
    })
    return Math.round((totalMin / 60) * 4) / 4
  }, [minutesByDay])

  // Statut courant : "Présent" si une entrée n'a pas encore été suivie d'une sortie aujourd'hui.
  const isPresentNow = useCallback((personId: string): boolean => {
    const today = new Date().toISOString().slice(0, 10)
    const pts = byPersonDay(personId, today)
      .filter(p => !p.manuel || p.validationStatut === 'Approuvée')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    if (pts.length === 0) return false
    const last = pts[pts.length - 1]
    return last.type === 'entree' || last.type === 'pause-fin'
  }, [byPersonDay])

  // Pointages en attente de validation (saisies manuelles non décidées)
  const enAttenteValidation = useMemo(
    () => pointages.filter(p => p.manuel && p.validationStatut === 'En attente'),
    [pointages],
  )

  return {
    pointages,
    config,
    hydrated,
    enAttenteValidation,

    badger,
    ajouterManuel,
    validerPointage,
    refuserPointage,
    supprimerPointage,
    updateConfig,

    byPerson,
    byPersonDay,
    minutesByDay,
    heuresTotalSemaine,
    hSupHebdo,
    hSupMensuel,
    isPresentNow,
  }
}

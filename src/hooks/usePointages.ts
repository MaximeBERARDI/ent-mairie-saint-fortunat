'use client'

// Hook gestion des pointages branché sur /api/pointages.
// La config HSup reste en localStorage (préférence locale).
// Tous les helpers de calcul (computeMinutesWorked, hSupHebdo, etc.)
// sont conservés tels quels — ils opèrent sur l'état local.

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Pointage, PointageType, ConfigHSup, EmployeeRecord } from '@/lib/types'
import { DEFAULT_CONFIG_HSUP } from '@/lib/data'

const KEY_CONFIG = 'ent-mairie:hsup-config:v1'

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

function persistConfig(cfg: ConfigHSup) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY_CONFIG, JSON.stringify(cfg)) } catch {}
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

const isoMonth = (iso: string) => iso.slice(0, 7)

// ─── Calcul du temps travaillé sur une journée ───────────────────────

export function computeMinutesWorked(
  pointagesDuJour: Pointage[],
  config: ConfigHSup,
): number {
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

  if (lastEntree) return 0

  let totalMinutes = Math.max(0, Math.round(total / 60000))

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
  const [pointages, setPointages] = useState<Pointage[]>([])
  const [config, setConfig] = useState<ConfigHSup>(DEFAULT_CONFIG_HSUP)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(loadConfig())
    let cancelled = false
    fetch('/api/pointages')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Pointage[]) => {
        if (!cancelled) {
          setPointages(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[usePointages] load error:', e)
          setHydrated(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { if (hydrated) persistConfig(config) }, [config, hydrated])

  // ─── CRUD ──────────────────────────────────────────────────────

  const badger = useCallback((personId: string, type: PointageType): Pointage => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Pointage = {
      id: tempId,
      personId,
      type,
      timestamp: now,
      manuel: false,
      createdAt: now,
      createdById: personId,
    }
    setPointages((prev) => [optimistic, ...prev])

    fetch('/api/pointages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, type, timestamp: now, manuel: false }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Pointage) => {
        setPointages((prev) => prev.map((p) => (p.id === tempId ? created : p)))
      })
      .catch((e) => {
        console.error('[usePointages] badger error:', e)
        setPointages((prev) => prev.filter((p) => p.id !== tempId))
        alert('Impossible de badger.')
      })
    return optimistic
  }, [])

  const ajouterManuel = useCallback((data: NewPointageInput): Pointage => {
    const tempId = `tmp-${Date.now()}`
    const optimistic: Pointage = {
      id: tempId,
      personId: data.personId,
      type: data.type,
      timestamp: data.timestamp,
      manuel: true,
      motif: data.motif,
      validationStatut: 'En attente',
      createdAt: new Date().toISOString(),
      createdById: data.createdById,
    }
    setPointages((prev) => [optimistic, ...prev])

    fetch('/api/pointages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId: data.personId,
        type: data.type,
        timestamp: data.timestamp,
        manuel: true,
        motif: data.motif,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Pointage) => {
        setPointages((prev) => prev.map((p) => (p.id === tempId ? created : p)))
      })
      .catch((e) => {
        console.error('[usePointages] ajouterManuel error:', e)
        setPointages((prev) => prev.filter((p) => p.id !== tempId))
        alert("Impossible d'ajouter le pointage manuel.")
      })
    return optimistic
  }, [])

  const patchAction = useCallback((id: string, body: Record<string, unknown>, errorMsg: string) => {
    const previous = pointages
    fetch(`/api/pointages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Pointage) => {
        setPointages((prev) => prev.map((p) => (p.id === id ? updated : p)))
      })
      .catch((e) => {
        console.error('[usePointages] patch error:', e)
        setPointages(previous)
        alert(errorMsg)
      })
  }, [pointages])

  const validerPointage = useCallback((id: string, _validateurId: string) => {
    void _validateurId
    setPointages((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, validationStatut: 'Approuvée', validatedAt: new Date().toISOString(), validationMotif: undefined }
        : p,
    ))
    patchAction(id, { action: 'validate' }, 'Impossible de valider le pointage.')
  }, [patchAction])

  const refuserPointage = useCallback((id: string, _validateurId: string, motif: string) => {
    void _validateurId
    setPointages((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, validationStatut: 'Refusée', validatedAt: new Date().toISOString(), validationMotif: motif }
        : p,
    ))
    patchAction(id, { action: 'refuse', validationMotif: motif }, 'Impossible de refuser le pointage.')
  }, [patchAction])

  const supprimerPointage = useCallback((id: string) => {
    let previous: Pointage[] = []
    setPointages((prev) => {
      previous = prev
      return prev.filter((p) => p.id !== id)
    })

    fetch(`/api/pointages/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[usePointages] delete error:', e)
        setPointages(previous)
        alert('Impossible de supprimer le pointage.')
      })
  }, [])

  const updateConfig = useCallback((patch: Partial<ConfigHSup>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  // ─── Calculs (inchangés) ───────────────────────────────────────

  const byPerson = useCallback((personId: string) =>
    pointages.filter(p => p.personId === personId),
  [pointages])

  const byPersonDay = useCallback((personId: string, dateIso: string) =>
    pointages.filter(p => p.personId === personId && dateOnly(p.timestamp) === dateIso),
  [pointages])

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

  const hSupHebdo = useCallback((personId: string, week: string, employee?: EmployeeRecord): number => {
    const minutes = minutesByDay(personId)
    let totalMin = 0
    Array.from(minutes.entries()).forEach(([day, min]) => {
      if (isoWeek(day) === week) totalMin += min
    })
    const totalH = totalMin / 60
    const ref = employee ? employee.tempsTravailHeures : config.heuresHebdoReference
    return Math.max(0, Math.round((totalH - ref) * 4) / 4)
  }, [minutesByDay, config])

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

  const heuresTotalSemaine = useCallback((personId: string, week: string): number => {
    const minutes = minutesByDay(personId)
    let totalMin = 0
    Array.from(minutes.entries()).forEach(([day, min]) => {
      if (isoWeek(day) === week) totalMin += min
    })
    return Math.round((totalMin / 60) * 4) / 4
  }, [minutesByDay])

  const isPresentNow = useCallback((personId: string): boolean => {
    const today = new Date().toISOString().slice(0, 10)
    const pts = byPersonDay(personId, today)
      .filter(p => !p.manuel || p.validationStatut === 'Approuvée')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    if (pts.length === 0) return false
    const last = pts[pts.length - 1]
    return last.type === 'entree' || last.type === 'pause-fin'
  }, [byPersonDay])

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

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { LeaveRequest, LeaveType, EmployeeRecord, TaskDocument } from '@/lib/types'
import { LEAVE_REQUESTS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:leaves:v1'

function loadFromStorage(): LeaveRequest[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveToStorage(items: LeaveRequest[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

// Compte les jours ouvrés (lundi-vendredi) entre deux dates incluses.
// Ne tient pas compte des jours fériés (simple pour un MVP).
export function countOuvres(dateDebut: string, dateFin: string): number {
  const start = new Date(dateDebut + 'T00:00:00')
  const end = new Date(dateFin + 'T00:00:00')
  if (end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// Vrai si la date du jour est dans la plage [debut, fin] (inclus).
export function isDateInRange(target: string, debut: string, fin: string): boolean {
  return target >= debut && target <= fin
}

export interface NewLeaveInput {
  personId: string
  type: LeaveType
  dateDebut: string
  dateFin: string
  motif?: string
  documents?: TaskDocument[]
}

export function useLeaveRequests(opts?: {
  // Callback invoqué quand une demande est approuvée → à utiliser pour
  // décrémenter les compteurs côté EmployeeRecord.
  onApprove?: (leave: LeaveRequest) => void
  // Callback inverse pour ré-incrémenter quand on rouvre une demande.
  onUnapprove?: (leave: LeaveRequest) => void
}) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(LEAVE_REQUESTS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) setLeaves(stored)
    else saveToStorage(LEAVE_REQUESTS)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(leaves)
  }, [leaves, hydrated])

  const submitLeave = useCallback((data: NewLeaveInput): LeaveRequest => {
    const now = new Date().toISOString()
    const leave: LeaveRequest = {
      ...data,
      id: `lr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      nbJoursOuvres: countOuvres(data.dateDebut, data.dateFin),
      statut: 'En attente',
      submittedAt: now,
      createdAt: now,
    }
    setLeaves(prev => [leave, ...prev])
    return leave
  }, [])

  const approveLeave = useCallback((id: string, decidedById: string) => {
    setLeaves(prev => {
      const updated = prev.map(l => {
        if (l.id !== id) return l
        const next: LeaveRequest = {
          ...l,
          statut: 'Approuvée',
          decidedById,
          decidedAt: new Date().toISOString(),
          decisionMotif: undefined,
        }
        // Hook externe : décrémenter les compteurs
        opts?.onApprove?.(next)
        return next
      })
      return updated
    })
  }, [opts])

  const rejectLeave = useCallback((id: string, decidedById: string, motif: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l
      return {
        ...l,
        statut: 'Refusée',
        decidedById,
        decidedAt: new Date().toISOString(),
        decisionMotif: motif,
      }
    }))
  }, [])

  // Annule la décision sans supprimer la demande (retour en attente).
  const reopenLeave = useCallback((id: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l
      // Si elle était approuvée, on rebascule les compteurs
      if (l.statut === 'Approuvée') opts?.onUnapprove?.(l)
      const { decidedById: _v, decidedAt: _va, decisionMotif: _r, ...rest } = l
      void _v; void _va; void _r
      return { ...rest, statut: 'En attente' }
    }))
  }, [opts])

  const deleteLeave = useCallback((id: string) => {
    setLeaves(prev => {
      const target = prev.find(l => l.id === id)
      if (target?.statut === 'Approuvée') opts?.onUnapprove?.(target)
      return prev.filter(l => l.id !== id)
    })
  }, [opts])

  // Filtres pratiques
  const byPerson = useCallback((personId: string) => {
    return leaves.filter(l => l.personId === personId)
  }, [leaves])

  // Personnes en absence aujourd'hui (parmi celles avec leave Approuvée).
  const absentToday = useCallback((): { personId: string; leave: LeaveRequest }[] => {
    const today = new Date().toISOString().slice(0, 10)
    return leaves
      .filter(l => l.statut === 'Approuvée' && isDateInRange(today, l.dateDebut, l.dateFin))
      .map(l => ({ personId: l.personId, leave: l }))
  }, [leaves])

  return {
    leaves,
    hydrated,
    submitLeave,
    approveLeave,
    rejectLeave,
    reopenLeave,
    deleteLeave,
    byPerson,
    absentToday,
  }
}

// Helper externe : applique l'effet d'une approbation sur un EmployeeRecord.
// Retourne le record modifié (pas de mutation).
export function applyLeaveOnEmployee(
  employee: EmployeeRecord,
  leave: LeaveRequest,
  sign: 1 | -1,
): EmployeeRecord {
  const j = leave.nbJoursOuvres * sign
  switch (leave.type) {
    case 'Congés annuels':
      return { ...employee, congesAnnuelsPris: Math.max(0, employee.congesAnnuelsPris + j) }
    case 'RTT':
      return { ...employee, rttPris: Math.max(0, employee.rttPris + j) }
    case 'Maladie':
      return { ...employee, joursMaladie: Math.max(0, employee.joursMaladie + j) }
    default:
      return employee
  }
}

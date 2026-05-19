'use client'

// Hook gestion des demandes de congés branché sur /api/leaves.
// Le serveur gère l'impact sur les compteurs EmployeeRecord (transac
// Prisma), donc les callbacks onApprove/onUnapprove ne sont plus
// utilisés en production — gardés en signature pour rétrocompat.

import { useEffect, useState, useCallback } from 'react'
import type { LeaveRequest, LeaveType, EmployeeRecord, TaskDocument } from '@/lib/types'

// Compte les jours ouvrés (lundi-vendredi) entre deux dates incluses.
// Garde la même implémentation côté client pour l'affichage immédiat.
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

export function useLeaveRequests(_opts?: {
  onApprove?: (leave: LeaveRequest) => void
  onUnapprove?: (leave: LeaveRequest) => void
}) {
  void _opts // gardés en signature, plus utilisés
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/leaves')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: LeaveRequest[]) => {
        if (!cancelled) {
          setLeaves(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useLeaveRequests] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const submitLeave = useCallback((data: NewLeaveInput): LeaveRequest => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: LeaveRequest = {
      ...data,
      id: tempId,
      nbJoursOuvres: countOuvres(data.dateDebut, data.dateFin),
      statut: 'En attente',
      submittedAt: now,
      createdAt: now,
      documents: data.documents ?? [],
    }
    setLeaves((prev) => [optimistic, ...prev])

    fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: LeaveRequest) => {
        setLeaves((prev) => prev.map((l) => (l.id === tempId ? created : l)))
      })
      .catch((e) => {
        console.error('[useLeaveRequests] submit error:', e)
        setLeaves((prev) => prev.filter((l) => l.id !== tempId))
        alert('Impossible de soumettre la demande.')
      })
    return optimistic
  }, [])

  // Helper pour PATCH avec action workflow
  const patchAction = useCallback(
    (id: string, body: Record<string, unknown>, errorMsg: string) => {
      const previousLeaves = leaves
      fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((updated: LeaveRequest) => {
          setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)))
        })
        .catch((e) => {
          console.error('[useLeaveRequests] patch error:', e)
          setLeaves(previousLeaves)
          alert(errorMsg)
        })
    },
    [leaves],
  )

  const approveLeave = useCallback(
    (id: string, _decidedById: string) => {
      void _decidedById
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, statut: 'Approuvée', decidedAt: new Date().toISOString() } : l,
        ),
      )
      patchAction(id, { action: 'approve' }, "Impossible d'approuver la demande.")
    },
    [patchAction],
  )

  const rejectLeave = useCallback(
    (id: string, _decidedById: string, motif: string) => {
      void _decidedById
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                statut: 'Refusée',
                decidedAt: new Date().toISOString(),
                decisionMotif: motif,
              }
            : l,
        ),
      )
      patchAction(id, { action: 'reject', decisionMotif: motif }, 'Impossible de refuser la demande.')
    },
    [patchAction],
  )

  const reopenLeave = useCallback(
    (id: string) => {
      setLeaves((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l
          const { decidedById: _v, decidedAt: _va, decisionMotif: _r, ...rest } = l
          void _v; void _va; void _r
          return { ...rest, statut: 'En attente' }
        }),
      )
      patchAction(id, { action: 'reopen' }, 'Impossible de réouvrir la demande.')
    },
    [patchAction],
  )

  const deleteLeave = useCallback((id: string) => {
    let previous: LeaveRequest[] = []
    setLeaves((prev) => {
      previous = prev
      return prev.filter((l) => l.id !== id)
    })

    fetch(`/api/leaves/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useLeaveRequests] delete error:', e)
        setLeaves(previous)
        alert('Impossible de supprimer la demande.')
      })
  }, [])

  const byPerson = useCallback(
    (personId: string) => leaves.filter((l) => l.personId === personId),
    [leaves],
  )

  const absentToday = useCallback((): { personId: string; leave: LeaveRequest }[] => {
    const today = new Date().toISOString().slice(0, 10)
    return leaves
      .filter((l) => l.statut === 'Approuvée' && isDateInRange(today, l.dateDebut, l.dateFin))
      .map((l) => ({ personId: l.personId, leave: l }))
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

// Helper externe conservé pour rétrocompat (le serveur fait maintenant
// ce calcul lui-même via les transactions Prisma).
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

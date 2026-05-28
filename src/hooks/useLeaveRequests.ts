'use client'

// Hook gestion des demandes de congés branché sur /api/leaves.
// Le serveur gère l'impact sur les compteurs EmployeeRecord (transac
// Prisma), donc les callbacks onApprove/onUnapprove ne sont plus
// utilisés en production — gardés en signature pour rétrocompat.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { LeaveRequest, LeaveType, EmployeeRecord, TaskDocument } from '@/lib/types'

const KEY = '/api/leaves'

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
  const { data, mutate } = useSWR<LeaveRequest[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const leaves = data ?? []
  const hydrated = data !== undefined

  const submitLeave = useCallback((dataInput: NewLeaveInput): LeaveRequest => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: LeaveRequest = {
      ...dataInput,
      id: tempId,
      nbJoursOuvres: countOuvres(dataInput.dateDebut, dataInput.dateFin),
      statut: 'En attente',
      submittedAt: now,
      createdAt: now,
      documents: dataInput.documents ?? [],
    }
    const previous = leaves
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataInput),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: LeaveRequest) => {
        mutate((prev) => (prev ?? []).map((l) => (l.id === tempId ? created : l)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useLeaveRequests] submit error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de soumettre la demande.')
      })
    return optimistic
  }, [leaves, mutate])

  // Helper pour PATCH avec action workflow. Le serveur recalcule aussi les
  // compteurs de l'EmployeeRecord — on demande une revalidation de
  // /api/employees pour garder le state RH cohérent.
  const patchAction = useCallback(
    (id: string, body: Record<string, unknown>, errorMsg: string) => {
      const previous = leaves
      fetch(`${KEY}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((updated: LeaveRequest) => {
          mutate((prev) => (prev ?? []).map((l) => (l.id === id ? updated : l)), { revalidate: false })
        })
        .catch((e) => {
          console.error('[useLeaveRequests] patch error:', e)
          mutate(previous, { revalidate: false })
          alert(errorMsg)
        })
    },
    [leaves, mutate],
  )

  const approveLeave = useCallback(
    (id: string, _decidedById: string) => {
      void _decidedById
      const previous = leaves
      mutate(
        previous.map((l) =>
          l.id === id ? { ...l, statut: 'Approuvée', decidedAt: new Date().toISOString() } : l,
        ),
        { revalidate: false },
      )
      patchAction(id, { action: 'approve' }, "Impossible d'approuver la demande.")
    },
    [leaves, mutate, patchAction],
  )

  const rejectLeave = useCallback(
    (id: string, _decidedById: string, motif: string) => {
      void _decidedById
      const previous = leaves
      mutate(
        previous.map((l) =>
          l.id === id
            ? { ...l, statut: 'Refusée', decidedAt: new Date().toISOString(), decisionMotif: motif }
            : l,
        ),
        { revalidate: false },
      )
      patchAction(id, { action: 'reject', decisionMotif: motif }, 'Impossible de refuser la demande.')
    },
    [leaves, mutate, patchAction],
  )

  const reopenLeave = useCallback(
    (id: string) => {
      const previous = leaves
      mutate(
        previous.map((l) => {
          if (l.id !== id) return l
          const { decidedById: _v, decidedAt: _va, decisionMotif: _r, ...rest } = l
          void _v; void _va; void _r
          return { ...rest, statut: 'En attente' }
        }),
        { revalidate: false },
      )
      patchAction(id, { action: 'reopen' }, 'Impossible de réouvrir la demande.')
    },
    [leaves, mutate, patchAction],
  )

  const deleteLeave = useCallback((id: string) => {
    const previous = leaves
    mutate(previous.filter((l) => l.id !== id), { revalidate: false })

    fetch(`${KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useLeaveRequests] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la demande.')
      })
  }, [leaves, mutate])

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

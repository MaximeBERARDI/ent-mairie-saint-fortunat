'use client'

// Actions rapides de l'agent (pointage entrée/sortie, poser un congé,
// créer une tâche, soumettre une facture). Affiché pour tout agent
// (role === 'agent'), quelle que soit la vue dashboard — y compris un
// agent signataire/responsable qui obtient la vue Pilotage.

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { COLORS as C } from '@/lib/theme'
import { hasPermission } from '@/lib/permissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePointages } from '@/hooks/usePointages'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useEmployees } from '@/hooks/useEmployees'
import { TaskForm } from '@/components/tasks/TaskForm'
import { LeaveRequestModal } from '@/components/rh/LeaveRequestModal'
import type { Task } from '@/lib/types'

const PT_TYPE_LABEL: Record<string, string> = {
  entree: 'entrée', sortie: 'sortie', 'pause-debut': 'pause', 'pause-fin': 'reprise',
}

export function AgentQuickActions({ currentUserId, createTask }: {
  currentUserId: string
  createTask: (data: Omit<Task, 'id' | 'createdAt'>) => Task
}) {
  const { currentUser: me } = useCurrentUser()
  const { badger, byPersonDay, isPresentNow } = usePointages()
  const { submitLeave } = useLeaveRequests()
  const { findByPersonId } = useEmployees()
  const myRecord = findByPersonId(currentUserId)
  const [taskOpen, setTaskOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const canSubmitFacture = me?.role !== 'agent' || hasPermission(me.authLevel, 'finance.view-all', me.customPermissions)

  // Pointage : état du jour (dernier badge) → bouton entrée/sortie.
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayPts = byPersonDay(currentUserId, todayIso)
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const lastPt = todayPts[todayPts.length - 1] ?? null
  const present = isPresentNow(currentUserId)
  const fmtHM = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const pointageStatus = lastPt
    ? `Dernier pointage : ${PT_TYPE_LABEL[lastPt.type] ?? lastPt.type} à ${fmtHM(lastPt.timestamp)}`
    : "Pas encore pointé aujourd'hui"

  return (
    <>
      <Card padding={14}>
        <SectionHeader title="Actions rapides" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Button variant="primary" style={{ width: '100%' }} onClick={() => badger(currentUserId, present ? 'sortie' : 'entree')}>
            {present ? '⏱ Pointer la sortie' : "⏱ Pointer l'entrée"}
          </Button>
          <p style={{ fontSize: 11, color: C.subtle, margin: '-2px 0 4px' }}>{pointageStatus}</p>
          <Button style={{ width: '100%' }} onClick={() => setTaskOpen(true)}>+ Créer une tâche</Button>
          <Button style={{ width: '100%' }} onClick={() => setLeaveOpen(true)}>Poser un congé</Button>
          {canSubmitFacture && (
            <Link href="/finances"><Button style={{ width: '100%' }}>Soumettre une facture</Button></Link>
          )}
        </div>
      </Card>

      <TaskForm
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onSubmit={(data) => createTask(data)}
        title="Nouvelle tâche"
      />
      <LeaveRequestModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        personId={currentUserId}
        record={myRecord}
        onSubmit={submitLeave}
      />
    </>
  )
}

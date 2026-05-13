'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COLORS as C } from '@/lib/theme'
import { useTasks } from '@/hooks/useTasks'
import { useFactures } from '@/hooks/useFactures'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useEmployees } from '@/hooks/useEmployees'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useSubventions } from '@/hooks/useSubventions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePointages } from '@/hooks/usePointages'

interface Notif {
  id: string
  icon: string
  text: string
  sub: string
  href: string
  severity: 'info' | 'warning' | 'danger'
}

function fmtDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { currentUserId, currentUser, can } = useCurrentUser()
  const { tasks } = useTasks()
  const { factures } = useFactures()
  const { leaves } = useLeaveRequests()
  const { records } = useEmployees()
  const { quittances, baux } = useParcImmobilier()
  const { subventions } = useSubventions()
  const { enAttenteValidation: pointagesEnAttente } = usePointages()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const notifs = useMemo<Notif[]>(() => {
    const out: Notif[] = []
    const today = new Date().toISOString().slice(0, 10)

    // 1. Mes tâches en attente de validation par moi
    const myTasksToValidate = tasks.filter(t => t.validatorId === currentUserId && t.status === 'En attente validation')
    myTasksToValidate.slice(0, 3).forEach(t => {
      out.push({
        id: `task-val-${t.id}`,
        icon: '📋',
        text: 'Tâche à valider',
        sub: t.label,
        href: '/taches',
        severity: 'warning',
      })
    })

    // 2. Mes tâches en retard
    const myOverdue = tasks.filter(t => {
      if (t.assigneeId !== currentUserId || t.status === 'Terminé') return false
      if (!t.dueDate) return false
      return t.dueDate < today
    })
    myOverdue.slice(0, 3).forEach(t => {
      out.push({
        id: `task-late-${t.id}`,
        icon: '⏰',
        text: `Tâche en retard depuis ${fmtDate(t.dueDate)}`,
        sub: t.label,
        href: '/taches',
        severity: 'danger',
      })
    })

    // 3. Factures à valider (si ayant droit)
    if (can('finance.validate-invoices')) {
      const facturesAValider = factures.filter(f => f.statut === 'En attente validation')
      if (facturesAValider.length > 0) {
        const montantTotal = facturesAValider.reduce((acc, f) => acc + f.montantTTC, 0)
        out.push({
          id: 'factures-valid',
          icon: '💶',
          text: `${facturesAValider.length} facture${facturesAValider.length > 1 ? 's' : ''} à valider`,
          sub: `Total ${Math.round(montantTotal)} €`,
          href: '/finances',
          severity: 'warning',
        })
      }
    }

    // 4. Demandes de congés à valider
    if (can('hr.validate-leaves')) {
      const leavesAValider = leaves.filter(l => l.statut === 'En attente')
      if (leavesAValider.length > 0) {
        out.push({
          id: 'leaves-valid',
          icon: '🏝',
          text: `${leavesAValider.length} demande${leavesAValider.length > 1 ? 's' : ''} de congés`,
          sub: 'en attente de validation',
          href: '/rh',
          severity: 'warning',
        })
      }
    }

    // 5. Pointages manuels en attente
    if (currentUser?.role === 'maire' || (currentUser?.responsibleCommissions ?? []).includes('admin-finance') || can('hr.validate-leaves')) {
      if (pointagesEnAttente.length > 0) {
        out.push({
          id: 'pointages-valid',
          icon: '⏱',
          text: `${pointagesEnAttente.length} pointage${pointagesEnAttente.length > 1 ? 's' : ''} à valider`,
          sub: 'saisies manuelles d\'agents',
          href: '/rh',
          severity: 'info',
        })
      }
    }

    // 6. Contrats à renouveler dans les 90 jours
    if (can('hr.view-all') || can('hr.manage')) {
      const horizon = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      const aReno = records.filter(r => r.dateFinContrat && r.dateFinContrat <= horizon)
      aReno.forEach(r => {
        out.push({
          id: `contrat-${r.personId}`,
          icon: '📄',
          text: 'Contrat à renouveler',
          sub: `${r.numAgent} · fin ${fmtDate(r.dateFinContrat!)}`,
          href: '/rh',
          severity: 'danger',
        })
      })
    }

    // 7. Loyers impayés
    if (can('finance.view-all')) {
      const impayes = quittances.filter(q => q.statut === 'Impayée' || q.statut === 'Relancée')
      impayes.slice(0, 3).forEach(q => {
        const bail = baux.find(b => b.id === q.bailId)
        out.push({
          id: `impaye-${q.id}`,
          icon: '🔔',
          text: `Loyer impayé ${q.numero}`,
          sub: `${Math.round(q.total)} € · ${q.mois}`,
          href: '/finances',
          severity: 'danger',
        })
      })
    }

    // 8. Subventions accordées en attente de versement
    if (can('finance.view-all')) {
      const accordees = subventions.filter(s => s.statut === 'Accordée')
      accordees.slice(0, 2).forEach(s => {
        out.push({
          id: `sub-versement-${s.id}`,
          icon: '🎫',
          text: `Subvention en attente versement`,
          sub: `${s.reference} · ${Math.round(s.montantAccorde ?? 0)} € accordés`,
          href: '/finances',
          severity: 'info',
        })
      })
    }

    return out
  }, [tasks, factures, leaves, records, quittances, baux, subventions, pointagesEnAttente, currentUserId, currentUser, can])

  const count = notifs.length

  const severityColor = (s: Notif['severity']) =>
    s === 'danger' ? C.danger : s === 'warning' ? C.warning : C.info

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications (${count})`}
        style={{
          width: 30,
          height: 30,
          border: '1px solid var(--card-border)',
          borderRadius: 6,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span style={{ fontSize: 14 }}>🔔</span>
      </button>
      {count > 0 && (
        <div style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 14, height: 14, borderRadius: 7,
          background: C.danger,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{count > 99 ? '99+' : count}</span>
        </div>
      )}

      {open && (
        <div style={{
          position: 'absolute',
          top: 36, right: 0,
          width: 360,
          maxHeight: 460,
          overflowY: 'auto',
          background: '#fff',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          zIndex: 50,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.fg }}>Notifications</p>
            <span style={{ fontSize: 10, color: C.subtle, fontWeight: 600 }}>
              {count} en attente
            </span>
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
              <p style={{ fontSize: 12, color: C.subtle }}>
                Aucune notification. Vous êtes à jour !
              </p>
            </div>
          ) : (
            notifs.map(n => (
              <button
                key={n.id}
                onClick={() => { router.push(n.href); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  background: '#fff',
                  border: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${severityColor(n.severity)}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center', marginTop: 1 }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 2 }}>{n.text}</p>
                  <p style={{ fontSize: 11, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.sub}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

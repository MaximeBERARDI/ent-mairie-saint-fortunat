'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { useCommissions } from '@/hooks/useCommissions'
import type { Commission } from '@/lib/types'
import { useTasks } from '@/hooks/useTasks'
import { useFactures } from '@/hooks/useFactures'
import { useBudget } from '@/hooks/useBudget'
import { useEcritures } from '@/hooks/useEcritures'
import { useEmployees } from '@/hooks/useEmployees'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useMissions } from '@/hooks/useMissions'
import { useTeam } from '@/hooks/useTeam'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { AgentQuickActions } from '@/components/dashboard/AgentQuickActions'
import { PEOPLE, getPerson } from '@/lib/people'
import { computeRatios } from '@/lib/ratios'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { CHAPITRES_M14 } from '@/lib/m14-plan'
import { formatShortFR, daysUntil, FRENCH_MONTHS } from '@/lib/dateUtils'
import type { Task, TaskStatus, Facture, LeaveRequest, EmployeeRecord } from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

type DashView = 'conseiller' | 'agent' | 'maire'

const STATUS_VARIANTS: Record<TaskStatus, 'warning' | 'info' | 'success' | 'default' | 'terra'> = {
  'À faire': 'default',
  'En cours': 'warning',
  'En attente validation': 'terra',
  'Terminé': 'success',
}

const PRIORITY_VARIANTS: Record<string, 'danger' | 'warning' | 'default'> = {
  Urgent: 'danger',
  Normal: 'default',
  Faible: 'default',
}

// Greeting selon l'heure
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return "Bon après-midi"
  return 'Bonsoir'
}

function getTodayLabel(): string {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const d = new Date()
  return `${days[d.getDay()]} ${d.getDate()} ${FRENCH_MONTHS[d.getMonth()]}`
}

// Prochaines réunions de commissions (parsées depuis le champ `nextMeeting` "5 mai")
function getUpcomingMeetings(commissions: Commission[]) {
  const now = new Date()
  return commissions
    .map(c => {
      // Parse "5 mai" en supposant l'année courante
      const m = c.nextMeeting.match(/^(\d+)\s+([a-zéûôîç]+)/i)
      if (!m) return null
      const day = Number(m[1])
      const monthIdx = FRENCH_MONTHS.findIndex(mo => mo.startsWith(m[2].toLowerCase().slice(0, 3)))
      if (monthIdx < 0) return null
      const year = now.getFullYear() === 2026 ? 2026 : now.getFullYear()
      const date = new Date(year, monthIdx, day)
      return { commission: c, date, label: c.nextMeeting }
    })
    .filter((x): x is { commission: Commission; date: Date; label: string } => x !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export default function DashboardPage() {
  const { tasks, hydrated, updateTask, createTask } = useTasks()
  const { currentUser, currentUserId, can } = useCurrentUser()

  // Rôle de pilotage / signature / validation (maire, adjoint, signataire…).
  const canPilot = currentUser?.role === 'maire'
    || currentUser?.role === 'adjoint'
    || can('finance.validate-invoices')
    || can('hr.validate-leaves')
    || can('tasks.validate')
    || (currentUser?.canSign ?? false)

  // Élu (maire/adjoint/elu).
  const canConsult = currentUser?.role === 'maire'
    || currentUser?.role === 'adjoint'
    || currentUser?.role === 'elu'

  // La vue est imposée par le statut de la personne connectée (plus de choix
  // manuel) : pilotage pour les responsables, conseiller pour les élus,
  // agent pour le reste.
  const view: DashView = canPilot ? 'maire' : canConsult ? 'conseiller' : 'agent'

  if (!hydrated) {
    return (
      <Shell title="Tableau de bord" notif={3}>
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 14 }}>Chargement…</div>
      </Shell>
    )
  }

  return (
    <Shell title="Tableau de bord" notif={3}>
      {view === 'conseiller' && <DashConseiller tasks={tasks} updateTask={updateTask} currentUserId={currentUserId} />}
      {view === 'agent' && <DashAgent tasks={tasks} updateTask={updateTask} createTask={createTask} currentUserId={currentUserId} />}
      {view === 'maire' && <DashMaire tasks={tasks} currentUserId={currentUserId} createTask={createTask} />}
    </Shell>
  )
}

// ── Vue Élu / Conseiller ──────────────────────────────────────────────────────

function DashConseiller({ tasks, updateTask, currentUserId }: { tasks: Task[]; updateTask: (id: string, p: Partial<Task>) => void; currentUserId: string }) {
  const me = getPerson(currentUserId)
  const { factures } = useFactures()
  const { leaves } = useLeaveRequests()
  const { people } = useTeam()
  const { commissions } = useCommissions()

  // Mes tâches actives
  const myTasks = useMemo(
    () => tasks.filter(t => t.assigneeIds.includes(currentUserId) && t.status !== 'Terminé'),
    [tasks, currentUserId],
  )
  const myUrgent = myTasks.filter(t => t.priority === 'Urgent').length

  // Mes tâches à valider (en tant que validateur)
  const toValidate = useMemo(
    () => tasks.filter(t => t.validatorId === currentUserId && t.status === 'En attente validation'),
    [tasks, currentUserId],
  )

  // Si l'utilisateur a la permission, factures et congés en attente.
  // On affiche pour les rôles qui valident habituellement (maire/adjoint/admin).
  const canValidateFactures = me ? ['maire', 'adjoint'].includes(me.role) || ['super-admin', 'admin'].includes(me.authLevel) : false
  const canValidateLeaves = canValidateFactures
  const facturesAValider = canValidateFactures ? factures.filter(f => f.statut === 'En attente validation') : []
  const leavesAValider = canValidateLeaves ? leaves.filter(l => l.statut === 'En attente') : []
  const totalToValidate = toValidate.length + facturesAValider.length + leavesAValider.length

  // Top 4 tâches par priorité + urgence
  const topTasks = useMemo(() => {
    const score = (t: Task): number => {
      const prioScore = t.priority === 'Urgent' ? 100 : t.priority === 'Normal' ? 50 : 10
      const days = daysUntil(t.dueDate)
      const dueScore = days === null ? 0 : days < 0 ? 200 : days <= 2 ? 80 : days <= 7 ? 40 : 10
      return prioScore + dueScore
    }
    return [...myTasks].sort((a, b) => score(b) - score(a)).slice(0, 4)
  }, [myTasks])

  // Prochaines réunions
  const meetings = getUpcomingMeetings(commissions).slice(0, 3)
  const nextMeeting = meetings[0]

  // Activité récente — enrichie : tâches, factures soumises, demandes de congés
  type ActivityItem = { date: string; type: 'task' | 'facture' | 'leave'; label: string; sub: string; badge?: string; badgeVariant?: 'warning' | 'success' | 'danger' | 'default' | 'terra' | 'info' | 'primary' }
  const recent = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []
    tasks.forEach(t => {
      const a = getPerson(t.assigneeIds[0])
      items.push({ date: t.createdAt, type: 'task', label: t.label, sub: a?.fullName ?? '—', badge: t.status, badgeVariant: STATUS_VARIANTS[t.status] })
    })
    factures.forEach(f => {
      const sub = people.find(p => p.id === f.submittedById)
      items.push({
        date: f.submittedAt,
        type: 'facture',
        label: `Facture ${f.numero} — ${fmtMontant(f.montantTTC)}`,
        sub: `Soumise par ${sub?.fullName ?? '—'}`,
        badge: f.statut === 'En attente validation' ? 'À valider' : f.statut,
        badgeVariant: f.statut === 'Validée' ? 'success' : f.statut === 'Rejetée' ? 'danger' : 'warning',
      })
    })
    leaves.forEach(l => {
      const p = people.find(x => x.id === l.personId)
      items.push({
        date: l.submittedAt,
        type: 'leave',
        label: `Demande ${l.type} — ${p?.fullName ?? '—'}`,
        sub: `${l.nbJoursOuvres}j du ${formatShortFR(l.dateDebut)} au ${formatShortFR(l.dateFin)}`,
        badge: l.statut,
        badgeVariant: l.statut === 'Approuvée' ? 'success' : l.statut === 'Refusée' ? 'danger' : 'warning',
      })
    })
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  }, [tasks, factures, leaves, people])

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, color: C.fg, fontWeight: 700, marginBottom: 2 }}>
          {getGreeting()}, {me?.prenom ?? 'Jean'} — {getTodayLabel()}
        </h2>
        <p style={{ fontSize: 12, color: C.subtle }}>
          {myTasks.length === 0
            ? 'Vous êtes à jour ! 🌱'
            : `${myTasks.length} tâche${myTasks.length > 1 ? 's' : ''} en cours${myUrgent > 0 ? `, dont ${myUrgent} urgente${myUrgent > 1 ? 's' : ''}` : ''}.`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard
          label="Mes tâches en cours"
          value={myTasks.length}
          sub={myUrgent > 0 ? `dont ${myUrgent} urgente${myUrgent > 1 ? 's' : ''}` : undefined}
        />
        <KpiCard
          label="À valider par moi"
          value={totalToValidate}
          sub={
            totalToValidate > 0
              ? `${toValidate.length} tâches · ${facturesAValider.length} factures · ${leavesAValider.length} congés`
              : 'rien à valider'
          }
          color={totalToValidate > 0 ? C.warning : C.success}
        />
        <KpiCard
          label="Prochaine réunion"
          value={nextMeeting?.label ?? '—'}
          sub={nextMeeting?.commission.name ?? 'Aucune programmée'}
          color={C.slate}
        />
        <KpiCard
          label="Total équipe"
          value={tasks.filter(t => t.status !== 'Terminé').length}
          sub="tâches actives"
          color={C.terra}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 2 }} padding={16}>
          <SectionHeader
            title="Mes tâches prioritaires"
            actions={
              <>
                <Link href="/taches"><Button size="sm">Voir toutes</Button></Link>
                <Link href="/taches"><Button variant="primary" size="sm">+ Ajouter</Button></Link>
              </>
            }
          />
          {topTasks.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '20px 0', textAlign: 'center' }}>
              Aucune tâche en cours pour vous. 🎉
            </p>
          ) : (
            topTasks.map((t, i) => {
              const c = commissions.find(x => x.id === t.commissionIds[0])
              const days = daysUntil(t.dueDate)
              const dot = t.priority === 'Urgent' ? C.danger : days !== null && days < 3 ? C.warning : C.subtle
              return (
                <DashboardTaskRow
                  key={t.id}
                  task={t}
                  commission={c?.name}
                  dot={dot}
                  last={i === topTasks.length - 1}
                  onComplete={() => updateTask(t.id, { status: 'Terminé' })}
                />
              )
            })
          )}
        </Card>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="Prochaines réunions" />
            {meetings.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle }}>Aucune réunion programmée.</p>
            ) : (
              meetings.map((m, i) => (
                <Row
                  key={m.commission.id}
                  label={`${m.label} — ${m.commission.name}`}
                  sub="14h00 · Salle du Conseil"
                  dot={m.commission.color}
                  last={i === meetings.length - 1}
                />
              ))
            )}
          </Card>

          <Card padding={14}>
            <SectionHeader title="Activité récente" />
            {recent.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle }}>Aucune activité.</p>
            ) : (
              recent.map((item, i) => {
                const icon = item.type === 'facture' ? '💶' : item.type === 'leave' ? '🏝' : '📋'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: C.subtle }}>{item.sub}</p>
                    </div>
                    {item.badge && <Badge label={item.badge} variant={item.badgeVariant ?? 'default'} />}
                  </div>
                )
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardTaskRow({
  task, commission, dot, last, onComplete,
}: {
  task: Task
  commission?: string
  dot: string
  last: boolean
  onComplete: () => void
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0',
        borderBottom: last ? 'none' : `1px solid ${C.border}`,
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <Link href="/taches" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{task.label}</p>
        <p style={{ fontSize: 12, color: C.subtle, marginTop: 1 }}>
          {commission ?? 'Sans commission'} · Échéance : {formatShortFR(task.dueDate)}
        </p>
      </Link>
      <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
      <Button size="sm" onClick={onComplete}>✓</Button>
    </div>
  )
}

// ── Vue Agent (focus "Aujourd'hui") ───────────────────────────────────────────

function DashAgent({ tasks, updateTask, createTask, currentUserId }: { tasks: Task[]; updateTask: (id: string, p: Partial<Task>) => void; createTask: (data: Omit<Task, 'id' | 'createdAt'>) => Task; currentUserId: string }) {
  const me = getPerson(currentUserId)
  const { records, findByPersonId } = useEmployees()
  const { leaves, byPerson: leavesByPerson } = useLeaveRequests()
  const { byPerson: missionsByPerson } = useMissions()
  const { commissions } = useCommissions()

  // Données RH personnelles (si l'utilisateur est un agent avec une fiche)
  const myRecord = findByPersonId(currentUserId)
  const myLeaves = leavesByPerson(currentUserId).filter(l => l.statut !== 'Refusée' && l.statut !== 'Annulée')
  const myUpcomingLeaves = myLeaves.filter(l => l.dateFin >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)).slice(0, 3)
  const myMissions = missionsByPerson(currentUserId)
  const myActiveMissions = myMissions.filter(m => !m.dateFin || m.dateFin >= new Date().toISOString().slice(0, 10))

  // Tâches "à faire aujourd'hui" : assignées à moi, échéance ≤ aujourd'hui + 1, non terminées
  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.assigneeIds.includes(currentUserId)) return false
      if (t.status === 'Terminé') return false
      const days = daysUntil(t.dueDate)
      // Si pas de date : considérer comme "à faire" si urgent
      if (days === null) return t.priority === 'Urgent'
      return days <= 1
    })
  }, [tasks])

  // Tâches "cette semaine" : assignées à moi, ≤ 7 jours
  const weekTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.assigneeIds.includes(currentUserId)) return false
      if (t.status === 'Terminé') return false
      const days = daysUntil(t.dueDate)
      if (days === null) return false
      return days > 1 && days <= 7
    })
  }, [tasks])

  const meetings = getUpcomingMeetings(commissions).slice(0, 3)
  const meetingsThisWeek = meetings.filter(m => {
    const days = Math.floor((m.date.getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 7
  })

  const allDoneToday = todayTasks.length === 0

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 4 }}>
          {getGreeting()}, {me?.prenom ?? 'Jean'} — {getTodayLabel()}
        </h2>
        <p style={{ fontSize: 14, color: C.subtle }}>
          {allDoneToday
            ? 'Aucune tâche urgente aujourd\'hui. Profitez-en pour avancer sur les tâches de la semaine.'
            : `Vous avez ${todayTasks.length} tâche${todayTasks.length > 1 ? 's' : ''} à traiter aujourd'hui${meetingsThisWeek.length > 0 ? ` et ${meetingsThisWeek.length} réunion${meetingsThisWeek.length > 1 ? 's' : ''} cette semaine` : ''}.`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={16}>
            <SectionHeader
              title="À faire aujourd'hui"
              actions={<Badge label={`${todayTasks.length} tâche${todayTasks.length > 1 ? 's' : ''}`} variant={todayTasks.length > 0 ? 'primary' : 'default'} />}
            />
            {todayTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, padding: '20px 0', textAlign: 'center' }}>
                ✓ Tout est sous contrôle pour aujourd&apos;hui.
              </p>
            ) : (
              todayTasks.map((t, i) => {
                const c = commissions.find(x => x.id === t.commissionIds[0])
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 0',
                    borderBottom: i < todayTasks.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <button
                      onClick={() => updateTask(t.id, { status: 'Terminé' })}
                      aria-label="Marquer terminée"
                      style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${C.border}`,
                        background: 'transparent',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                    />
                    <Link href="/taches" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      <p style={{ fontSize: 14, color: C.fg, fontWeight: 500 }}>{t.label}</p>
                    </Link>
                    {c && <Tag label={c.name.split(' ')[0]} color={c.color} />}
                    <Badge label={t.priority} variant={PRIORITY_VARIANTS[t.priority]} />
                  </div>
                )
              })
            )}
          </Card>

          <Card padding={16}>
            <SectionHeader title="Cette semaine" />
            {meetingsThisWeek.map((m, i) => (
              <Row
                key={m.commission.id}
                label={`${m.label} — Réunion ${m.commission.name}`}
                sub="14h00 · Salle du Conseil"
                badge="Réunion"
                badgeVariant="info"
                dot={C.info}
                last={i === meetingsThisWeek.length - 1 && weekTasks.length === 0}
              />
            ))}
            {weekTasks.length === 0 && meetingsThisWeek.length === 0 && (
              <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0' }}>Rien de prévu cette semaine.</p>
            )}
            {weekTasks.map((t, i) => {
              const c = commissions.find(x => x.id === t.commissionIds[0])
              return (
                <Row
                  key={t.id}
                  label={t.label}
                  sub={`${c?.name ?? 'Sans commission'} · ${formatShortFR(t.dueDate)}`}
                  badge={t.priority}
                  badgeVariant={PRIORITY_VARIANTS[t.priority]}
                  dot={t.priority === 'Urgent' ? C.danger : C.subtle}
                  last={i === weekTasks.length - 1}
                />
              )
            })}
          </Card>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="Notifications" />
            <NotificationsList tasks={tasks} currentUserId={currentUserId} />
          </Card>

          {myRecord && (
            <Card padding={14}>
              <SectionHeader title="Mes infos RH" actions={<Link href="/rh"><Button size="sm">Voir</Button></Link>} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Congés restants</p>
                  <p style={{ fontSize: 16, color: C.fg, fontWeight: 700 }}>{myRecord.congesAnnuelsAcquis - myRecord.congesAnnuelsPris} j</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>RTT restants</p>
                  <p style={{ fontSize: 16, color: C.fg, fontWeight: 700 }}>{myRecord.rttAcquis - myRecord.rttPris} j</p>
                </div>
              </div>
              {myUpcomingLeaves.length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Mes prochaines absences</p>
                  {myUpcomingLeaves.map((l, i) => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i < myUpcomingLeaves.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <Tag label={l.type === 'Congés annuels' ? 'CA' : l.type === 'RTT' ? 'RTT' : l.type[0]} color={l.type === 'Maladie' ? C.danger : C.terra} />
                      <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{formatShortFR(l.dateDebut)} → {formatShortFR(l.dateFin)}</p>
                      <Badge label={l.statut === 'En attente' ? 'En attente' : 'OK'} variant={l.statut === 'En attente' ? 'warning' : 'success'} />
                    </div>
                  ))}
                </>
              )}
            </Card>
          )}

          {myActiveMissions.length > 0 && (
            <Card padding={14}>
              <SectionHeader title={`Mes missions (${myActiveMissions.length})`} />
              {myActiveMissions.map((m, i) => (
                <div key={m.id} style={{ padding: '7px 0', borderBottom: i < myActiveMissions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: C.subtle }}>
                    Du {formatShortFR(m.dateDebut)} {m.dateFin ? `au ${formatShortFR(m.dateFin)}` : '— en cours'}{m.lieu && ` · ${m.lieu}`}
                  </p>
                </div>
              ))}
            </Card>
          )}

          <AgentQuickActions currentUserId={currentUserId} createTask={createTask} />
        </div>
      </div>
    </div>
  )
}

function NotificationsList({ tasks, currentUserId }: { tasks: Task[]; currentUserId: string }) {
  // Notifications dynamiques :
  // - tâches en attente de ma validation
  // - tâches en retard pour moi
  // - tâches récemment créées par d'autres
  const toValidate = tasks.filter(t => t.validatorId === currentUserId && t.status === 'En attente validation')
  const overdue = tasks.filter(t => {
    if (!t.assigneeIds.includes(currentUserId) || t.status === 'Terminé') return false
    const d = daysUntil(t.dueDate)
    return d !== null && d < 0
  })
  const recentByOthers = [...tasks]
    .filter(t => t.assigneeIds.includes(currentUserId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 1)

  const notifs: Array<{ text: string; sub: string; type: 'primary' | 'warning' | 'danger' | 'default' }> = []
  if (toValidate.length > 0) {
    notifs.push({
      text: `${toValidate.length} tâche${toValidate.length > 1 ? 's' : ''} à valider`,
      sub: toValidate[0].label,
      type: 'warning',
    })
  }
  if (overdue.length > 0) {
    notifs.push({
      text: `${overdue.length} tâche${overdue.length > 1 ? 's' : ''} en retard`,
      sub: overdue[0].label,
      type: 'danger',
    })
  }
  if (recentByOthers.length > 0) {
    const t = recentByOthers[0]
    const author = getPerson(t.assigneeIds[0])
    notifs.push({
      text: `Tâche : ${t.label}`,
      sub: `Assignée à ${author?.fullName ?? '—'}`,
      type: 'default',
    })
  }
  if (notifs.length === 0) {
    notifs.push({ text: 'Aucune notification', sub: 'Vous êtes à jour ✓', type: 'primary' })
  }

  return (
    <>
      {notifs.map((n, i) => (
        <div key={i} style={{
          display: 'flex', gap: 8, padding: '8px 0',
          borderBottom: i < notifs.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: n.type === 'primary' ? C.green : n.type === 'warning' ? C.warning : n.type === 'danger' ? C.danger : C.subtle,
            marginTop: 4, flexShrink: 0,
          }} />
          <div>
            <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{n.text}</p>
            <p style={{ fontSize: 12, color: C.subtle }}>{n.sub}</p>
          </div>
        </div>
      ))}
    </>
  )
}

// ── Vue Maire / Pilotage ──────────────────────────────────────────────────────

function DashMaire({ tasks, currentUserId, createTask }: { tasks: Task[]; currentUserId: string; createTask: (data: Omit<Task, 'id' | 'createdAt'>) => Task }) {
  const me = getPerson(currentUserId)
  // Sources de données réelles
  const { factures } = useFactures()
  const { commissions } = useCommissions()
  const { postes, computePosteWithConsumption } = useBudget()
  const { ecritures } = useEcritures()
  const { records } = useEmployees()
  const { leaves } = useLeaveRequests()
  const { missions } = useMissions()
  const { people } = useTeam()

  // ─── Stats tâches ───
  const commissionStats = useMemo(() => {
    return commissions.map(c => {
      const ctasks = tasks.filter(t => t.commissionIds.includes(c.id))
      const active = ctasks.filter(t => t.status !== 'Terminé').length
      const late = ctasks.filter(t => {
        if (t.status === 'Terminé') return false
        const d = daysUntil(t.dueDate)
        return d !== null && d < 0
      }).length
      return { ...c, activeCount: active, lateCount: late }
    })
  }, [tasks])

  const chargeByPerson = useMemo(() => {
    const counts = new Map<string, number>()
    tasks.filter(t => t.status !== 'Terminé').forEach(t => {
      t.assigneeIds.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1))
    })
    return Array.from(counts.entries())
      .map(([id, count]) => {
        const p = getPerson(id)
        return p ? { person: p, count } : null
      })
      .filter((x): x is { person: NonNullable<ReturnType<typeof getPerson>>; count: number } => x !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [tasks])

  const totalActive = tasks.filter(t => t.status !== 'Terminé').length
  const totalLate = tasks.filter(t => {
    if (t.status === 'Terminé') return false
    const d = daysUntil(t.dueDate)
    return d !== null && d < 0
  }).length
  const pendingValidation = tasks.filter(t => t.status === 'En attente validation').length

  // ─── Stats finances réelles M14 ───
  const enriched = useMemo(
    () => postes.map(p => computePosteWithConsumption(p, factures, ecritures)),
    [postes, factures, ecritures, computePosteWithConsumption],
  )
  const ratios = useMemo(() => computeRatios(enriched, 900), [enriched])

  const facturesEnAttente = factures.filter(f => f.statut === 'En attente validation')
  const facturesEnAttenteMontant = facturesEnAttente.reduce((acc, f) => acc + f.montantTTC, 0)

  // Top postes en alerte (>80% consommés) parmi les dépenses
  const postesEnAlerte = enriched
    .filter(p => p.sens === 'D' && p.enAlerte)
    .sort((a, b) => b.pctConsomme - a.pctConsomme)
    .slice(0, 5)

  // Top 5 chapitres par consommation (vraies données)
  const topChapitres = useMemo(() => {
    return CHAPITRES_M14
      .filter(ch => ch.sens === 'D')
      .map(ch => {
        const items = enriched.filter(p => p.chapitreCode === ch.code)
        const budget = items.reduce((acc, p) => acc + p.budgetAlloue, 0)
        const realise = items.reduce((acc, p) => acc + p.consommationTotale, 0)
        const pct = budget > 0 ? Math.round((realise / budget) * 100) : 0
        return { chapitre: ch, budget, realise, pct }
      })
      .filter(c => c.budget > 0)
      .sort((a, b) => b.realise - a.realise)
      .slice(0, 6)
  }, [enriched])

  // ─── Stats RH ───
  const today = new Date().toISOString().slice(0, 10)
  const leavesPending = leaves.filter(l => l.statut === 'En attente')
  const absentToday = leaves.filter(l => l.statut === 'Approuvée' && today >= l.dateDebut && today <= l.dateFin)
  const masseSalChargee = records.reduce((acc, r) => {
    const ratio = r.tempsTravailHeures / 35
    return acc + (r.salaireBrut + (r.primes ?? 0) + (r.ifse ?? 0)) * ratio
  }, 0) * 1.50
  const horizon = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const contratsAReno = records.filter(r => r.dateFinContrat && r.dateFinContrat <= horizon)
  const missionsEnCours = missions.filter(m => !m.dateFin || m.dateFin >= today)

  return (
    <div>
      {/* Agent signataire/responsable (ex. DGS) : ses actions agent restent
          accessibles même en vue Pilotage. */}
      {me?.role === 'agent' && (
        <div style={{ maxWidth: 320, marginBottom: 12 }}>
          <AgentQuickActions currentUserId={currentUserId} createTask={createTask} />
        </div>
      )}

      {/* Bandeau d'alertes globales */}
      {totalLate > 0 && (
        <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: C.danger, fontWeight: 600, flex: 1 }}>
            {totalLate} tâche{totalLate > 1 ? 's' : ''} en retard sur l&apos;ensemble de l&apos;équipe
          </p>
          <Link href="/taches"><Button size="sm" style={{ borderColor: C.danger, color: C.danger }}>Voir</Button></Link>
        </div>
      )}

      {pendingValidation + facturesEnAttente.length + leavesPending.length > 0 && (
        <div style={{ background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: C.warning, fontWeight: 600, flex: 1 }}>
            À valider :
            {pendingValidation > 0 && ` ${pendingValidation} tâche${pendingValidation > 1 ? 's' : ''}`}
            {pendingValidation > 0 && (facturesEnAttente.length > 0 || leavesPending.length > 0) && ' ·'}
            {facturesEnAttente.length > 0 && ` ${facturesEnAttente.length} facture${facturesEnAttente.length > 1 ? 's' : ''} (${fmtMontant(facturesEnAttenteMontant)})`}
            {facturesEnAttente.length > 0 && leavesPending.length > 0 && ' ·'}
            {leavesPending.length > 0 && ` ${leavesPending.length} demande${leavesPending.length > 1 ? 's' : ''} d'absence`}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {pendingValidation > 0 && <Link href="/taches"><Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Tâches</Button></Link>}
            {facturesEnAttente.length > 0 && <Link href="/finances"><Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Factures</Button></Link>}
            {leavesPending.length > 0 && <Link href="/rh"><Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Congés</Button></Link>}
          </div>
        </div>
      )}

      {contratsAReno.length > 0 && (
        <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: C.danger, fontWeight: 600, flex: 1 }}>
            {contratsAReno.length} contrat{contratsAReno.length > 1 ? 's à renouveler' : ' à renouveler'} dans les 90 jours
          </p>
          <Link href="/rh"><Button size="sm" style={{ borderColor: C.danger, color: C.danger }}>Voir RH</Button></Link>
        </div>
      )}

      {/* Vue d'ensemble Finances — synthèse en tête, avant le détail budgétaire */}
      <Card padding={16} style={{ marginBottom: 'var(--gap)' }}>
        <SectionHeader title="Vue d'ensemble Finances" actions={<Link href="/finances"><Button size="sm">Module Finances</Button></Link>} />
        <div style={{ display: 'flex', gap: 'var(--gap)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>CAF brute</p>
            <p style={{ fontSize: 22, color: ratios.cafBrute >= 0 ? C.success : C.danger, fontWeight: 700, lineHeight: 1.1 }}>{fmtMontant(ratios.cafBrute)}</p>
          </div>
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Taux d&apos;épargne brute</p>
            <p style={{ fontSize: 22, color: C.fg, fontWeight: 700, lineHeight: 1.1 }}>{ratios.tauxEpargneBrute}%</p>
          </div>
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Capacité désendettement</p>
            <p style={{ fontSize: 22, color: ratios.cafBrute <= 0 ? C.danger : ratios.capaciteDesendettement < 8 ? C.success : ratios.capaciteDesendettement <= 12 ? C.warning : C.danger, fontWeight: 700, lineHeight: 1.1 }}>{ratios.cafBrute <= 0 ? '∞' : `${ratios.capaciteDesendettement} ans`}</p>
          </div>
          <div style={{ flex: '1 1 150px', minWidth: 130 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Factures à valider</p>
            <p style={{ fontSize: 22, color: facturesEnAttente.length > 0 ? C.warning : C.success, fontWeight: 700, lineHeight: 1.1 }}>{facturesEnAttente.length}</p>
            {facturesEnAttente.length > 0 && <p style={{ fontSize: 12, color: C.subtle }}>{fmtMontant(facturesEnAttenteMontant)}</p>}
          </div>
        </div>
      </Card>

      {/* KPI bar — pilotage global */}
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="CAF brute (auto-financement)" value={fmtMontant(ratios.cafBrute)} sub={`Taux d'épargne ${ratios.tauxEpargneBrute}%`} color={ratios.cafBrute >= 0 ? C.success : C.danger} />
        <KpiCard
          label="Capacité désendettement"
          value={ratios.cafBrute <= 0 ? '∞' : `${ratios.capaciteDesendettement} ans`}
          sub={ratios.capaciteDesendettement < 8 ? 'sain (< 8 ans)' : ratios.capaciteDesendettement <= 12 ? 'à surveiller' : 'critique'}
          color={ratios.capaciteDesendettement < 8 ? C.success : ratios.capaciteDesendettement <= 12 ? C.warning : C.danger}
        />
        <KpiCard label="Masse salariale chargée" value={fmtMontant(masseSalChargee)} sub={`${records.length} agents · brut + ~50%`} color={C.slate} />
        <KpiCard label="Présents aujourd'hui" value={`${records.length - absentToday.length} / ${records.length}`} sub={absentToday.length === 0 ? 'tous présents' : `${absentToday.length} en absence`} color={absentToday.length === 0 ? C.success : C.warning} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Tâches actives (équipe)" value={totalActive} sub={totalLate > 0 ? `⚠ ${totalLate} en retard` : 'aucune en retard'} color={totalLate > 0 ? C.danger : C.subtle} />
        <KpiCard label="Validations en attente" value={pendingValidation + facturesEnAttente.length + leavesPending.length} sub={`${pendingValidation} tâches · ${facturesEnAttente.length} factures · ${leavesPending.length} congés`} color={(pendingValidation + facturesEnAttente.length + leavesPending.length) > 0 ? C.warning : C.success} />
        <KpiCard label="Postes budget en alerte" value={postesEnAlerte.length} sub="> 80% consommés" color={postesEnAlerte.length > 0 ? C.warning : C.success} />
        <KpiCard label="Missions en cours" value={missionsEnCours.length} sub={`sur ${missions.length} affectations`} color={C.terra} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {/* Suivi budgétaire réel par chapitre M14 */}
        <Card style={{ flex: 3 }} padding={16}>
          <SectionHeader title="Suivi budgétaire — top chapitres M14" actions={<Link href="/finances"><Button size="sm">Plan comptable complet</Button></Link>} />
          {topChapitres.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0' }}>Aucun budget alloué.</p>
          ) : (
            topChapitres.map((c) => (
              <div key={c.chapitre.code} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, minWidth: 40 }}>Ch. {c.chapitre.code}</span>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, flex: 1 }}>{c.chapitre.label}</p>
                  <p style={{ fontSize: 12, color: C.subtle }}>{fmtMontant(c.realise)} / {fmtMontant(c.budget)}</p>
                  <p style={{ fontSize: 12, color: c.pct > 80 ? C.danger : c.pct > 60 ? C.warning : C.success, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{c.pct}%</p>
                </div>
                <Progress pct={Math.min(100, c.pct)} />
              </div>
            ))
          )}
        </Card>

        {/* Postes en alerte + ratios */}
        <Card style={{ flex: 2 }} padding={14}>
          <SectionHeader title="Indicateurs financiers (R. 2313-1)" actions={<Link href="/finances"><Button size="sm">Détail</Button></Link>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <RatioMini helpKey="ratio1_drfParHab" label="DRF / habitant" value={`${ratios.ratio1_drfParHab} €`} />
            <RatioMini helpKey="ratio3_rrfParHab" label="RRF / habitant" value={`${ratios.ratio3_rrfParHab} €`} />
            <RatioMini helpKey="ratio7_personnelSurDrf" label="Personnel / DRF" value={`${ratios.ratio7_personnelSurDrf}%`} />
            <RatioMini helpKey="ratio5_encoursDetteParHab" label="Dette / habitant" value={`${ratios.ratio5_encoursDetteParHab} €`} />
          </div>
          <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Postes en alerte</p>
          {postesEnAlerte.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun poste en alerte 👌</p>
          ) : (
            postesEnAlerte.map(p => (
              <div key={p.code} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", minWidth: 38 }}>{p.code}</span>
                  <p style={{ fontSize: 12, color: C.fg, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</p>
                  <p style={{ fontSize: 12, color: p.pctConsomme > 95 ? C.danger : C.warning, fontWeight: 700 }}>{p.pctConsomme}%</p>
                </div>
                <Progress pct={Math.min(100, p.pctConsomme)} />
              </div>
            ))
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 2 }} padding={14}>
          <SectionHeader title="État des commissions" />
          {commissionStats.map((c, i) => (
            <Link key={c.id} href="/commissions" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < commissionStats.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.lateCount > 0 ? C.danger : c.activeCount > 8 ? C.warning : C.success, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{c.name}</p>
                <p style={{ fontSize: 12, color: C.subtle }}>{c.activeCount} tâches{c.lateCount > 0 ? ` · ${c.lateCount} retard` : ''}</p>
                <Badge label={c.nextMeeting} variant={c.lateCount > 0 ? 'danger' : c.activeCount > 8 ? 'warning' : 'default'} />
              </div>
            </Link>
          ))}
        </Card>

        <Card style={{ flex: 1.5 }} padding={14}>
          <SectionHeader title="Charge équipe" actions={<Link href="/equipe"><Button size="sm">Voir</Button></Link>} />
          {chargeByPerson.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune tâche active.</p>
          ) : (
            chargeByPerson.map(({ person, count }) => (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar initials={person.initials} size={22} color={person.color} />
                <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{person.fullName}</p>
                <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600 }}>{count} tâche{count > 1 ? 's' : ''}</p>
              </div>
            ))
          )}
        </Card>

        {/* RH : qui est absent aujourd'hui */}
        <Card style={{ flex: 1.5 }} padding={14}>
          <SectionHeader title="Absences du jour" actions={<Link href="/rh"><Button size="sm">RH</Button></Link>} />
          {absentToday.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '8px 0' }}>Tous les agents sont présents 👌</p>
          ) : (
            absentToday.map(l => {
              const p = people.find(x => x.id === l.personId)
              if (!p) return null
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <Avatar initials={p.initials} size={22} color={C.terra} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p.fullName}</p>
                    <p style={{ fontSize: 11, color: C.subtle }}>{l.type} · jusqu&apos;au {formatShortFR(l.dateFin)}</p>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>
    </div>
  )
}

function RatioMini({ label, value, helpKey }: { label: string; value: string; helpKey?: string }) {
  return (
    <div style={{ padding: 8, background: C.bg, borderRadius: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        {helpKey && <InfoTooltip indicatorKey={helpKey} size={12} />}
      </div>
      <p style={{ fontSize: 14, color: C.fg, fontWeight: 700 }}>{value}</p>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
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
import { COMMISSIONS } from '@/lib/data'
import { useTasks } from '@/hooks/useTasks'
import { PEOPLE, getPerson, CURRENT_USER_ID } from '@/lib/people'
import { formatShortFR, formatLongFR, daysUntil, parseISO, FRENCH_MONTHS } from '@/lib/dateUtils'
import type { Task, TaskStatus } from '@/lib/types'

type DashView = 'conseiller' | 'agent' | 'maire'

const VIEW_LABELS: Record<DashView, string> = {
  conseiller: 'Élu / Conseiller',
  agent: 'Agent',
  maire: 'Maire / Pilotage',
}

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

// Prochaines réunions de commissions (parsées depuis COMMISSIONS.nextMeeting "5 mai")
function getUpcomingMeetings(commissions: typeof COMMISSIONS) {
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
    .filter((x): x is { commission: typeof COMMISSIONS[number]; date: Date; label: string } => x !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export default function DashboardPage() {
  const [view, setView] = useState<DashView>('conseiller')
  const { tasks, hydrated, updateTask } = useTasks()

  if (!hydrated) {
    return (
      <Shell title="Tableau de bord" notif={3}>
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 13 }}>Chargement…</div>
      </Shell>
    )
  }

  return (
    <Shell title="Tableau de bord" notif={3}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(Object.entries(VIEW_LABELS) as [DashView, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: `1px solid ${v === view ? C.green : C.border}`,
              background: v === view ? C.green : '#fff',
              color: v === view ? '#fff' : C.muted,
              fontSize: 12,
              fontWeight: v === view ? 600 : 400,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'conseiller' && <DashConseiller tasks={tasks} updateTask={updateTask} />}
      {view === 'agent' && <DashAgent tasks={tasks} updateTask={updateTask} />}
      {view === 'maire' && <DashMaire tasks={tasks} />}
    </Shell>
  )
}

// ── Vue Élu / Conseiller ──────────────────────────────────────────────────────

function DashConseiller({ tasks, updateTask }: { tasks: Task[]; updateTask: (id: string, p: Partial<Task>) => void }) {
  const me = getPerson(CURRENT_USER_ID)

  // Mes tâches actives
  const myTasks = useMemo(
    () => tasks.filter(t => t.assigneeId === CURRENT_USER_ID && t.status !== 'Terminé'),
    [tasks],
  )
  const myUrgent = myTasks.filter(t => t.priority === 'Urgent').length

  // Mes tâches à valider (en tant que validateur)
  const toValidate = useMemo(
    () => tasks.filter(t => t.validatorId === CURRENT_USER_ID && t.status === 'En attente validation'),
    [tasks],
  )

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
  const meetings = getUpcomingMeetings(COMMISSIONS).slice(0, 3)
  const nextMeeting = meetings[0]

  // Activité récente : tâches récemment créées (toutes commissions)
  const recent = useMemo(
    () => [...tasks]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4),
    [tasks],
  )

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
          value={toValidate.length}
          sub={toValidate.length > 0 ? "en attente d'action" : 'rien à valider'}
          color={toValidate.length > 0 ? C.warning : C.success}
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
              const c = COMMISSIONS.find(x => x.id === t.commissionId)
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
              recent.map((t, i) => {
                const author = getPerson(t.assigneeId)
                return (
                  <Row
                    key={t.id}
                    label={t.label}
                    sub={author ? `${author.fullName}` : '—'}
                    badge={t.status}
                    badgeVariant={STATUS_VARIANTS[t.status]}
                    last={i === recent.length - 1}
                  />
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
        <p style={{ fontSize: 10, color: C.subtle, marginTop: 1 }}>
          {commission ?? 'Sans commission'} · Échéance : {formatShortFR(task.dueDate)}
        </p>
      </Link>
      <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
      <Button size="sm" onClick={onComplete}>✓</Button>
    </div>
  )
}

// ── Vue Agent (focus "Aujourd'hui") ───────────────────────────────────────────

function DashAgent({ tasks, updateTask }: { tasks: Task[]; updateTask: (id: string, p: Partial<Task>) => void }) {
  const me = getPerson(CURRENT_USER_ID)

  // Tâches "à faire aujourd'hui" : assignées à moi, échéance ≤ aujourd'hui + 1, non terminées
  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.assigneeId !== CURRENT_USER_ID) return false
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
      if (t.assigneeId !== CURRENT_USER_ID) return false
      if (t.status === 'Terminé') return false
      const days = daysUntil(t.dueDate)
      if (days === null) return false
      return days > 1 && days <= 7
    })
  }, [tasks])

  const meetings = getUpcomingMeetings(COMMISSIONS).slice(0, 3)
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
        <p style={{ fontSize: 13, color: C.subtle }}>
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
                const c = COMMISSIONS.find(x => x.id === t.commissionId)
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
                      <p style={{ fontSize: 13, color: C.fg, fontWeight: 500 }}>{t.label}</p>
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
              const c = COMMISSIONS.find(x => x.id === t.commissionId)
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
            <NotificationsList tasks={tasks} />
          </Card>

          <Card padding={14}>
            <SectionHeader title="Actions rapides" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link href="/taches"><Button style={{ width: '100%' }}>+ Créer une tâche</Button></Link>
              <Link href="/comptes-rendus"><Button style={{ width: '100%' }}>Uploader un compte rendu</Button></Link>
              <Link href="/finances"><Button style={{ width: '100%' }}>Soumettre une facture</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function NotificationsList({ tasks }: { tasks: Task[] }) {
  // Notifications dynamiques :
  // - tâches en attente de ma validation
  // - tâches en retard pour moi
  // - tâches récemment créées par d'autres
  const toValidate = tasks.filter(t => t.validatorId === CURRENT_USER_ID && t.status === 'En attente validation')
  const overdue = tasks.filter(t => {
    if (t.assigneeId !== CURRENT_USER_ID || t.status === 'Terminé') return false
    const d = daysUntil(t.dueDate)
    return d !== null && d < 0
  })
  const recentByOthers = [...tasks]
    .filter(t => t.assigneeId === CURRENT_USER_ID)
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
    const author = getPerson(t.assigneeId)
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
            <p style={{ fontSize: 10, color: C.subtle }}>{n.sub}</p>
          </div>
        </div>
      ))}
    </>
  )
}

// ── Vue Maire / Pilotage ──────────────────────────────────────────────────────

function DashMaire({ tasks }: { tasks: Task[] }) {
  // Stats par commission : tâches actives, retard, prochaine réunion
  const commissionStats = useMemo(() => {
    return COMMISSIONS.map(c => {
      const ctasks = tasks.filter(t => t.commissionId === c.id)
      const active = ctasks.filter(t => t.status !== 'Terminé').length
      const late = ctasks.filter(t => {
        if (t.status === 'Terminé') return false
        const d = daysUntil(t.dueDate)
        return d !== null && d < 0
      }).length
      const ok = late === 0 && active <= 8
      return { ...c, activeCount: active, lateCount: late, ok }
    })
  }, [tasks])

  // Charge par personne (top 5)
  const chargeByPerson = useMemo(() => {
    const counts = new Map<string, number>()
    tasks.filter(t => t.status !== 'Terminé').forEach(t => {
      counts.set(t.assigneeId, (counts.get(t.assigneeId) ?? 0) + 1)
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

  // Mock budget (à brancher quand on aura le module finances)
  const budgets = [
    { label: 'Voirie & travaux publics', pct: 72, budget: '95 000 €' },
    { label: 'Personnel & charges sociales', pct: 46, budget: '120 000 €' },
    { label: 'Fonctionnement général', pct: 38, budget: '60 000 €' },
    { label: 'Enfance & jeunesse', pct: 89, budget: '42 000 €' },
    { label: 'Culture & animations', pct: 24, budget: '18 000 €' },
  ]

  return (
    <div>
      {totalLate > 0 && (
        <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.danger, fontWeight: 600, flex: 1 }}>
            {totalLate} tâche{totalLate > 1 ? 's' : ''} en retard sur l&apos;ensemble de l&apos;équipe
          </p>
          <Link href="/taches"><Button size="sm" style={{ borderColor: C.danger, color: C.danger }}>Voir</Button></Link>
        </div>
      )}

      {pendingValidation > 0 && (
        <div style={{ background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.warning, fontWeight: 600, flex: 1 }}>
            {pendingValidation} tâche{pendingValidation > 1 ? 's' : ''} en attente de validation
          </p>
          <Link href="/taches"><Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Traiter</Button></Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Tâches actives (équipe)" value={totalActive} sub={`${totalLate} en retard`} />
        <KpiCard label="Budget consommé 2026" value="42%" sub="sur 380 000 €" color={C.slate} />
        <KpiCard label="Validations en attente" value={pendingValidation} sub="à traiter" color={pendingValidation > 0 ? C.warning : C.success} />
        <KpiCard label="Personnes actives" value={chargeByPerson.length} sub="ont des tâches en cours" color={C.terra} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 3 }} padding={16}>
          <SectionHeader title="Suivi budgétaire par poste" actions={<Link href="/finances"><Button size="sm">Rapport complet</Button></Link>} />
          {budgets.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{b.label}</p>
                <p style={{ fontSize: 11, color: b.pct > 80 ? C.danger : b.pct > 60 ? C.warning : C.success, fontWeight: 600 }}>
                  {b.pct}% — {b.budget}
                </p>
              </div>
              <Progress pct={b.pct} />
            </div>
          ))}
          <p style={{ fontSize: 10, color: C.subtle, fontStyle: 'italic', marginTop: 8 }}>
            Données budgétaires factices — à brancher sur le module Finances en prochaine étape.
          </p>
        </Card>

        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="État des commissions" />
            {commissionStats.map((c, i) => (
              <Link key={c.id} href="/commissions" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < commissionStats.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.lateCount > 0 ? C.danger : c.activeCount > 8 ? C.warning : C.success, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: C.subtle }}>{c.activeCount} tâches</p>
                  <Badge label={c.nextMeeting} variant={c.lateCount > 0 ? 'danger' : c.activeCount > 8 ? 'warning' : 'default'} />
                </div>
              </Link>
            ))}
          </Card>

          <Card padding={14}>
            <SectionHeader title="Charge par personne" />
            {chargeByPerson.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune tâche active.</p>
            ) : (
              chargeByPerson.map(({ person, count }) => (
                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar initials={person.initials} size={22} color={person.color} />
                  <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{person.fullName}</p>
                  <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>{count} tâche{count > 1 ? 's' : ''}</p>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

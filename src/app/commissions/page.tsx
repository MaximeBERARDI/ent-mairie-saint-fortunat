'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { useTasks } from '@/hooks/useTasks'
import { useTeam } from '@/hooks/useTeam'
import { useCommissions } from '@/hooks/useCommissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useMeetings } from '@/hooks/useMeetings'
import { useComptesRendus } from '@/hooks/useComptesRendus'
import { useDeliberations } from '@/hooks/useDeliberations'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskDetailModal } from '@/components/tasks/TaskDetail'
import { DeliberationsTab } from '@/components/commissions/DeliberationsTab'
import { getPerson, ROLE_LABELS, type Person } from '@/lib/people'
import { formatShortFR, formatLongFR } from '@/lib/dateUtils'
import type { Commission, Task, TaskStatus, Meeting, AgendaItem, CompteRendu, Deliberation } from '@/lib/types'

const CONSEIL_ID = 'conseil-municipal'

type CommView = 'grille' | 'timeline' | 'admin'

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

export default function CommissionsPage() {
  const { tasks, hydrated, createTask, updateTask, deleteTask, addComment, deleteComment } = useTasks()
  const { people, hydrated: teamHydrated, updatePerson } = useTeam()
  const { commissions, hydrated: commHydrated, createCommission, updateCommission, deleteCommission } = useCommissions()
  const { meetings, createMeeting, updateMeeting, deleteMeeting } = useMeetings()
  const { crs } = useComptesRendus()
  const { deliberations, createDeliberation, updateDeliberation, deleteDeliberation } = useDeliberations()
  const { can, currentUserId } = useCurrentUser()
  const canManageCommissions = can('commissions.manage')
  const canManageMembers = canManageCommissions || can('team.edit-roles')
  const [view, setView] = useState<CommView>('grille')
  const [selected, setSelected] = useState<Commission | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [prefillCommissionId, setPrefillCommissionId] = useState<string | undefined>()
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null)

  // Index : commissionId -> liste des référent(e)s
  const responsiblesByCommission = useMemo(() => {
    const map = new Map<string, Person[]>()
    people.forEach(p => {
      if (!p.active) return
      p.responsibleCommissions.forEach(cid => {
        const arr = map.get(cid) ?? []
        arr.push(p)
        map.set(cid, arr)
      })
    })
    return map
  }, [people])

  // Index : commissionId -> membres (Person.commissions)
  const membersByCommission = useMemo(() => {
    const map = new Map<string, Person[]>()
    people.forEach(p => {
      if (!p.active) return
      ;(p.commissions ?? []).forEach(cid => {
        const arr = map.get(cid) ?? []
        arr.push(p)
        map.set(cid, arr)
      })
    })
    return map
  }, [people])

  const tasksByCommission = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach(t => {
      t.commissionIds.forEach(cid => {
        const arr = map.get(cid) ?? []
        arr.push(t)
        map.set(cid, arr)
      })
    })
    return map
  }, [tasks])

  // Index : commissionId -> réunions triées par date croissante
  const meetingsByCommission = useMemo(() => {
    const map = new Map<string, Meeting[]>()
    meetings.forEach(m => {
      const arr = map.get(m.commissionId) ?? []
      arr.push(m)
      map.set(m.commissionId, arr)
    })
    map.forEach(arr => arr.sort((a, b) => a.date.localeCompare(b.date)))
    return map
  }, [meetings])

  // Prochaine réunion à venir par commission (sinon la dernière passée)
  const today = new Date().toISOString().slice(0, 10)
  const nextMeetingByCommission = useMemo(() => {
    const map = new Map<string, Meeting | undefined>()
    meetingsByCommission.forEach((arr, cid) => {
      map.set(cid, arr.find(m => m.date >= today) ?? arr[arr.length - 1])
    })
    return map
  }, [meetingsByCommission, today])

  const crsByCommission = useMemo(() => {
    const map = new Map<string, CompteRendu[]>()
    crs.forEach(cr => {
      if (!cr.commissionId) return
      const arr = map.get(cr.commissionId) ?? []
      arr.push(cr)
      map.set(cr.commissionId, arr)
    })
    map.forEach(arr => arr.sort((a, b) => (b.meetingDate ?? b.importedAt).localeCompare(a.meetingDate ?? a.importedAt)))
    return map
  }, [crs])

  // Construire la liste réelle des commissions avec compteurs dynamiques
  const commissionsWithStats = useMemo<Commission[]>(() => {
    return commissions.map(c => {
      const nm = nextMeetingByCommission.get(c.id)
      return {
        ...c,
        tasks: (tasksByCommission.get(c.id) ?? []).filter(t => t.status !== 'Terminé').length,
        members: (membersByCommission.get(c.id) ?? []).length,
        docs: 0,
        nextMeeting: nm ? `${formatShortFR(nm.date)}${nm.heure ? ` · ${nm.heure}` : ''}` : 'À planifier',
      }
    })
  }, [commissions, tasksByCommission, membersByCommission, nextMeetingByCommission])

  // Conseil Municipal : organe délibérant (tous les élus + la secrétaire de
  // mairie), affiché à part de la grille des commissions. Ses membres sont
  // dérivés du rôle (la composition se gère dans le module Équipe), pas via
  // Person.commissions.
  const conseil = commissionsWithStats.find(c => c.id === CONSEIL_ID) ?? null
  const regularCommissions = useMemo(
    () => commissionsWithStats.filter(c => c.id !== CONSEIL_ID),
    [commissionsWithStats],
  )
  const conseilMembers = useMemo(
    () => people.filter(p => p.active && (p.role !== 'agent' || /secrétaire de mairie|dgs/i.test(p.poste))),
    [people],
  )
  const conseilDeliberations = useMemo(
    () => deliberations.filter(d => (d.commissionId ?? CONSEIL_ID) === CONSEIL_ID),
    [deliberations],
  )

  const handleAddMember = (commissionId: string, personId: string) => {
    const p = people.find(x => x.id === personId)
    if (!p) return
    const next = Array.from(new Set([...(p.commissions ?? []), commissionId]))
    updatePerson(personId, { commissions: next })
  }
  const handleRemoveMember = (commissionId: string, personId: string) => {
    const p = people.find(x => x.id === personId)
    if (!p) return
    updatePerson(personId, { commissions: (p.commissions ?? []).filter(cid => cid !== commissionId) })
  }

  const handleOpenCreateFor = (commissionId: string) => {
    setEditingTask(null)
    setPrefillCommissionId(commissionId)
    setFormOpen(true)
  }
  // Clic sur une tâche → ouvre le panneau de détail (modal).
  // L'édition réelle (formulaire) passe désormais par le bouton "✎ Modifier"
  // à l'intérieur de ce panneau.
  const handleEdit = (task: Task) => {
    setDetailOpenId(task.id)
  }
  const handleOpenForm = (task: Task) => {
    setDetailOpenId(null)
    setEditingTask(task)
    setPrefillCommissionId(undefined)
    setFormOpen(true)
  }
  const handleSubmit = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data)
    } else {
      createTask(data)
    }
  }
  const handleDelete = () => {
    if (!editingTask) return
    deleteTask(editingTask.id)
    setFormOpen(false)
  }

  const initialFormData = editingTask ?? (prefillCommissionId ? { commissionIds: [prefillCommissionId] } as Partial<Task> : undefined)

  if (!hydrated || !teamHydrated) {
    return (
      <Shell title="Commissions">
        <Card padding={14}>
          <SkeletonList rows={6} />
        </Card>
      </Shell>
    )
  }

  const COMM_VIEWS: [CommView, string][] = [
    ['grille', 'Grille'],
    ['timeline', 'Timeline'],
    ...(canManageCommissions ? [['admin', '⚙ Administration'] as [CommView, string]] : []),
  ]

  return (
    <Shell title="Commissions">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div className="tabs-buttons" style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {COMM_VIEWS.map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null) }}
              style={{
                minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '5px 12px', borderRadius: 6,
                background: v === view ? '#fff' : 'transparent',
                border: 'none',
                color: v === view ? C.fg : C.muted,
                fontSize: 12, fontWeight: v === view ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className="tabs-select"
          value={view}
          onChange={e => { setView(e.target.value as CommView); setSelected(null) }}
          aria-label="Choisir une vue des commissions"
          style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${C.border}`, padding: '0 12px', fontSize: 14, color: C.fg, background: '#fff', fontFamily: "'DM Sans', sans-serif" }}
        >
          {COMM_VIEWS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
      </div>

      {view === 'grille' && !selected && (
        <>
          {conseil && (
            <Card
              padding={18}
              hover
              onClick={() => setSelected(conseil)}
              style={{ cursor: 'pointer', borderLeft: `4px solid ${conseil.color}`, marginBottom: 'var(--gap)', background: 'var(--accent-light)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: conseil.color }}>Organe délibérant</span>
                  <p style={{ fontSize: 18, fontWeight: 700, color: C.fg, margin: '4px 0 2px' }}>Conseil Municipal</p>
                  <p style={{ fontSize: 12, color: C.subtle }}>Tâches, réunions, délibérations et comptes rendus du conseil — gérés par le secrétariat de mairie.</p>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {([
                    [conseilMembers.length, 'Membres'],
                    [conseilDeliberations.length, 'Délibérations'],
                    [conseil.tasks, 'Tâches actives'],
                  ] as [number, string][]).map(([v, l]) => (
                    <div key={l}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: conseil.color, lineHeight: 1 }}>{v}</p>
                      <p style={{ fontSize: 11, color: C.subtle }}>{l}</p>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: conseil.color, fontWeight: 600 }}>Ouvrir →</span>
              </div>
            </Card>
          )}
          <GrilleView
            commissions={regularCommissions}
            tasks={tasks}
            responsiblesByCommission={responsiblesByCommission}
            onSelect={setSelected}
          />
        </>
      )}
      {view === 'grille' && selected && (
        <DetailView
          commission={selected}
          allCommissions={commissionsWithStats}
          commissionTasks={tasksByCommission.get(selected.id) ?? []}
          responsibles={responsiblesByCommission.get(selected.id) ?? []}
          members={selected.id === CONSEIL_ID ? conseilMembers : (membersByCommission.get(selected.id) ?? [])}
          allPeople={people}
          meetings={meetingsByCommission.get(selected.id) ?? []}
          crs={crsByCommission.get(selected.id) ?? []}
          deliberations={selected.id === CONSEIL_ID ? conseilDeliberations : []}
          canManageMembers={selected.id === CONSEIL_ID ? false : canManageMembers}
          canManageCommissions={canManageCommissions}
          onBack={() => setSelected(null)}
          onSelectOther={setSelected}
          onCreateTask={() => handleOpenCreateFor(selected.id)}
          onEditTask={handleEdit}
          onUpdateTask={updateTask}
          onAddMember={(pid) => handleAddMember(selected.id, pid)}
          onRemoveMember={(pid) => handleRemoveMember(selected.id, pid)}
          onCreateMeeting={createMeeting}
          onUpdateMeeting={updateMeeting}
          onDeleteMeeting={deleteMeeting}
          onCreateDeliberation={createDeliberation}
          onUpdateDeliberation={updateDeliberation}
          onDeleteDeliberation={deleteDeliberation}
        />
      )}
      {view === 'timeline' && (
        <TimelineView
          commissions={commissionsWithStats}
          tasks={tasks}
          meetings={meetings}
          membersByCommission={membersByCommission}
        />
      )}
      {view === 'admin' && canManageCommissions && (
        <CommissionsAdminView
          commissions={commissions}
          tasks={tasks}
          onCreate={createCommission}
          onUpdate={updateCommission}
          onDelete={deleteCommission}
        />
      )}

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setPrefillCommissionId(undefined) }}
        onSubmit={handleSubmit}
        onDelete={editingTask?.id ? handleDelete : undefined}
        initial={initialFormData}
      />

      {(() => {
        const t = detailOpenId ? tasks.find(x => x.id === detailOpenId) : null
        if (!t) return null
        return (
          <TaskDetailModal
            open={!!t}
            task={t}
            currentUserId={currentUserId}
            onClose={() => setDetailOpenId(null)}
            onUpdate={(patch) => updateTask(t.id, patch)}
            onCycleStatus={() => {
              const order: Task['status'][] = ['À faire', 'En cours', 'En attente validation', 'Terminé']
              updateTask(t.id, { status: order[(order.indexOf(t.status) + 1) % order.length] })
            }}
            onEdit={() => handleOpenForm(t)}
            onDelete={() => { deleteTask(t.id); setDetailOpenId(null) }}
            onAddComment={(content) => addComment(t.id, currentUserId, content)}
            onDeleteComment={(commentId) => deleteComment(t.id, commentId)}
          />
        )
      })()}
    </Shell>
  )
}

// ── Vue Grille ────────────────────────────────────────────────────────────────

function GrilleView({
  commissions, tasks, responsiblesByCommission, onSelect,
}: {
  commissions: Commission[]
  tasks: Task[]
  responsiblesByCommission: Map<string, Person[]>
  onSelect: (c: Commission) => void
}) {
  // Activité récente : tâches les plus récemment créées avec une commission
  const recent = tasks
    .filter(t => t.commissionIds.length > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

  return (
    <div>
      <SectionHeader title="Mes commissions" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {commissions.map(com => {
          const responsibles = responsiblesByCommission.get(com.id) ?? []
          return (
            <Card
              key={com.id}
              padding={16}
              hover
              style={{ cursor: 'pointer', borderTop: `3px solid ${com.color}` }}
              onClick={() => onSelect(com)}
            >
              <p style={{ fontSize: 14, color: C.fg, fontWeight: 700, marginBottom: 12 }}>{com.name}</p>

              {/* Référents */}
              {responsibles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Référent{responsibles.length > 1 ? 's' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                    {responsibles.map(p => (
                      <div key={p.id} title={p.fullName} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Avatar initials={p.initials} color={p.color} size={20} />
                        <span style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p.prenom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.tasks}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>Tâches actives</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.members}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>Membres</p>
                </div>
              </div>
              <Separator my={10} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: C.subtle }}>Prochaine réunion</p>
                <Badge label={com.nextMeeting} variant={com.tasks > 8 ? 'danger' : 'default'} />
              </div>
            </Card>
          )
        })}
        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
          <p style={{ fontSize: 12, color: C.subtle }}>+ Nouvelle commission</p>
        </div>
      </div>

      <Card padding={16}>
        <SectionHeader title="Activité récente des commissions" />
        {recent.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune activité récente.</p>
        ) : (
          recent.map((t, i) => {
            const c = commissions.find(c => c.id === t.commissionIds[0])
            const assignees = t.assigneeIds.map(id => getPerson(id)).filter(Boolean)
            const assigneeLabel = assignees.length === 0
              ? 'Non assignée'
              : assignees.length === 1 ? assignees[0]!.fullName : `${assignees.length} personnes`
            return (
              <Row
                key={t.id}
                label={t.label}
                sub={`${c?.name ?? 'Commission'} · ${assigneeLabel}`}
                badge={t.status}
                badgeVariant={STATUS_VARIANTS[t.status]}
                right={formatShortFR(t.dueDate)}
                dot={c?.color ?? C.subtle}
                last={i === recent.length - 1}
              />
            )
          })
        )}
      </Card>
    </div>
  )
}

// ── Vue Détail ────────────────────────────────────────────────────────────────

function DetailView({
  commission, allCommissions, commissionTasks, responsibles, members, allPeople,
  meetings, crs, deliberations, canManageMembers, canManageCommissions,
  onBack, onSelectOther, onCreateTask, onEditTask, onUpdateTask,
  onAddMember, onRemoveMember, onCreateMeeting, onUpdateMeeting, onDeleteMeeting,
  onCreateDeliberation, onUpdateDeliberation, onDeleteDeliberation,
}: {
  commission: Commission
  allCommissions: Commission[]
  commissionTasks: Task[]
  responsibles: Person[]
  members: Person[]
  allPeople: Person[]
  meetings: Meeting[]
  crs: CompteRendu[]
  deliberations: Deliberation[]
  canManageMembers: boolean
  canManageCommissions: boolean
  onBack: () => void
  onSelectOther: (c: Commission) => void
  onCreateTask: () => void
  onEditTask: (t: Task) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
  onAddMember: (personId: string) => void
  onRemoveMember: (personId: string) => void
  onCreateMeeting: (data: Omit<Meeting, 'id' | 'createdAt'>) => void
  onUpdateMeeting: (id: string, patch: Partial<Meeting>) => void
  onDeleteMeeting: (id: string) => void
  onCreateDeliberation: (data: Omit<Deliberation, 'id' | 'createdAt'>) => void
  onUpdateDeliberation: (id: string, patch: Partial<Deliberation>) => void
  onDeleteDeliberation: (id: string) => void
}) {
  const isConseil = commission.id === CONSEIL_ID
  type DetailTab = 'taches' | 'reunions' | 'deliberations' | 'cr' | 'membres' | 'ged'
  const [activeTab, setActiveTab] = useState<DetailTab>('taches')

  const activeTasks = commissionTasks.filter(t => t.status !== 'Terminé')
  const doneTasks = commissionTasks.filter(t => t.status === 'Terminé')
  const today = new Date().toISOString().slice(0, 10)
  const nextMeeting = meetings.find(m => m.date >= today) ?? meetings[meetings.length - 1]

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: '100%' }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: C.subtle, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commissions</p>
        {allCommissions.map(c => (
          <button
            key={c.id}
            onClick={() => onSelectOther(c)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 6, background: c.id === commission.id ? 'var(--accent-light)' : 'transparent',
              marginBottom: 2, cursor: 'pointer', width: '100%', border: 'none',
              fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: c.id === commission.id ? 'var(--accent)' : C.fg, fontWeight: c.id === commission.id ? 600 : 400, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
            {c.tasks > 0 && <Badge label={c.tasks} variant={c.tasks > 10 ? 'danger' : c.tasks > 5 ? 'warning' : 'default'} />}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <button onClick={onBack} style={{ fontSize: 12, color: C.subtle, cursor: 'pointer', background: 'none', border: 'none', padding: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>← Toutes les commissions</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, color: C.fg, fontWeight: 700 }}>{commission.name}</h2>
              <Badge label={`${activeTasks.length} tâches actives`} variant={activeTasks.length > 8 ? 'danger' : 'default'} />
            </div>
            <p style={{ fontSize: 12, color: C.subtle }}>
              Prochaine réunion : {nextMeeting
                ? `${formatLongFR(nextMeeting.date)}${nextMeeting.heure ? ` à ${nextMeeting.heure}` : ''}${nextMeeting.lieu ? ` · ${nextMeeting.lieu}` : ''}`
                : 'à planifier'}
            </p>
            {responsibles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: C.subtle, fontWeight: 600 }}>
                  Référent{responsibles.length > 1 ? 's' : ''} :
                </span>
                {responsibles.map(p => (
                  <Link key={p.id} href="/equipe" style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px 3px 3px',
                    background: `${p.color}10`,
                    border: `1px solid ${p.color}40`,
                    borderRadius: 16,
                    textDecoration: 'none',
                  }}>
                    <Avatar initials={p.initials} color={p.color} size={20} />
                    <span style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p.fullName}</span>
                    <span style={{ fontSize: 12, color: C.subtle }}>· {ROLE_LABELS[p.role]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/comptes-rendus"><Button size="sm">Comptes rendus</Button></Link>
            <Button variant="primary" size="sm" onClick={onCreateTask}>+ Tâche</Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 16 }}>
          <KpiCard label="Tâches actives" value={activeTasks.length} color={commission.color} />
          <KpiCard label="Terminées" value={doneTasks.length} color={C.success} />
          <KpiCard label="Réunions" value={meetings.length} color={C.slate} />
          <KpiCard label="Membres" value={members.length} color={C.green} />
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
          {(isConseil
            ? (['taches', 'reunions', 'deliberations', 'cr', 'membres', 'ged'] as DetailTab[])
            : (['taches', 'reunions', 'cr', 'membres', 'ged'] as DetailTab[])
          ).map(tab => {
            const labels: Record<DetailTab, string> = { taches: 'Tâches', reunions: 'Réunions', deliberations: 'Délibérations', cr: 'Comptes rendus', membres: 'Membres', ged: 'GED' }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 16px', border: 'none', background: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${commission.color}` : '2px solid transparent',
                  color: activeTab === tab ? commission.color : C.muted,
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 14, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: -1,
                }}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {activeTab === 'taches' && (
          <CommissionTasksTab
            activeTasks={activeTasks}
            doneTasks={doneTasks}
            onCreateTask={onCreateTask}
            onEditTask={onEditTask}
            onUpdateTask={onUpdateTask}
          />
        )}
        {activeTab === 'reunions' && (
          <MeetingsTab
            commissionId={commission.id}
            color={commission.color}
            meetings={meetings}
            people={allPeople}
            canManage={canManageCommissions}
            onCreate={onCreateMeeting}
            onUpdate={onUpdateMeeting}
            onDelete={onDeleteMeeting}
          />
        )}
        {activeTab === 'deliberations' && (
          <DeliberationsTab
            commissionId={commission.id}
            color={commission.color}
            deliberations={deliberations}
            canManage={canManageCommissions}
            onCreate={onCreateDeliberation}
            onUpdate={onUpdateDeliberation}
            onDelete={onDeleteDeliberation}
          />
        )}
        {activeTab === 'cr' && (
          <Card padding={14}>
            <SectionHeader level={3} title="Comptes rendus" actions={<Link href="/comptes-rendus"><Button variant="primary" size="sm">+ Importer</Button></Link>} />
            {crs.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, padding: '10px 0' }}>
                Aucun compte rendu pour cette commission. Importez-en un depuis le module Comptes rendus.
              </p>
            ) : crs.map((cr, i) => (
              <Row
                key={cr.id}
                label={cr.filename}
                sub={cr.taskIds.length > 0 ? `${cr.taskIds.length} tâche${cr.taskIds.length > 1 ? 's' : ''} extraite${cr.taskIds.length > 1 ? 's' : ''}` : 'Importé'}
                badge={cr.taskIds.length > 0 ? 'IA' : undefined}
                badgeVariant="primary"
                right={formatShortFR(cr.meetingDate ?? cr.importedAt)}
                last={i === crs.length - 1}
              />
            ))}
          </Card>
        )}
        {activeTab === 'membres' && (
          <MemberManager
            members={members}
            allPeople={allPeople}
            responsibles={responsibles}
            canManage={canManageMembers}
            onAdd={onAddMember}
            onRemove={onRemoveMember}
          />
        )}
        {activeTab === 'ged' && (
          <Card padding={14}>
            <SectionHeader level={3} title="Gestion Électronique de Documents" />
            <p style={{ fontSize: 13, color: C.subtle, padding: '8px 0', lineHeight: 1.6 }}>
              La GED par commission (dépôt et partage de fichiers volumineux) sera disponible
              avec le stockage cloud (Supabase Storage / OVH). En attendant, les comptes rendus
              se gèrent dans l&apos;onglet « Comptes rendus », et les pièces jointes restent
              attachées à chaque tâche.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

// ── Onglet Membres ──────────────────────────────────────────────────────────

function MemberManager({
  members, allPeople, responsibles, canManage, onAdd, onRemove,
}: {
  members: Person[]
  allPeople: Person[]
  responsibles: Person[]
  canManage: boolean
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
}) {
  const [picker, setPicker] = useState('')
  const memberIds = new Set(members.map(m => m.id))
  const candidates = allPeople
    .filter(p => p.active && !memberIds.has(p.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  return (
    <Card padding={14}>
      <SectionHeader level={3} title={`Membres (${members.length})`} />
      {canManage && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select
            value={picker}
            onChange={e => setPicker(e.target.value)}
            aria-label="Choisir une personne à ajouter"
            style={{ flex: 1, height: 36, borderRadius: 6, border: `1px solid ${C.border}`, padding: '0 10px', fontSize: 13, color: C.fg, background: '#fff', fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="">+ Ajouter un membre…</option>
            {candidates.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} — {p.poste}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" disabled={!picker} onClick={() => { if (picker) { onAdd(picker); setPicker('') } }}>
            Ajouter
          </Button>
        </div>
      )}
      {members.length === 0 ? (
        <p style={{ fontSize: 12, color: C.subtle, padding: '10px 0' }}>Aucun membre défini.</p>
      ) : members.map((p, i) => {
        const isResponsible = responsibles.some(r => r.id === p.id)
        return (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <Avatar initials={p.initials} size={32} color={p.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{p.fullName}</p>
                {isResponsible && <Badge label="Référent(e)" variant="primary" />}
                {p.canSign && <Badge label="✍ Signataire" variant="terra" />}
              </div>
              <p style={{ fontSize: 12, color: C.subtle }}>{p.poste}</p>
            </div>
            <Badge label={ROLE_LABELS[p.role]} variant={p.role === 'agent' ? 'default' : 'primary'} />
            {canManage && (
              <button
                onClick={() => onRemove(p.id)}
                title="Retirer de la commission"
                style={{ padding: '3px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', color: C.subtle, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}
              >
                Retirer
              </button>
            )}
          </div>
        )
      })}
    </Card>
  )
}

// ── Onglet Réunions ───────────────────────────────────────────────────────────

function MeetingsTab({
  commissionId, color, meetings, people, canManage, onCreate, onUpdate, onDelete,
}: {
  commissionId: string
  color: string
  meetings: Meeting[]
  people: Person[]
  canManage: boolean
  onCreate: (data: Omit<Meeting, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, patch: Partial<Meeting>) => void
  onDelete: (id: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = meetings.filter(m => m.date >= today)
  const past = meetings.filter(m => m.date < today).reverse()

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (m: Meeting) => { setEditing(m); setFormOpen(true) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card padding={14}>
        <SectionHeader
          level={3}
          title={`Réunions à venir (${upcoming.length})`}
          actions={canManage ? <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvelle réunion</Button> : undefined}
        />
        {upcoming.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle, padding: '10px 0' }}>Aucune réunion planifiée.</p>
        ) : upcoming.map((m, i) => (
          <MeetingRow key={m.id} meeting={m} people={people} color={color} canManage={canManage} onEdit={() => openEdit(m)} onDelete={() => onDelete(m.id)} last={i === upcoming.length - 1} />
        ))}
      </Card>

      {past.length > 0 && (
        <Card padding={14}>
          <SectionHeader level={3} title={`Réunions passées (${past.length})`} />
          {past.slice(0, 8).map((m, i) => (
            <MeetingRow key={m.id} meeting={m} people={people} color={color} canManage={canManage} onEdit={() => openEdit(m)} onDelete={() => onDelete(m.id)} last={i === Math.min(past.length, 8) - 1} past />
          ))}
        </Card>
      )}

      {formOpen && (
        <MeetingForm
          commissionId={commissionId}
          people={people}
          initial={editing}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

function MeetingRow({
  meeting, people, color, canManage, onEdit, onDelete, last, past,
}: {
  meeting: Meeting
  people: Person[]
  color: string
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  last: boolean
  past?: boolean
}) {
  const nameOf = (id?: string) => people.find(p => p.id === id)?.fullName
  return (
    <div style={{ padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.border}`, opacity: past ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: C.fg, fontWeight: 600 }}>{meeting.titre || 'Réunion'}</p>
            <span style={{ fontSize: 12, color: C.subtle }}>
              {formatLongFR(meeting.date)}{meeting.heure ? ` · ${meeting.heure}` : ''}{meeting.lieu ? ` · ${meeting.lieu}` : ''}
            </span>
          </div>
          {meeting.agenda.length > 0 && (
            <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {meeting.agenda.map((item, idx) => (
                <li key={idx} style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>
                  {item.titre}
                  {nameOf(item.rapporteurId) && <span style={{ color: C.subtle }}> — {nameOf(item.rapporteurId)}</span>}
                </li>
              ))}
            </ol>
          )}
          {meeting.notes && <p style={{ fontSize: 12, color: C.subtle, marginTop: 4, fontStyle: 'italic' }}>{meeting.notes}</p>}
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={onEdit} title="Modifier" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>✎</button>
            <button onClick={() => { if (confirm('Supprimer cette réunion ?')) onDelete() }} title="Supprimer" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 12 }}>×</button>
          </div>
        )}
      </div>
    </div>
  )
}

function MeetingForm({
  commissionId, people, initial, onClose, onCreate, onUpdate,
}: {
  commissionId: string
  people: Person[]
  initial: Meeting | null
  onClose: () => void
  onCreate: (data: Omit<Meeting, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, patch: Partial<Meeting>) => void
}) {
  const [date, setDate] = useState(initial?.date ?? '')
  const [heure, setHeure] = useState(initial?.heure ?? '')
  const [lieu, setLieu] = useState(initial?.lieu ?? '')
  const [titre, setTitre] = useState(initial?.titre ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [agenda, setAgenda] = useState<AgendaItem[]>(initial?.agenda ?? [])

  const addItem = () => setAgenda(prev => [...prev, { titre: '' }])
  const updateItem = (i: number, patch: Partial<AgendaItem>) => setAgenda(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const removeItem = (i: number) => setAgenda(prev => prev.filter((_, idx) => idx !== i))

  const submit = () => {
    if (!date) { alert('La date est requise.'); return }
    const cleanAgenda = agenda
      .map(it => ({ titre: it.titre.trim(), rapporteurId: it.rapporteurId || undefined }))
      .filter(it => it.titre)
    const payload = {
      commissionId, date,
      heure: heure.trim() || undefined,
      lieu: lieu.trim() || undefined,
      titre: titre.trim() || undefined,
      notes: notes.trim() || undefined,
      agenda: cleanAgenda,
    }
    if (initial) onUpdate(initial.id, payload)
    else onCreate(payload)
    onClose()
  }

  const field: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${C.border}`, borderRadius: 6, padding: '0 10px', fontSize: 13, color: C.fg, background: '#fff', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,28,22,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={initial ? 'Modifier la réunion' : 'Nouvelle réunion'} style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.fg, margin: 0, flex: 1 }}>{initial ? 'Modifier la réunion' : 'Nouvelle réunion'}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 20, color: C.subtle }}>×</button>
        </div>
        <div style={{ padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></div>
            <div><label style={lbl}>Heure</label><input type="time" value={heure} onChange={e => setHeure(e.target.value)} style={field} /></div>
          </div>
          <div><label style={lbl}>Titre</label><input type="text" value={titre} onChange={e => setTitre(e.target.value)} placeholder="ex: Préparation du budget" style={field} /></div>
          <div><label style={lbl}>Lieu</label><input type="text" value={lieu} onChange={e => setLieu(e.target.value)} placeholder="ex: Salle du conseil" style={field} /></div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={lbl}>Ordre du jour</label>
              <button type="button" onClick={addItem} style={{ fontSize: 12, color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Ajouter un point</button>
            </div>
            {agenda.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle }}>Aucun point. Cliquez sur « + Ajouter un point ».</p>
            ) : agenda.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.subtle, width: 16, flexShrink: 0 }}>{i + 1}.</span>
                <input type="text" value={it.titre} onChange={e => updateItem(i, { titre: e.target.value })} placeholder="Intitulé du point" style={{ ...field, flex: 1 }} />
                <select value={it.rapporteurId ?? ''} onChange={e => updateItem(i, { rapporteurId: e.target.value || undefined })} aria-label="Rapporteur" style={{ ...field, width: 150, flexShrink: 0 }}>
                  <option value="">Rapporteur…</option>
                  {people.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
                <button type="button" onClick={() => removeItem(i)} aria-label="Retirer le point" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', color: C.subtle, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>

          <div><label style={lbl}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...field, height: 'auto', padding: 8, resize: 'vertical' as const }} /></div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: C.bg }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={submit} disabled={!date}>{initial ? 'Enregistrer' : 'Créer la réunion'}</Button>
        </div>
      </div>
    </div>
  )
}

function CommissionTasksTab({
  activeTasks, doneTasks, onCreateTask, onEditTask, onUpdateTask,
}: {
  activeTasks: Task[]
  doneTasks: Task[]
  onCreateTask: () => void
  onEditTask: (t: Task) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <Card padding={14}>
        <SectionHeader
          level={3}
          title={`Tâches en cours (${activeTasks.length})`}
          actions={<Button variant="primary" size="sm" onClick={onCreateTask}>+ Nouvelle tâche</Button>}
        />
        {activeTasks.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0' }}>
            Aucune tâche active dans cette commission. Cliquez sur « + Nouvelle tâche » pour en créer une.
          </p>
        ) : (
          activeTasks.map((t, i) => (
            <CommissionTaskRow
              key={t.id}
              task={t}
              last={i === activeTasks.length - 1}
              onClick={() => onEditTask(t)}
              onComplete={() => onUpdateTask(t.id, { status: 'Terminé' })}
            />
          ))
        )}
      </Card>

      {doneTasks.length > 0 && (
        <Card padding={14}>
          <SectionHeader level={3} title={`Terminées (${doneTasks.length})`} />
          {doneTasks.slice(0, 5).map((t, i) => (
            <CommissionTaskRow
              key={t.id}
              task={t}
              last={i === Math.min(doneTasks.length, 5) - 1}
              onClick={() => onEditTask(t)}
              onComplete={() => onUpdateTask(t.id, { status: 'En cours' })}
              completeLabel="Rouvrir"
            />
          ))}
        </Card>
      )}
    </div>
  )
}

function CommissionTaskRow({
  task, last, onClick, onComplete, completeLabel,
}: {
  task: Task
  last: boolean
  onClick: () => void
  onComplete: () => void
  completeLabel?: string
}) {
  const assignees = task.assigneeIds
    .map(id => getPerson(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0',
        borderBottom: last ? 'none' : `1px solid ${C.border}`,
        cursor: 'pointer',
        opacity: task.status === 'Terminé' ? 0.6 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 2, textDecoration: task.status === 'Terminé' ? 'line-through' : 'none' }}>
          {task.label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {assignees.length > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'flex' }}>
                {assignees.slice(0, 3).map((a, idx) => (
                  <span key={a.id} style={{ marginLeft: idx === 0 ? 0 : -5 }}>
                    <Avatar initials={a.initials} size={16} color={a.color} />
                  </span>
                ))}
              </span>
              <span style={{ fontSize: 12, color: C.subtle }}>
                {assignees.length === 1 ? assignees[0].fullName : `${assignees.length} personnes`}
              </span>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Non assignée</span>
          )}
          {task.dueDate && <span style={{ fontSize: 12, color: C.subtle }}>· {formatShortFR(task.dueDate)}</span>}
          {(task.documents?.length ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: C.subtle }}>· 📎 {task.documents!.length}</span>
          )}
        </div>
      </div>
      <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
      <Badge label={task.status} variant={STATUS_VARIANTS[task.status]} />
      <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
        <Button size="sm" onClick={onComplete}>
          {completeLabel ?? '✓ Terminer'}
        </Button>
      </div>
    </div>
  )
}

// ── Timeline (vue rapport global) ────────────────────────────────────────────

function TimelineView({ commissions, tasks, meetings, membersByCommission }: { commissions: Commission[]; tasks: Task[]; meetings: Meeting[]; membersByCommission: Map<string, Person[]> }) {
  const today = new Date().toISOString().slice(0, 10)
  const upcomingMeetings = meetings
    .filter(m => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const commById = new Map(commissions.map(c => [c.id, c]))

  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'Terminé' && t.dueDate)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {commissions.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: `1px solid ${c.color}40`, background: `${c.color}12` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              <span style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>{c.name.split(' ')[0]} ({c.tasks})</span>
            </div>
          ))}
        </div>
      </div>

      <Card padding={16} style={{ marginBottom: 'var(--gap)' }}>
        <SectionHeader title="Vue Gantt — Mai 2026" />
        <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 180 }}>
          {['1', '5', '10', '15', '20', '25', '30'].map(d => (
            <p key={d} style={{ flex: 1, fontSize: 12, color: C.subtle, textAlign: 'center' }}>{d} mai</p>
          ))}
        </div>
        {commissions.map(com => {
          const ctasks = tasks.filter(t => t.commissionIds.includes(com.id) && t.status !== 'Terminé')
          return (
            <div key={com.id} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
              <div style={{ width: 180, flexShrink: 0, paddingRight: 12 }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{com.name.split(' ').slice(0, 2).join(' ')}</p>
                <p style={{ fontSize: 11, color: C.subtle }}>{ctasks.length} tâches · {membersByCommission.get(com.id)?.length ?? 0} membres</p>
              </div>
              <div style={{ flex: 1, height: 28, background: `${com.color}12`, borderRadius: 6, position: 'relative', border: `1px solid ${com.color}25` }}>
                {ctasks.slice(0, 5).map((t, ti) => {
                  const day = t.dueDate ? Number(t.dueDate.slice(8, 10)) : 15
                  const left = Math.max(0, Math.min(95, ((day - 1) / 30) * 100))
                  return (
                    <div
                      key={t.id}
                      title={t.label}
                      style={{
                        position: 'absolute', left: `${left}%`,
                        top: 4 + (ti % 2) * 10, height: 8,
                        width: 14,
                        background: t.priority === 'Urgent' ? C.danger : com.color,
                        borderRadius: 2,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </Card>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card padding={14} style={{ flex: 1 }}>
          <SectionHeader title="Prochaines réunions" />
          {upcomingMeetings.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune réunion planifiée.</p>
          ) : upcomingMeetings.slice(0, 5).map((m, i) => {
            const c = commById.get(m.commissionId)
            return (
              <Row
                key={m.id}
                label={`${formatLongFR(m.date)} — ${c?.name ?? 'Commission'}`}
                sub={`${m.heure ? m.heure + ' · ' : ''}${m.titre ?? 'Réunion'}`}
                dot={c?.color ?? C.subtle}
                last={i === Math.min(upcomingMeetings.length, 5) - 1}
              />
            )
          })}
        </Card>
        <Card padding={14} style={{ flex: 1 }}>
          <SectionHeader title="Échéances proches" />
          {upcomingDeadlines.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Pas d&apos;échéance imminente.</p>
          ) : (
            upcomingDeadlines.map((t, i) => {
              const c = commissions.find(c => c.id === t.commissionIds[0])
              return (
                <Row
                  key={t.id}
                  label={t.label}
                  sub={`${formatShortFR(t.dueDate)} — ${c?.name.split(' ')[0] ?? '—'}`}
                  badge={t.priority}
                  badgeVariant={PRIORITY_VARIANTS[t.priority]}
                  dot={c?.color ?? C.subtle}
                  last={i === upcomingDeadlines.length - 1}
                />
              )
            })
          )}
        </Card>
      </div>
    </div>
  )
}

// ── Vue Administration : CRUD commissions ────────────────────────────────────

const COMMISSION_COLORS = [
  '#6ab123', '#2563a8', '#e9722a', '#d4493c', '#94a3b8', '#7d4d9e', '#3b9c8a',
]

function CommissionsAdminView({
  commissions, tasks, onCreate, onUpdate, onDelete,
}: {
  commissions: Commission[]
  tasks: Task[]
  onCreate: (data: Omit<Commission, 'id'>) => void
  onUpdate: (id: string, patch: Partial<Commission>) => void
  onDelete: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editMeeting, setEditMeeting] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COMMISSION_COLORS[0])
  const [newMeeting, setNewMeeting] = useState('')

  const startEdit = (c: Commission) => {
    setEditingId(c.id)
    setEditName(c.name)
    setEditColor(c.color)
    setEditMeeting(c.nextMeeting)
  }
  const saveEdit = (id: string) => {
    onUpdate(id, { name: editName.trim(), color: editColor, nextMeeting: editMeeting.trim() })
    setEditingId(null)
  }
  const cancelEdit = () => setEditingId(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreate({ name: newName.trim(), color: newColor, nextMeeting: newMeeting.trim() || 'À planifier', tasks: 0, members: 0, docs: 0 })
    setNewName('')
    setNewMeeting('')
    setNewColor(COMMISSION_COLORS[0])
    setShowCreate(false)
  }

  const handleDelete = (c: Commission) => {
    const linked = tasks.filter(t => t.commissionIds.includes(c.id))
    if (linked.length > 0) {
      alert(`Impossible : ${linked.length} tâche${linked.length > 1 ? 's' : ''} sont rattachées à cette commission. Détachez-les ou supprimez-les d'abord.`)
      return
    }
    if (confirm(`Supprimer définitivement la commission « ${c.name} » ?`)) {
      onDelete(c.id)
    }
  }

  return (
    <Card padding={16}>
      <SectionHeader
        title="Administration des commissions"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(s => !s)}>
            {showCreate ? 'Annuler' : '+ Nouvelle commission'}
          </Button>
        }
      />
      <p style={{ fontSize: 12, color: C.subtle, marginBottom: 14 }}>
        Renommer, créer ou supprimer les commissions municipales. La suppression est bloquée si des tâches y sont rattachées.
      </p>

      {showCreate && (
        <Card padding={12} style={{ marginBottom: 14, background: C.greenLight, borderColor: C.green }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 100px', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Nom *</p>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="ex: Développement du village"
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Prochaine réunion</p>
              <input
                type="text"
                value={newMeeting}
                onChange={e => setNewMeeting(e.target.value)}
                placeholder="ex: 15 juin"
                style={inputStyle}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Couleur</p>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <Button variant="primary" size="sm" disabled={!newName.trim()} onClick={handleCreate}>Créer</Button>
          </div>
        </Card>
      )}

      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.4fr 1fr 80px 130px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['', 'Nom', 'Prochaine réunion', 'Tâches', 'Couleur', 'Actions'].map(h => (
            <p key={h} style={{ fontSize: 12, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {commissions.map((c, i) => {
          const linkedTasks = tasks.filter(t => t.commissionIds.includes(c.id))
          const isEditing = editingId === c.id
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.4fr 1fr 80px 130px', gap: 10, padding: '10px 14px', alignItems: 'center', borderBottom: i < commissions.length - 1 ? `1px solid ${C.border}` : 'none', background: isEditing ? `${C.green}06` : '#fff', fontSize: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: isEditing ? editColor : c.color }} />
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  style={inputStyle}
                />
              ) : (
                <p style={{ color: C.fg, fontWeight: 600 }}>{c.name}</p>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editMeeting}
                  onChange={e => setEditMeeting(e.target.value)}
                  style={inputStyle}
                />
              ) : (
                <p style={{ color: C.subtle }}>{c.nextMeeting}</p>
              )}
              <p style={{ color: linkedTasks.length > 0 ? C.fg : C.subtle, fontFamily: "'JetBrains Mono', monospace" }}>
                {linkedTasks.length}
              </p>
              {isEditing ? (
                <ColorPicker value={editColor} onChange={setEditColor} />
              ) : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.subtle }}>{c.color}</span>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(c.id)} title="Enregistrer" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.success}`, background: C.successLight, color: C.success, cursor: 'pointer', fontSize: 12 }}>✓</button>
                    <button onClick={cancelEdit} title="Annuler" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>×</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} title="Renommer / modifier" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}>✎</button>
                    <button
                      onClick={() => handleDelete(c)}
                      title={linkedTasks.length > 0 ? 'Détachez les tâches avant' : 'Supprimer'}
                      disabled={linkedTasks.length > 0}
                      style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: linkedTasks.length > 0 ? 'not-allowed' : 'pointer', opacity: linkedTasks.length > 0 ? 0.4 : 1, fontSize: 12 }}
                    >×</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </Card>
    </Card>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {COMMISSION_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={`Couleur ${c}`}
          style={{
            width: 18, height: 18, borderRadius: 4,
            background: c,
            border: value === c ? `2px solid ${C.fg}` : '1px solid #00000020',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 30,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  background: '#fff',
  padding: '0 8px',
  fontSize: 12,
  color: C.fg,
  fontFamily: "'DM Sans', sans-serif",
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
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
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskDetailModal } from '@/components/tasks/TaskDetail'
import { getPerson, PEOPLE, ROLE_LABELS, type Person } from '@/lib/people'
import { formatShortFR } from '@/lib/dateUtils'
import type { Commission, Task, TaskStatus } from '@/lib/types'

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

// Référentiel des membres par commission (provisoire — sera persisté plus tard)
const COMMISSION_MEMBERS: Record<string, string[]> = {
  'admin-finance': ['p-jm', 'p-rg', 'p-md', 'p-pr', 'p-im'],
  'developpement': ['p-jm', 'p-rg', 'p-lf', 'p-cv'],
  'enfance': ['p-sb', 'p-md', 'p-lb', 'p-im'],
  'animation': ['p-sb', 'p-im', 'p-cv'],
  'travaux': ['p-md', 'p-lf', 'p-tg', 'p-mf', 'p-ad'],
}

export default function CommissionsPage() {
  const { tasks, hydrated, createTask, updateTask, deleteTask, addComment, deleteComment } = useTasks()
  const { people, hydrated: teamHydrated } = useTeam()
  const { commissions, hydrated: commHydrated, createCommission, updateCommission, deleteCommission } = useCommissions()
  const { can, currentUserId } = useCurrentUser()
  const canManageCommissions = can('commissions.manage')
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

  const tasksByCommission = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach(t => {
      if (!t.commissionId) return
      const arr = map.get(t.commissionId) ?? []
      arr.push(t)
      map.set(t.commissionId, arr)
    })
    return map
  }, [tasks])

  // Construire la liste réelle des commissions avec compteurs dynamiques
  const commissionsWithStats = useMemo(() => {
    return commissions.map(c => {
      const ctasks = tasksByCommission.get(c.id) ?? []
      return {
        ...c,
        tasks: ctasks.filter(t => t.status !== 'Terminé').length,
        members: COMMISSION_MEMBERS[c.id]?.length ?? c.members,
      }
    })
  }, [tasksByCommission])

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

  const initialFormData = editingTask ?? (prefillCommissionId ? { commissionId: prefillCommissionId } as Partial<Task> : undefined)

  if (!hydrated || !teamHydrated) {
    return (
      <Shell title="Commissions">
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 13 }}>Chargement…</div>
      </Shell>
    )
  }

  return (
    <Shell title="Commissions">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([
            ['grille', 'Grille'],
            ['timeline', 'Timeline'],
            ...(canManageCommissions ? [['admin', '⚙ Administration']] as [CommView, string][] : []),
          ] as [CommView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null) }}
              style={{
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
        <div style={{ flex: 1 }} />
      </div>

      {view === 'grille' && !selected && (
        <GrilleView
          commissions={commissionsWithStats}
          tasks={tasks}
          responsiblesByCommission={responsiblesByCommission}
          onSelect={setSelected}
        />
      )}
      {view === 'grille' && selected && (
        <DetailView
          commission={selected}
          allCommissions={commissionsWithStats}
          commissionTasks={tasksByCommission.get(selected.id) ?? []}
          responsibles={responsiblesByCommission.get(selected.id) ?? []}
          onBack={() => setSelected(null)}
          onSelectOther={setSelected}
          onCreateTask={() => handleOpenCreateFor(selected.id)}
          onEditTask={handleEdit}
          onUpdateTask={updateTask}
        />
      )}
      {view === 'timeline' && (
        <TimelineView commissions={commissionsWithStats} tasks={tasks} />
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
    .filter(t => t.commissionId)
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
              <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 12 }}>{com.name}</p>

              {/* Référents */}
              {responsibles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 9, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Référent{responsibles.length > 1 ? 's' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                    {responsibles.map(p => (
                      <div key={p.id} title={p.fullName} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Avatar initials={p.initials} color={p.color} size={20} />
                        <span style={{ fontSize: 10, color: C.fg, fontWeight: 500 }}>{p.prenom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.tasks}</p>
                  <p style={{ fontSize: 9, color: C.subtle }}>Tâches actives</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.members}</p>
                  <p style={{ fontSize: 9, color: C.subtle }}>Membres</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.docs}</p>
                  <p style={{ fontSize: 9, color: C.subtle }}>Documents</p>
                </div>
              </div>
              <Separator my={10} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: C.subtle }}>Prochaine réunion</p>
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
            const c = commissions.find(c => c.id === t.commissionId)
            const assignee = getPerson(t.assigneeId)
            return (
              <Row
                key={t.id}
                label={t.label}
                sub={`${c?.name ?? 'Commission'} · ${assignee?.fullName ?? '—'}`}
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
  commission, allCommissions, commissionTasks, responsibles,
  onBack, onSelectOther, onCreateTask, onEditTask, onUpdateTask,
}: {
  commission: Commission
  allCommissions: Commission[]
  commissionTasks: Task[]
  responsibles: Person[]
  onBack: () => void
  onSelectOther: (c: Commission) => void
  onCreateTask: () => void
  onEditTask: (t: Task) => void
  onUpdateTask: (id: string, patch: Partial<Task>) => void
}) {
  const [activeTab, setActiveTab] = useState<'taches' | 'cr' | 'membres' | 'ged'>('taches')

  const activeTasks = commissionTasks.filter(t => t.status !== 'Terminé')
  const doneTasks = commissionTasks.filter(t => t.status === 'Terminé')
  const memberIds = COMMISSION_MEMBERS[commission.id] ?? []
  const members = memberIds.map(id => getPerson(id)).filter(Boolean)

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: '100%' }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: C.subtle, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commissions</p>
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
            <p style={{ fontSize: 12, color: C.subtle }}>Prochaine réunion : {commission.nextMeeting} · 14h00</p>
            {responsibles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>
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
                    <span style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{p.fullName}</span>
                    <span style={{ fontSize: 10, color: C.subtle }}>· {ROLE_LABELS[p.role]}</span>
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
          <KpiCard label="Documents" value={commission.docs} color={C.slate} />
          <KpiCard label="Membres" value={members.length} color={C.green} />
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
          {(['taches', 'cr', 'membres', 'ged'] as const).map(tab => {
            const labels = { taches: 'Tâches', cr: 'Comptes rendus', membres: 'Membres', ged: 'GED' }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', border: 'none', background: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${commission.color}` : '2px solid transparent',
                  color: activeTab === tab ? commission.color : C.muted,
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
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
        {activeTab === 'cr' && (
          <Card padding={14}>
            <SectionHeader title="Comptes rendus" actions={<Link href="/comptes-rendus"><Button variant="primary" size="sm">+ Importer</Button></Link>} />
            <Row label="CR — Réunion du 12 avril 2026" sub="Uploadé · 3 tâches extraites" badge="IA" badgeVariant="primary" right="12 avr." />
            <Row label="CR — Réunion du 5 mars 2026" sub="Archivé" badge="Archivé" right="5 mars" last />
          </Card>
        )}
        {activeTab === 'membres' && (
          <Card padding={14}>
            <SectionHeader
              title={`Membres (${members.length})`}
              actions={<Link href="/equipe"><Button size="sm">Gérer l&apos;équipe →</Button></Link>}
            />
            {members.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, padding: '10px 0' }}>Aucun membre défini.</p>
            ) : members.map((p, i) => {
              const isResponsible = responsibles.some(r => r.id === p!.id)
              return (
                <Link
                  key={p!.id}
                  href="/equipe"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', textDecoration: 'none',
                    borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <Avatar initials={p!.initials} size={32} color={p!.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{p!.fullName}</p>
                      {isResponsible && <Badge label="Référent(e)" variant="primary" />}
                      {p!.canSign && <Badge label="✍ Signataire" variant="terra" />}
                    </div>
                    <p style={{ fontSize: 10, color: C.subtle }}>{p!.poste}</p>
                  </div>
                  <Badge label={ROLE_LABELS[p!.role]} variant={p!.role === 'agent' ? 'default' : 'primary'} />
                </Link>
              )
            })}
          </Card>
        )}
        {activeTab === 'ged' && (
          <Card padding={14}>
            <SectionHeader title="Gestion Électronique de Documents" actions={<Button variant="primary" size="sm">+ Ajouter</Button>} />
            <p style={{ fontSize: 11, color: C.subtle, padding: '8px 0', fontStyle: 'italic' }}>
              La GED par commission sera connectée au stockage cloud (S3 / OVH) lors de la migration vers la base de données réelle.
            </p>
            {[
              { name: 'CR Réunion 12 avril 2026.pdf', size: '245 Ko', date: '12 avr.', type: 'CR' },
              { name: 'PLU Secteur Nord — Dossier.pdf', size: '1.2 Mo', date: '5 avr.', type: 'Dossier' },
              { name: 'Délibération 2026-015.pdf', size: '89 Ko', date: '1 avr.', type: 'Délib.' },
            ].map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none', opacity: 0.7 }}>
                <div style={{ width: 32, height: 32, background: C.infoLight, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: C.info, fontWeight: 700 }}>PDF</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                  <p style={{ fontSize: 10, color: C.subtle }}>{doc.size} · {doc.date} (placeholder)</p>
                </div>
                <Badge label={doc.type} variant="info" />
              </div>
            ))}
          </Card>
        )}
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
          <SectionHeader title={`Terminées (${doneTasks.length})`} />
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
  const assignee = getPerson(task.assigneeId)
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
          {assignee && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Avatar initials={assignee.initials} size={16} color={assignee.color} />
              <span style={{ fontSize: 10, color: C.subtle }}>{assignee.fullName}</span>
            </span>
          )}
          {task.dueDate && <span style={{ fontSize: 10, color: C.subtle }}>· {formatShortFR(task.dueDate)}</span>}
          {(task.documents?.length ?? 0) > 0 && (
            <span style={{ fontSize: 10, color: C.subtle }}>· 📎 {task.documents!.length}</span>
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

function TimelineView({ commissions, tasks }: { commissions: Commission[]; tasks: Task[] }) {
  const upcomingMeetings = commissions
    .map(c => ({ ...c, dateLabel: c.nextMeeting }))
    .sort((a, b) => parseDay(a.nextMeeting) - parseDay(b.nextMeeting))

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
              <span style={{ fontSize: 10, color: c.color, fontWeight: 600 }}>{c.name.split(' ')[0]} ({c.tasks})</span>
            </div>
          ))}
        </div>
      </div>

      <Card padding={16} style={{ marginBottom: 'var(--gap)' }}>
        <SectionHeader title="Vue Gantt — Mai 2026" />
        <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 180 }}>
          {['1', '5', '10', '15', '20', '25', '30'].map(d => (
            <p key={d} style={{ flex: 1, fontSize: 10, color: C.subtle, textAlign: 'center' }}>{d} mai</p>
          ))}
        </div>
        {commissions.map(com => {
          const ctasks = tasks.filter(t => t.commissionId === com.id && t.status !== 'Terminé')
          return (
            <div key={com.id} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
              <div style={{ width: 180, flexShrink: 0, paddingRight: 12 }}>
                <p style={{ fontSize: 11, color: C.fg, fontWeight: 600 }}>{com.name.split(' ').slice(0, 2).join(' ')}</p>
                <p style={{ fontSize: 9, color: C.subtle }}>{ctasks.length} tâches · {COMMISSION_MEMBERS[com.id]?.length ?? 0} membres</p>
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
          {upcomingMeetings.slice(0, 5).map((m, i) => (
            <Row
              key={m.id}
              label={`${m.nextMeeting} — ${m.name}`}
              sub="14h00"
              dot={m.color}
              last={i === Math.min(upcomingMeetings.length, 5) - 1}
            />
          ))}
        </Card>
        <Card padding={14} style={{ flex: 1 }}>
          <SectionHeader title="Échéances proches" />
          {upcomingDeadlines.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Pas d&apos;échéance imminente.</p>
          ) : (
            upcomingDeadlines.map((t, i) => {
              const c = commissions.find(c => c.id === t.commissionId)
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

function parseDay(label: string): number {
  const m = label.match(/^(\d+)/)
  return m ? Number(m[1]) : 99
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
    const linked = tasks.filter(t => t.commissionId === c.id)
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
      <p style={{ fontSize: 11, color: C.subtle, marginBottom: 14 }}>
        Renommer, créer ou supprimer les commissions municipales. La suppression est bloquée si des tâches y sont rattachées.
      </p>

      {showCreate && (
        <Card padding={12} style={{ marginBottom: 14, background: C.greenLight, borderColor: C.green }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 100px', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Nom *</p>
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
              <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Prochaine réunion</p>
              <input
                type="text"
                value={newMeeting}
                onChange={e => setNewMeeting(e.target.value)}
                placeholder="ex: 15 juin"
                style={inputStyle}
              />
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>Couleur</p>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <Button variant="primary" size="sm" disabled={!newName.trim()} onClick={handleCreate}>Créer</Button>
          </div>
        </Card>
      )}

      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.4fr 1fr 80px 130px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['', 'Nom', 'Prochaine réunion', 'Tâches', 'Couleur', 'Actions'].map(h => (
            <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {commissions.map((c, i) => {
          const linkedTasks = tasks.filter(t => t.commissionId === c.id)
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
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.subtle }}>{c.color}</span>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(c.id)} title="Enregistrer" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.success}`, background: C.successLight, color: C.success, cursor: 'pointer', fontSize: 12 }}>✓</button>
                    <button onClick={cancelEdit} title="Annuler" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>×</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} title="Renommer / modifier" style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>✎</button>
                    <button
                      onClick={() => handleDelete(c)}
                      title={linkedTasks.length > 0 ? 'Détachez les tâches avant' : 'Supprimer'}
                      disabled={linkedTasks.length > 0}
                      style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: linkedTasks.length > 0 ? 'not-allowed' : 'pointer', opacity: linkedTasks.length > 0 ? 0.4 : 1, fontSize: 11 }}
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

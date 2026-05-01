'use client'

import { useMemo, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Separator } from '@/components/ui/Separator'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { useTasks } from '@/hooks/useTasks'
import { COMMISSIONS } from '@/lib/data'
import { getPerson, getPersonName, CURRENT_USER_ID } from '@/lib/people'
import { formatShortFR, formatLongFR, relativeBucket } from '@/lib/dateUtils'
import type { Task, TaskStatus } from '@/lib/types'

type TaskView = 'liste' | 'kanban' | 'calendrier'
type TaskFilter = 'toutes' | 'mes' | 'en-attente' | 'terminees'

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

function getCommissionName(id?: string): string | null {
  if (!id) return null
  return COMMISSIONS.find(c => c.id === id)?.name ?? null
}

function getCommissionShortName(id?: string): string | null {
  const name = getCommissionName(id)
  if (!name) return null
  return name.split(' ')[0]
}

function getCommissionColor(id?: string): string {
  return COMMISSIONS.find(c => c.id === id)?.color ?? C.slate
}

export default function TachesPage() {
  const { tasks, hydrated, createTask, updateTask, deleteTask } = useTasks()
  const [view, setView] = useState<TaskView>('liste')
  const [filter, setFilter] = useState<TaskFilter>('toutes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const counts = useMemo(() => ({
    toutes: tasks.length,
    mes: tasks.filter(t => t.assigneeId === CURRENT_USER_ID || t.validatorId === CURRENT_USER_ID).length,
    enAttente: tasks.filter(t => t.status === 'En attente validation').length,
    terminees: tasks.filter(t => t.status === 'Terminé').length,
  }), [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'mes') return t.assigneeId === CURRENT_USER_ID || t.validatorId === CURRENT_USER_ID
      if (filter === 'en-attente') return t.status === 'En attente validation'
      if (filter === 'terminees') return t.status === 'Terminé'
      return true
    })
  }, [tasks, filter])

  const selected = selectedId ? tasks.find(t => t.id === selectedId) ?? null : null

  const openCreate = () => { setEditingTask(null); setFormOpen(true) }
  const openEdit = (task: Task) => { setEditingTask(task); setFormOpen(true) }
  const handleSubmit = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data)
    } else {
      const created = createTask(data)
      setSelectedId(created.id)
    }
  }
  const handleDelete = () => {
    if (!editingTask) return
    deleteTask(editingTask.id)
    if (selectedId === editingTask.id) setSelectedId(null)
    setFormOpen(false)
  }

  const cycleStatus = (task: Task) => {
    const order: TaskStatus[] = ['À faire', 'En cours', 'En attente validation', 'Terminé']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    updateTask(task.id, { status: next })
  }

  if (!hydrated) {
    return (
      <Shell title="Mes tâches" notif={5}>
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 13 }}>Chargement…</div>
      </Shell>
    )
  }

  return (
    <Shell title="Mes tâches" notif={5}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['liste', 'Liste'], ['kanban', 'Kanban'], ['calendrier', 'Calendrier']] as [TaskView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
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
        <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvelle tâche</Button>
      </div>

      {view === 'liste' && (
        <ListeView
          tasks={filteredTasks}
          counts={counts}
          filter={filter}
          setFilter={setFilter}
          selected={selected}
          setSelected={(t) => setSelectedId(t?.id ?? null)}
          onEdit={openEdit}
          onUpdate={updateTask}
          onCycleStatus={cycleStatus}
        />
      )}
      {view === 'kanban' && (
        <KanbanView tasks={tasks} onEdit={openEdit} onCycleStatus={cycleStatus} />
      )}
      {view === 'calendrier' && (
        <TaskCalendar
          tasks={tasks}
          onTaskClick={t => { setSelectedId(t.id); openEdit(t) }}
          onCreateForDate={(iso) => {
            setEditingTask({ dueDate: iso } as Task)
            setFormOpen(true)
          }}
        />
      )}

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingTask?.id ? handleDelete : undefined}
        initial={editingTask ?? undefined}
      />
    </Shell>
  )
}

// ── Vue Liste ─────────────────────────────────────────────────────────────────

function ListeView({
  tasks, counts, filter, setFilter, selected, setSelected, onEdit, onUpdate, onCycleStatus,
}: {
  tasks: Task[]
  counts: { toutes: number; mes: number; enAttente: number; terminees: number }
  filter: TaskFilter
  setFilter: (f: TaskFilter) => void
  selected: Task | null
  setSelected: (t: Task | null) => void
  onEdit: (t: Task) => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onCycleStatus: (t: Task) => void
}) {
  const FILTERS: [TaskFilter, string][] = [
    ['toutes', `Toutes (${counts.toutes})`],
    ['mes', `Mes tâches (${counts.mes})`],
    ['en-attente', `En attente (${counts.enAttente})`],
    ['terminees', `Terminées (${counts.terminees})`],
  ]

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: v === filter ? C.green : '#fff',
              border: `1px solid ${v === filter ? C.green : C.border}`,
              color: v === filter ? '#fff' : C.muted,
              fontSize: 12, fontWeight: v === filter ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 3 }} padding={0}>
          <div style={{ display: 'flex', gap: 0, padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            {['Tâche', 'Commission', 'Assigné à', 'Échéance', 'Priorité', 'Statut'].map((h, i) => (
              <span key={i} style={{ flex: [3, 1.5, 1.6, 1.2, 1, 1.4][i], fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 12 }}>
              Aucune tâche dans cette vue.
            </div>
          ) : (
            tasks.map((t, i) => {
              const assignee = getPerson(t.assigneeId)
              const commName = getCommissionShortName(t.commissionId)
              const commColor = getCommissionColor(t.commissionId)
              return (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 0, padding: '10px 14px',
                    borderBottom: i < tasks.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: selected?.id === t.id ? `${C.green}08` : '#fff',
                    cursor: 'pointer',
                    opacity: t.status === 'Terminé' ? 0.6 : 1,
                  }}
                >
                  <div style={{ flex: 3 }}>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: selected?.id === t.id ? 600 : 400, textDecoration: t.status === 'Terminé' ? 'line-through' : 'none' }}>{t.label}</p>
                    {(t.documents?.length ?? 0) > 0 && (
                      <p style={{ fontSize: 10, color: C.subtle, marginTop: 2 }}>📎 {t.documents!.length} pièce{t.documents!.length > 1 ? 's' : ''} jointe{t.documents!.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div style={{ flex: 1.5 }}>
                    {commName ? <Tag label={commName} color={commColor} /> : <span style={{ fontSize: 11, color: C.subtle }}>—</span>}
                  </div>
                  <div style={{ flex: 1.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {assignee && <Avatar initials={assignee.initials} size={20} color={assignee.color} />}
                    <p style={{ fontSize: 11, color: C.muted }}>{assignee ? assignee.fullName : '—'}</p>
                  </div>
                  <div style={{ flex: 1.2 }}><p style={{ fontSize: 11, color: C.muted }}>{formatShortFR(t.dueDate)}</p></div>
                  <div style={{ flex: 1 }}><Badge label={t.priority} variant={PRIORITY_VARIANTS[t.priority]} /></div>
                  <div style={{ flex: 1.4 }}><Badge label={t.status} variant={STATUS_VARIANTS[t.status]} /></div>
                </div>
              )
            })
          )}
        </Card>

        {selected ? (
          <DetailPanel
            task={selected}
            onClose={() => setSelected(null)}
            onEdit={() => onEdit(selected)}
            onUpdate={(patch) => onUpdate(selected.id, patch)}
            onCycleStatus={() => onCycleStatus(selected)}
          />
        ) : (
          <Card style={{ flex: 1.8 }} padding={20}>
            <p style={{ fontSize: 12, color: C.subtle, textAlign: 'center', padding: '20px 0' }}>
              Sélectionnez une tâche pour voir le détail.
            </p>
          </Card>
        )}
      </div>
    </>
  )
}

// ── Panneau de détail ─────────────────────────────────────────────────────────

function DetailPanel({
  task, onClose, onEdit, onUpdate, onCycleStatus,
}: {
  task: Task
  onClose: () => void
  onEdit: () => void
  onUpdate: (patch: Partial<Task>) => void
  onCycleStatus: () => void
}) {
  const assignee = getPerson(task.assigneeId)
  const validator = getPerson(task.validatorId)
  const commName = getCommissionName(task.commissionId)

  return (
    <Card style={{ flex: 1.8 }} padding={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <p style={{ flex: 1, fontSize: 13, color: C.fg, fontWeight: 700 }}>{task.label}</p>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 18, lineHeight: 1 }}
        >×</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge label={task.status} variant={STATUS_VARIANTS[task.status]} />
        <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
      </div>

      <Separator my={10} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        <DetailRow label="Commission" value={commName ?? 'Sans commission'} />
        <DetailRow
          label="Assigné à"
          value={assignee ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar initials={assignee.initials} size={20} color={assignee.color} />
              {assignee.fullName}
            </span>
          ) : '—'}
        />
        {task.status === 'En attente validation' && validator && (
          <DetailRow
            label="Validateur"
            value={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar initials={validator.initials} size={20} color={validator.color} />
                {validator.fullName}
              </span>
            }
          />
        )}
        <DetailRow label="Échéance" value={formatLongFR(task.dueDate)} />
      </div>

      {task.description && (
        <>
          <Separator my={10} />
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Description</p>
          <div style={{
            background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6,
            padding: 10, fontSize: 12, color: C.fg, whiteSpace: 'pre-wrap', lineHeight: 1.4,
          }}>
            {task.description}
          </div>
        </>
      )}

      {(task.documents?.length ?? 0) > 0 && (
        <>
          <Separator my={10} />
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>
            Pièces jointes ({task.documents!.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {task.documents!.map(doc => (
              <a
                key={doc.id}
                href={doc.dataUrl}
                download={doc.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '6px 10px', textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 14 }}>📎</span>
                <span style={{ flex: 1, fontSize: 11, color: C.fg, fontWeight: 500 }}>{doc.name}</span>
                <span style={{ fontSize: 10, color: C.subtle }}>
                  {doc.size < 1024 ? `${doc.size} o` : doc.size < 1024 * 1024 ? `${(doc.size / 1024).toFixed(0)} Ko` : `${(doc.size / 1024 / 1024).toFixed(1)} Mo`}
                </span>
              </a>
            ))}
          </div>
        </>
      )}

      <Separator my={12} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {task.status !== 'Terminé' ? (
          <Button variant="primary" size="sm" onClick={() => onUpdate({ status: 'Terminé' })}>
            ✓ Marquer terminée
          </Button>
        ) : (
          <Button size="sm" onClick={() => onUpdate({ status: 'En cours' })}>
            ↺ Rouvrir la tâche
          </Button>
        )}
        <Button size="sm" onClick={onCycleStatus}>Changer le statut →</Button>
        <Button size="sm" onClick={onEdit}>✎ Modifier</Button>
      </div>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 11, color: C.subtle, width: 90, flexShrink: 0 }}>{label}</p>
      <div style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

// ── Vue Kanban ────────────────────────────────────────────────────────────────

function KanbanView({
  tasks, onEdit, onCycleStatus,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onCycleStatus: (t: Task) => void
}) {
  const COLUMNS: { status: TaskStatus; color: string }[] = [
    { status: 'À faire', color: C.subtle },
    { status: 'En cours', color: C.warning },
    { status: 'En attente validation', color: C.info },
    { status: 'Terminé', color: C.success },
  ]

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 220px)' }}>
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.status)
        return (
          <div key={col.status} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{col.status}</p>
              <div style={{ marginLeft: 'auto', background: C.ph, borderRadius: 9999, padding: '1px 7px' }}>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{columnTasks.length}</p>
              </div>
            </div>
            <div style={{
              flex: 1, background: `${col.color}10`, borderRadius: 8, padding: 8,
              display: 'flex', flexDirection: 'column', gap: 8,
              border: `1px dashed ${col.color}40`, overflowY: 'auto',
            }}>
              {columnTasks.length === 0 && (
                <p style={{ fontSize: 11, color: C.subtle, textAlign: 'center', padding: '12px 0' }}>—</p>
              )}
              {columnTasks.map(card => {
                const assignee = getPerson(card.assigneeId)
                const commName = getCommissionShortName(card.commissionId)
                const commColor = getCommissionColor(card.commissionId)
                return (
                  <Card
                    key={card.id}
                    padding={10}
                    style={{
                      cursor: 'pointer',
                      opacity: card.status === 'Terminé' ? 0.7 : 1,
                    }}
                  >
                    <div onClick={() => onEdit(card)}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 6 }}>{card.label}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        {assignee && <Avatar initials={assignee.initials} size={18} color={assignee.color} />}
                        <p style={{ flex: 1, fontSize: 10, color: C.subtle }}>
                          {assignee ? assignee.fullName : '—'}
                        </p>
                        {card.dueDate && <span style={{ fontSize: 10, color: C.subtle }}>{formatShortFR(card.dueDate)}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {commName && <Tag label={commName} color={commColor} />}
                        <Badge label={card.priority} variant={PRIORITY_VARIANTS[card.priority]} />
                        {(card.documents?.length ?? 0) > 0 && (
                          <span style={{ fontSize: 10, color: C.subtle }}>📎 {card.documents!.length}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <Button
                        size="sm"
                        style={{ flex: 1, fontSize: 10, padding: '3px 6px' }}
                        onClick={() => onCycleStatus(card)}
                      >
                        → Suivant
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

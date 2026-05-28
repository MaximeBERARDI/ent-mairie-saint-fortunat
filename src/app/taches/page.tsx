'use client'

import { useMemo, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { SkeletonKpis, SkeletonList } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Separator } from '@/components/ui/Separator'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { TaskDetailContent, TaskDetailModal } from '@/components/tasks/TaskDetail'
import { useTasks } from '@/hooks/useTasks'
import { useCommissions } from '@/hooks/useCommissions'
import type { Commission } from '@/lib/types'
import { getPerson, getPersonName } from '@/lib/people'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatShortFR, formatLongFR, relativeBucket } from '@/lib/dateUtils'
import type { Task, TaskStatus } from '@/lib/types'

type TaskView = 'liste' | 'kanban' | 'calendrier'
type TaskFilter = 'toutes' | 'mes' | 'en-attente' | 'terminees'

const TASK_VIEWS: [TaskView, string][] = [['liste', 'Liste'], ['kanban', 'Kanban'], ['calendrier', 'Calendrier']]

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

function getCommissionName(commissions: Commission[], id?: string): string | null {
  if (!id) return null
  return commissions.find(c => c.id === id)?.name ?? null
}

function getCommissionShortName(commissions: Commission[], id?: string): string | null {
  const name = getCommissionName(commissions, id)
  if (!name) return null
  return name.split(' ')[0]
}

function getCommissionColor(commissions: Commission[], id?: string): string {
  return commissions.find(c => c.id === id)?.color ?? C.slate
}

export default function TachesPage() {
  const { tasks, hydrated, createTask, updateTask, deleteTask, addComment, deleteComment } = useTasks()
  const { currentUserId } = useCurrentUser()
  const [view, setView] = useState<TaskView>('liste')
  const [filter, setFilter] = useState<TaskFilter>('mes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    toutes: tasks.length,
    mes: tasks.filter(t => t.assigneeIds.includes(currentUserId) || t.validatorId === currentUserId).length,
    enAttente: tasks.filter(t => t.status === 'En attente validation').length,
    terminees: tasks.filter(t => t.status === 'Terminé').length,
  }), [tasks, currentUserId])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'mes') return t.assigneeIds.includes(currentUserId) || t.validatorId === currentUserId
      if (filter === 'en-attente') return t.status === 'En attente validation'
      if (filter === 'terminees') return t.status === 'Terminé'
      return true
    })
  }, [tasks, filter, currentUserId])

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
        <SkeletonKpis count={4} />
        <Card padding={14}>
          <SkeletonList rows={8} withAvatar />
        </Card>
      </Shell>
    )
  }

  return (
    <Shell title="Mes tâches" notif={5}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div className="tabs-buttons" style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {TASK_VIEWS.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
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
          onChange={e => setView(e.target.value as TaskView)}
          aria-label="Choisir une vue des tâches"
          style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${C.border}`, padding: '0 12px', fontSize: 14, color: C.fg, background: '#fff', fontFamily: "'DM Sans', sans-serif" }}
        >
          {TASK_VIEWS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
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
          onDelete={(id) => { deleteTask(id); if (selectedId === id) setSelectedId(null) }}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
        />
      )}
      {view === 'kanban' && (
        <KanbanView tasks={tasks} onEdit={openEdit} onCycleStatus={cycleStatus} />
      )}
      {view === 'calendrier' && (
        <TaskCalendar
          tasks={tasks}
          onTaskClick={t => setDetailOpenId(t.id)}
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
            onCycleStatus={() => cycleStatus(t)}
            onEdit={() => { setDetailOpenId(null); openEdit(t) }}
            onDelete={() => { deleteTask(t.id); setDetailOpenId(null) }}
            onAddComment={(content) => addComment(t.id, currentUserId, content)}
            onDeleteComment={(commentId) => deleteComment(t.id, commentId)}
          />
        )
      })()}
    </Shell>
  )
}

// ── Vue Liste ─────────────────────────────────────────────────────────────────

function ListeView({
  tasks, counts, filter, setFilter, selected, setSelected, onEdit, onUpdate, onCycleStatus,
  onDelete, onAddComment, onDeleteComment,
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
  onDelete: (id: string) => void
  onAddComment: (taskId: string, authorId: string, content: string) => void
  onDeleteComment: (taskId: string, commentId: string) => void
}) {
  const { commissions } = useCommissions()
  const { currentUserId } = useCurrentUser()
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
              <span key={i} style={{ flex: [3, 1.5, 1.6, 1.2, 1, 1.4][i], fontSize: 12, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 12 }}>
              Aucune tâche dans cette vue.
            </div>
          ) : (
            tasks.map((t, i) => {
              const assignees = t.assigneeIds
                .map(id => getPerson(id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
              const commName = getCommissionShortName(commissions, t.commissionIds[0])
              const commColor = getCommissionColor(commissions, t.commissionIds[0])
              const extraComms = Math.max(0, t.commissionIds.length - 1)
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
                      <p style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>📎 {t.documents!.length} pièce{t.documents!.length > 1 ? 's' : ''} jointe{t.documents!.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {commName ? (
                      <>
                        <Tag label={commName} color={commColor} />
                        {extraComms > 0 && <span style={{ fontSize: 11, color: C.subtle }}>+{extraComms}</span>}
                      </>
                    ) : <span style={{ fontSize: 12, color: C.subtle }}>—</span>}
                  </div>
                  <div style={{ flex: 1.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {assignees.length > 0 ? (
                      <>
                        <span style={{ display: 'flex' }}>
                          {assignees.slice(0, 3).map((a, idx) => (
                            <span key={a.id} style={{ marginLeft: idx === 0 ? 0 : -6 }}>
                              <Avatar initials={a.initials} size={20} color={a.color} />
                            </span>
                          ))}
                        </span>
                        <p style={{ fontSize: 12, color: C.muted }}>
                          {assignees.length === 1 ? assignees[0].fullName : `${assignees.length} personnes`}
                        </p>
                      </>
                    ) : <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Non assignée</p>}
                  </div>
                  <div style={{ flex: 1.2 }}><p style={{ fontSize: 12, color: C.muted }}>{formatShortFR(t.dueDate)}</p></div>
                  <div style={{ flex: 1 }}><Badge label={t.priority} variant={PRIORITY_VARIANTS[t.priority]} /></div>
                  <div style={{ flex: 1.4 }}><Badge label={t.status} variant={STATUS_VARIANTS[t.status]} /></div>
                </div>
              )
            })
          )}
        </Card>

        {selected ? (
          <Card style={{ flex: 1.8 }} padding={16}>
            <TaskDetailContent
              task={selected}
              currentUserId={currentUserId}
              onClose={() => setSelected(null)}
              onEdit={() => onEdit(selected)}
              onUpdate={(patch) => onUpdate(selected.id, patch)}
              onCycleStatus={() => onCycleStatus(selected)}
              onDelete={() => onDelete(selected.id)}
              onAddComment={(content) => onAddComment(selected.id, currentUserId, content)}
              onDeleteComment={(commentId) => onDeleteComment(selected.id, commentId)}
              compact
            />
          </Card>
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

// ── Vue Kanban ────────────────────────────────────────────────────────────────

function KanbanView({
  tasks, onEdit, onCycleStatus,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onCycleStatus: (t: Task) => void
}) {
  const { commissions } = useCommissions()
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
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{columnTasks.length}</p>
              </div>
            </div>
            <div style={{
              flex: 1, background: `${col.color}10`, borderRadius: 8, padding: 8,
              display: 'flex', flexDirection: 'column', gap: 8,
              border: `1px dashed ${col.color}40`, overflowY: 'auto',
            }}>
              {columnTasks.length === 0 && (
                <p style={{ fontSize: 12, color: C.subtle, textAlign: 'center', padding: '12px 0' }}>—</p>
              )}
              {columnTasks.map(card => {
                const assignees = card.assigneeIds
                  .map(id => getPerson(id))
                  .filter((p): p is NonNullable<typeof p> => Boolean(p))
                const commName = getCommissionShortName(commissions, card.commissionIds[0])
                const commColor = getCommissionColor(commissions, card.commissionIds[0])
                const extraComms = Math.max(0, card.commissionIds.length - 1)
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
                        {assignees.length > 0 ? (
                          <>
                            <span style={{ display: 'flex' }}>
                              {assignees.slice(0, 3).map((a, idx) => (
                                <span key={a.id} style={{ marginLeft: idx === 0 ? 0 : -6 }}>
                                  <Avatar initials={a.initials} size={18} color={a.color} />
                                </span>
                              ))}
                            </span>
                            <p style={{ flex: 1, fontSize: 12, color: C.subtle }}>
                              {assignees.length === 1 ? assignees[0].fullName : `${assignees.length} personnes`}
                            </p>
                          </>
                        ) : (
                          <p style={{ flex: 1, fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Non assignée</p>
                        )}
                        {card.dueDate && <span style={{ fontSize: 12, color: C.subtle }}>{formatShortFR(card.dueDate)}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {commName && <Tag label={commName} color={commColor} />}
                        {extraComms > 0 && <span style={{ fontSize: 11, color: C.subtle }}>+{extraComms}</span>}
                        <Badge label={card.priority} variant={PRIORITY_VARIANTS[card.priority]} />
                        {(card.documents?.length ?? 0) > 0 && (
                          <span style={{ fontSize: 12, color: C.subtle }}>📎 {card.documents!.length}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <Button
                        size="sm"
                        style={{ flex: 1, fontSize: 12, padding: '3px 6px' }}
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

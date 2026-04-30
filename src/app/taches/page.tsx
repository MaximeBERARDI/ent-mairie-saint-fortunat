'use client'

import { useMemo, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Separator } from '@/components/ui/Separator'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/hooks/useTasks'
import type { Task, TaskStatus } from '@/lib/types'

type TaskView = 'liste' | 'kanban' | 'echeances'
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

const ME = 'Jean Martin'

export default function TachesPage() {
  const { tasks, hydrated, createTask, updateTask, deleteTask } = useTasks()
  const [view, setView] = useState<TaskView>('liste')
  const [filter, setFilter] = useState<TaskFilter>('toutes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const counts = useMemo(() => ({
    toutes: tasks.length,
    mes: tasks.filter(t => t.assignee === ME).length,
    enAttente: tasks.filter(t => t.status === 'En attente validation').length,
    terminees: tasks.filter(t => t.status === 'Terminé').length,
  }), [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'mes') return t.assignee === ME
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
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 13 }}>
          Chargement…
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Mes tâches" notif={5}>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['liste', 'Liste'], ['kanban', 'Kanban'], ['echeances', 'Échéances']] as [TaskView, string][]).map(([v, label]) => (
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
      {view === 'echeances' && (
        <EcheancesView tasks={tasks} onEdit={openEdit} onCycleStatus={cycleStatus} />
      )}

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingTask ? handleDelete : undefined}
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
        {/* Table */}
        <Card style={{ flex: 3 }} padding={0}>
          <div style={{ display: 'flex', gap: 0, padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            {['Tâche', 'Commission', 'Assigné à', 'Échéance', 'Priorité', 'Statut'].map((h, i) => (
              <span key={i} style={{ flex: [3, 2, 1.5, 1.2, 1, 1.2][i], fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
            ))}
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 12 }}>
              Aucune tâche dans cette vue.
            </div>
          ) : (
            tasks.map((t, i) => (
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
                </div>
                <div style={{ flex: 2 }}>{t.commission ? <Tag label={t.commission} /> : <span style={{ fontSize: 11, color: C.subtle }}>—</span>}</div>
                <div style={{ flex: 1.5 }}><p style={{ fontSize: 11, color: C.muted }}>{t.assignee}</p></div>
                <div style={{ flex: 1.2 }}><p style={{ fontSize: 11, color: C.muted }}>{t.dueDate}</p></div>
                <div style={{ flex: 1 }}><Badge label={t.priority} variant={PRIORITY_VARIANTS[t.priority]} /></div>
                <div style={{ flex: 1.2 }}><Badge label={t.status} variant={STATUS_VARIANTS[t.status]} /></div>
              </div>
            ))
          )}
        </Card>

        {/* Detail panel */}
        {selected ? (
          <Card style={{ flex: 1.8 }} padding={16}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <p style={{ flex: 1, fontSize: 13, color: C.fg, fontWeight: 700 }}>{selected.label}</p>
              <button
                onClick={() => setSelected(null)}
                aria-label="Fermer"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 18, lineHeight: 1 }}
              >×</button>
            </div>
            <Badge label={selected.status} variant={STATUS_VARIANTS[selected.status]} />
            <Separator my={12} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {[
                ['Commission', selected.commission || 'Sans commission'],
                ['Assigné à', selected.assignee],
                ['Échéance', selected.dueDate],
                ['Priorité', selected.priority],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <p style={{ fontSize: 11, color: C.subtle, width: 80, flexShrink: 0 }}>{k}</p>
                  <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
                </div>
              ))}
            </div>
            <Separator my={12} />
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Description</p>
            <div style={{
              minHeight: 60, background: selected.description ? '#fff' : C.ph,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: 10,
              marginBottom: 12, fontSize: 12, color: selected.description ? C.fg : C.subtle,
              whiteSpace: 'pre-wrap', lineHeight: 1.4,
            }}>
              {selected.description || 'Aucune description.'}
            </div>
            <Separator my={12} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.status !== 'Terminé' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdate(selected.id, { status: 'Terminé' })}
                >
                  ✓ Marquer terminée
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onUpdate(selected.id, { status: 'En cours' })}
                >
                  ↺ Rouvrir la tâche
                </Button>
              )}
              <Button size="sm" onClick={() => onCycleStatus(selected)}>
                Changer le statut →
              </Button>
              <Button size="sm" onClick={() => onEdit(selected)}>
                ✎ Modifier
              </Button>
            </div>
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
                <p style={{ fontSize: 11, color: C.subtle, textAlign: 'center', padding: '12px 0' }}>
                  —
                </p>
              )}
              {columnTasks.map(card => (
                <Card
                  key={card.id}
                  padding={10}
                  style={{
                    cursor: 'pointer',
                    opacity: card.status === 'Terminé' ? 0.7 : 1,
                  }}
                >
                  <div onClick={() => onEdit(card)}>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 4 }}>{card.label}</p>
                    {card.assignee && (
                      <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>
                        {card.assignee} · {card.dueDate}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {card.commission && <Tag label={card.commission} />}
                      <Badge label={card.priority} variant={PRIORITY_VARIANTS[card.priority]} />
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
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Vue Échéances ────────────────────────────────────────────────────────────

function EcheancesView({
  tasks, onEdit, onCycleStatus,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onCycleStatus: (t: Task) => void
}) {
  const groups = useMemo(() => {
    const today: Task[] = []
    const thisWeek: Task[] = []
    const later: Task[] = []
    const done: Task[] = []
    tasks.forEach(t => {
      if (t.status === 'Terminé') return done.push(t)
      const d = t.dueDate.toLowerCase()
      if (d.includes('1 mai') || d.includes('2 mai') || d.includes('3 mai')) today.push(t)
      else if (d.includes('mai')) thisWeek.push(t)
      else later.push(t)
    })
    return [
      { heading: "Aujourd'hui & demain", items: today },
      { heading: 'Cette semaine', items: thisWeek },
      { heading: 'Plus tard', items: later },
      { heading: 'Terminées', items: done },
    ]
  }, [tasks])

  const totalActive = tasks.filter(t => t.status !== 'Terminé').length
  const totalDone = tasks.filter(t => t.status === 'Terminé').length
  const total = totalActive + totalDone
  const progress = total > 0 ? Math.round((totalDone / total) * 100) : 0

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <div style={{ flex: 3 }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.heading}</p>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <p style={{ fontSize: 10, color: C.subtle }}>{group.items.length} tâche{group.items.length > 1 ? 's' : ''}</p>
            </div>
            {group.items.length === 0 ? (
              <p style={{ fontSize: 11, color: C.subtle, padding: '4px 0 12px' }}>—</p>
            ) : (
              group.items.map(item => (
                <Card
                  key={item.id}
                  padding={12}
                  style={{
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    opacity: item.status === 'Terminé' ? 0.6 : 1,
                  }}
                >
                  <button
                    onClick={() => onCycleStatus(item)}
                    aria-label="Changer le statut"
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `2px solid ${item.status === 'Terminé' ? C.success : C.border}`,
                      background: item.status === 'Terminé' ? C.success : 'transparent',
                      flexShrink: 0,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                    }}
                  >
                    {item.status === 'Terminé' ? '✓' : ''}
                  </button>
                  <div onClick={() => onEdit(item)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ flex: 1, fontSize: 12, color: C.fg, fontWeight: 500, textDecoration: item.status === 'Terminé' ? 'line-through' : 'none' }}>{item.label}</p>
                    {item.commission && <Tag label={item.commission} />}
                    <Badge label={item.dueDate} variant={item.priority === 'Urgent' ? 'danger' : 'default'} />
                  </div>
                </Card>
              ))
            )}
          </div>
        ))}
      </div>
      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 10 }}>Progression</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>{progress}%</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{totalDone} / {total} terminées</p>
              <p style={{ fontSize: 10, color: C.subtle }}>{totalActive} en cours</p>
            </div>
          </div>
          <Progress pct={progress} color={C.green} />
        </Card>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Tâches actives par commission</p>
          <CommissionStats tasks={tasks} />
        </Card>
      </div>
    </div>
  )
}

function CommissionStats({ tasks }: { tasks: Task[] }) {
  const byCommission = new Map<string, number>()
  tasks.filter(t => t.status !== 'Terminé').forEach(t => {
    const key = t.commission || 'Sans commission'
    byCommission.set(key, (byCommission.get(key) ?? 0) + 1)
  })
  const entries = Array.from(byCommission.entries()).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...entries.map(([, v]) => v))
  const palette = [C.terra, C.slate, C.green, C.info, C.warning]

  if (entries.length === 0) {
    return <p style={{ fontSize: 11, color: C.subtle }}>Aucune tâche active.</p>
  }
  return (
    <>
      {entries.map(([n, v], i) => (
        <div key={n} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <p style={{ fontSize: 11, color: C.fg }}>{n}</p>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>{v}</p>
          </div>
          <Progress pct={(v / max) * 100} color={palette[i % palette.length]} />
        </div>
      ))}
    </>
  )
}

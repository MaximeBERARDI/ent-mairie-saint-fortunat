'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Separator } from '@/components/ui/Separator'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { TASKS } from '@/lib/data'
import type { Task } from '@/lib/types'

type TaskView = 'liste' | 'kanban' | 'echeances'
type TaskFilter = 'toutes' | 'mes' | 'en-attente' | 'terminees'

const STATUS_COLORS: Record<string, string> = {
  'À faire': C.subtle,
  'En cours': C.warning,
  'En attente validation': C.info,
  'Terminé': C.success,
}

const PRIORITY_VARIANTS: Record<string, 'danger' | 'warning' | 'default'> = {
  Urgent: 'danger',
  Normal: 'default',
  Faible: 'default',
}

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'default' | 'terra'> = {
  'À faire': 'default',
  'En cours': 'warning',
  'En attente validation': 'terra',
  'Terminé': 'success',
}

export default function TachesPage() {
  const [view, setView] = useState<TaskView>('liste')
  const [filter, setFilter] = useState<TaskFilter>('mes')
  const [selectedTask, setSelectedTask] = useState<Task | null>(TASKS[0])

  const filteredTasks = TASKS.filter(t => {
    if (filter === 'mes') return t.assignee === 'Jean Martin'
    if (filter === 'en-attente') return t.status === 'En attente validation'
    if (filter === 'terminees') return t.status === 'Terminé'
    return true
  })

  return (
    <Shell title="Mes tâches" notif={5}>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
        <Button variant="primary" size="sm">+ Nouvelle tâche</Button>
        <div style={{ width: 140, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <span style={{ fontSize: 11, color: C.subtle }}>Commission…</span>
        </div>
      </div>

      {view === 'liste' && (
        <ListeView tasks={filteredTasks} filter={filter} setFilter={setFilter} selected={selectedTask} setSelected={setSelectedTask} />
      )}
      {view === 'kanban' && <KanbanView />}
      {view === 'echeances' && <EcheancesView tasks={filteredTasks} />}
    </Shell>
  )
}

function ListeView({ tasks, filter, setFilter, selected, setSelected }: {
  tasks: Task[]
  filter: TaskFilter
  setFilter: (f: TaskFilter) => void
  selected: Task | null
  setSelected: (t: Task) => void
}) {
  const FILTERS: [TaskFilter, string][] = [['toutes', 'Toutes (34)'], ['mes', 'Mes tâches (12)'], ['en-attente', 'En attente (5)'], ['terminees', 'Terminées (17)']]
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
          {tasks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: 0, padding: '10px 14px',
                borderBottom: i < tasks.length - 1 ? `1px solid ${C.border}` : 'none',
                background: selected?.id === t.id ? `${C.green}08` : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 3 }}><p style={{ fontSize: 12, color: C.fg, fontWeight: selected?.id === t.id ? 600 : 400 }}>{t.label}</p></div>
              <div style={{ flex: 2 }}>{t.commission ? <Tag label={t.commission} /> : <span style={{ fontSize: 11, color: C.subtle }}>—</span>}</div>
              <div style={{ flex: 1.5 }}><p style={{ fontSize: 11, color: C.muted }}>{t.assignee}</p></div>
              <div style={{ flex: 1.2 }}><p style={{ fontSize: 11, color: C.muted }}>{t.dueDate}</p></div>
              <div style={{ flex: 1 }}><Badge label={t.priority} variant={PRIORITY_VARIANTS[t.priority]} /></div>
              <div style={{ flex: 1.2 }}><Badge label={t.status} variant={STATUS_VARIANTS[t.status] as any} /></div>
            </div>
          ))}
        </Card>

        {/* Detail panel */}
        {selected && (
          <Card style={{ flex: 1.8 }} padding={16}>
            <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 8 }}>{selected.label}</p>
            <Badge label={selected.status} variant={STATUS_VARIANTS[selected.status] as any} />
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
            <div style={{ height: 60, background: C.ph, borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: C.subtle }}>Description de la tâche…</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Commentaires</p>
            <input
              placeholder="Ajouter un commentaire…"
              style={{ width: '100%', height: 40, border: `1px solid ${C.border}`, borderRadius: 6, padding: '0 12px', fontSize: 12, color: C.fg, outline: 'none', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="primary" size="sm">Marquer terminée</Button>
              <Button size="sm">Demander validation</Button>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

function KanbanView() {
  const COLUMNS = [
    { status: 'À faire', count: 6, color: C.subtle, tasks: [
      { t: 'Préparer OJ Conseil 8 mai', tag: 'Admin', prio: 'Normal' },
      { t: 'Signer convention CC Pays de Vernoux', tag: 'Partenariat', prio: 'Normal' },
      { t: 'Mise à jour site internet — actu mai', tag: 'Communication', prio: 'Faible' },
    ]},
    { status: 'En cours', count: 5, color: C.warning, tasks: [
      { t: 'Répondre demande PLU secteur Nord', tag: 'Travaux', prio: 'Urgent' },
      { t: 'Mise à jour registre état civil Q1', tag: 'Admin', prio: 'Faible' },
      { t: 'Suivi chantier route des Combes', tag: 'Travaux', prio: 'Normal' },
    ]},
    { status: 'En attente validation', count: 3, color: C.info, tasks: [
      { t: 'Signer devis éclairage public', tag: 'Travaux', prio: 'Normal' },
      { t: 'Valider délibération 2026-015', tag: 'Admin', prio: 'Urgent' },
    ]},
    { status: 'Terminé', count: 17, color: C.success, tasks: [
      { t: 'Budget primitif 2026 adopté', tag: 'Finance', prio: '—' },
      { t: 'CR commission du 12 avril', tag: 'Admin', prio: '—' },
    ]},
  ]

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 220px)' }}>
      {COLUMNS.map(col => (
        <div key={col.status} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
            <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{col.status}</p>
            <div style={{ marginLeft: 'auto', background: C.ph, borderRadius: 9999, padding: '1px 7px' }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{col.count}</p>
            </div>
          </div>
          <div style={{ flex: 1, background: `${col.color}10`, borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 8, border: `1px dashed ${col.color}40`, overflowY: 'auto' }}>
            {col.tasks.map((card, i) => (
              <Card key={i} padding={10} style={{ cursor: 'pointer' }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 8 }}>{card.t}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag label={card.tag} />
                  <Badge label={card.prio} variant={card.prio === 'Urgent' ? 'danger' : 'default'} />
                </div>
              </Card>
            ))}
            <button style={{ padding: '6px 0', textAlign: 'center', cursor: 'pointer', background: 'none', border: 'none', color: col.color, fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              + Ajouter une tâche
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function EcheancesView({ tasks }: { tasks: Task[] }) {
  const groups = [
    { heading: "Aujourd'hui", items: tasks.filter(t => t.dueDate === '2 mai' || t.dueDate === '5 mai').slice(0, 2) },
    { heading: 'Cette semaine', items: tasks.filter(t => t.dueDate === '8 mai' || t.dueDate === '10 mai') },
    { heading: 'Plus tard', items: tasks.filter(t => t.dueDate === '15 mai' || t.dueDate === '30 mai') },
  ]

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
            {group.items.map((item, i) => (
              <Card key={i} padding={12} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${C.border}`, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, flex: 1 }}>{item.label}</p>
                {item.commission && <Tag label={item.commission} />}
                <Badge label={item.dueDate} variant={item.priority === 'Urgent' ? 'danger' : 'default'} />
              </Card>
            ))}
          </div>
        ))}
      </div>
      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 10 }}>Progression hebdomadaire</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>60%</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>6 / 10 terminées</p>
              <p style={{ fontSize: 10, color: C.subtle }}>cette semaine</p>
            </div>
          </div>
          <Progress pct={60} color={C.green} />
        </Card>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Tâches par commission</p>
          {[['Travaux', 6, C.terra], ['Admin', 4, C.slate], ['Finance', 2, C.green]].map(([n, v, c], i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <p style={{ fontSize: 11, color: C.fg }}>{n}</p>
                <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>{v}</p>
              </div>
              <Progress pct={Number(v) / 6 * 100} color={String(c)} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

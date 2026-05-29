'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { useCommissions } from '@/hooks/useCommissions'
import { useTeam } from '@/hooks/useTeam'
import { isoDate, parseISO, FRENCH_MONTHS } from '@/lib/dateUtils'
import type { Task } from '@/lib/types'

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onCreateForDate?: (iso: string) => void
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const STATUS_COLORS: Record<string, string> = {
  'À faire': C.subtle,
  'En cours': C.warning,
  'En attente validation': C.info,
  'Terminé': C.success,
}

const PRIORITY_BG: Record<string, string> = {
  Urgent: C.danger,
  Normal: C.green,
  Faible: C.subtle,
}

export function TaskCalendar({ tasks, onTaskClick, onCreateForDate }: TaskCalendarProps) {
  // Mois affiché (référence : début mai 2026 si dispo, sinon mois courant)
  const initialMonth = useMemo(() => {
    const taskDates = tasks.map(t => parseISO(t.dueDate)).filter((d): d is Date => d !== null)
    const earliest = taskDates.sort((a, b) => a.getTime() - b.getTime())[0]
    return earliest ?? new Date()
  }, [])

  const [cursor, setCursor] = useState<Date>(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(isoDate(initialMonth))

  // Construire la grille du mois
  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    // Lundi = 0 en mode européen
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ date: Date | null; iso: string | null; inMonth: boolean }> = []

    // Cases vides avant le 1er
    for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, iso: null, inMonth: false })
    // Jours du mois
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      cells.push({ date, iso: isoDate(date), inMonth: true })
    }
    // Compléter pour finir la semaine
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: null, inMonth: false })
    return cells
  }, [cursor])

  // Index : iso date -> tâches
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach(t => {
      if (!t.dueDate) return
      const arr = map.get(t.dueDate) ?? []
      arr.push(t)
      map.set(t.dueDate, arr)
    })
    return map
  }, [tasks])

  const tasksWithoutDate = useMemo(() => tasks.filter(t => !t.dueDate), [tasks])
  const todayISO = isoDate(new Date())
  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) ?? []) : []

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  const goToday = () => {
    const today = new Date()
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(isoDate(today))
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      {/* Calendrier principal */}
      <Card style={{ flex: 3 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ flex: 1, fontSize: 16, color: C.fg, fontWeight: 700 }}>
            {FRENCH_MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={goPrev}>← Préc.</Button>
            <Button size="sm" onClick={goToday}>Aujourd&apos;hui</Button>
            <Button size="sm" onClick={goNext}>Suiv. →</Button>
          </div>
        </div>

        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAYS_FR.map(d => (
            <div key={d} style={{ padding: '4px 6px', fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{d}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(76px, 1fr)', gap: 4 }}>
          {grid.map((cell, idx) => {
            if (!cell.date || !cell.iso) {
              return <div key={`empty-${idx}`} style={{ background: C.ph, borderRadius: 6, opacity: 0.4 }} />
            }
            const dayTasks = tasksByDate.get(cell.iso) ?? []
            const isToday = cell.iso === todayISO
            const isSelected = cell.iso === selectedDate
            const isWeekend = (cell.date.getDay() + 6) % 7 >= 5
            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedDate(cell.iso)}
                onDoubleClick={() => onCreateForDate?.(cell.iso!)}
                style={{
                  position: 'relative',
                  background: isSelected ? `${C.green}15` : isWeekend ? C.bg : '#fff',
                  border: `1px solid ${isSelected ? C.green : isToday ? C.terra : C.border}`,
                  borderRadius: 6,
                  padding: 6,
                  minHeight: 76,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? C.terra : C.fg,
                  }}>
                    {cell.date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      color: C.subtle,
                      fontWeight: 600,
                    }}>{dayTasks.length}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                  {dayTasks.slice(0, 3).map(t => {
                    const color = PRIORITY_BG[t.priority] ?? C.subtle
                    return (
                      <div
                        key={t.id}
                        style={{
                          fontSize: 9,
                          padding: '2px 4px',
                          borderRadius: 3,
                          background: `${color}20`,
                          color: t.status === 'Terminé' ? C.subtle : C.fg,
                          textDecoration: t.status === 'Terminé' ? 'line-through' : 'none',
                          borderLeft: `2px solid ${color}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.label}
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: 9, color: C.subtle, fontWeight: 600 }}>+ {dayTasks.length - 3}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: `${C.danger}30`, borderLeft: `2px solid ${C.danger}` }} />
            <span style={{ fontSize: 10, color: C.subtle }}>Urgent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: `${C.green}30`, borderLeft: `2px solid ${C.green}` }} />
            <span style={{ fontSize: 10, color: C.subtle }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: `${C.subtle}30`, borderLeft: `2px solid ${C.subtle}` }} />
            <span style={{ fontSize: 10, color: C.subtle }}>Faible</span>
          </div>
          <span style={{ fontSize: 10, color: C.subtle, marginLeft: 'auto' }}>
            Double-clic sur un jour pour créer une tâche.
          </span>
        </div>
      </Card>

      {/* Panneau latéral : tâches du jour sélectionné + sans date */}
      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <p style={{ flex: 1, fontSize: 13, color: C.fg, fontWeight: 700 }}>
              {selectedDate ? formatDayHeading(selectedDate) : 'Sélectionnez un jour'}
            </p>
            {selectedDate && onCreateForDate && (
              <Button size="sm" variant="primary" onClick={() => onCreateForDate(selectedDate)}>+ Tâche</Button>
            )}
          </div>

          {selectedTasks.length === 0 ? (
            <p style={{ fontSize: 11, color: C.subtle, padding: '8px 0' }}>
              Aucune tâche prévue ce jour.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedTasks.map(t => (
                <TaskMiniCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          )}
        </Card>

        {tasksWithoutDate.length > 0 && (
          <Card padding={14}>
            <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>
              Sans date d&apos;échéance ({tasksWithoutDate.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasksWithoutDate.map(t => (
                <TaskMiniCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function formatDayHeading(iso: string): string {
  const d = parseISO(iso)
  if (!d) return iso
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return `${days[d.getDay()]} ${d.getDate()} ${FRENCH_MONTHS[d.getMonth()]}`
}

function TaskMiniCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { commissions } = useCommissions()
  const { people } = useTeam()
  const assignees = task.assigneeIds
    .map(id => people.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const firstAssignee = assignees[0]
  const firstComm = commissions.find(c => task.commissionIds.includes(c.id))
  const commName = firstComm?.name?.split(' ')[0]
  const commColor = firstComm?.color ?? C.slate
  const statusColor = STATUS_COLORS[task.status]

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 6,
        padding: '8px 10px',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        opacity: task.status === 'Terminé' ? 0.6 : 1,
      }}
    >
      <p style={{
        fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 4,
        textDecoration: task.status === 'Terminé' ? 'line-through' : 'none',
      }}>
        {task.label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {firstAssignee ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Avatar initials={firstAssignee.initials} size={16} color={firstAssignee.color} photo={firstAssignee.photoUrl} />
            <span style={{ fontSize: 10, color: C.muted }}>
              {firstAssignee.fullName}{assignees.length > 1 ? ` +${assignees.length - 1}` : ''}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 10, color: C.subtle, fontStyle: 'italic' }}>Non assignée</span>
        )}
        {commName && <Tag label={commName} color={commColor} />}
        <Badge
          label={task.priority}
          variant={task.priority === 'Urgent' ? 'danger' : 'default'}
        />
      </div>
    </button>
  )
}

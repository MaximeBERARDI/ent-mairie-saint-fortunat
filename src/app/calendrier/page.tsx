'use client'

// Calendrier unifié : agrège en une vue mensuelle les échéances de tâches, les
// réunions de commission et les congés approuvés. Lecture seule (chaque
// évènement renvoie vers son module). Données dérivées des hooks existants.

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { COLORS as C } from '@/lib/theme'
import { useTasks } from '@/hooks/useTasks'
import { useMeetings } from '@/hooks/useMeetings'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useCommissions } from '@/hooks/useCommissions'
import { useTeam } from '@/hooks/useTeam'
import { isoDate, parseISO, FRENCH_MONTHS } from '@/lib/dateUtils'

type EventType = 'tache' | 'reunion' | 'conge'

interface CalEvent {
  date: string
  type: EventType
  label: string
  sub?: string
  color: string
  href: string
}

const TYPE_META: Record<EventType, { label: string; color: string }> = {
  tache: { label: 'Échéances de tâches', color: C.warning },
  reunion: { label: 'Réunions', color: C.info },
  conge: { label: 'Congés', color: C.terra },
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendrierPage() {
  const router = useRouter()
  const { tasks } = useTasks()
  const { meetings } = useMeetings()
  const { leaves } = useLeaveRequests()
  const { commissions } = useCommissions()
  const { people } = useTeam()

  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [active, setActive] = useState<Set<EventType>>(new Set<EventType>(['tache', 'reunion', 'conge']))

  const events = useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = []
    tasks.forEach(t => {
      if (!t.dueDate || t.status === 'Terminé') return
      out.push({
        date: t.dueDate, type: 'tache', label: t.label,
        color: t.priority === 'Urgent' ? C.danger : C.warning, href: '/taches',
      })
    })
    meetings.forEach(m => {
      const comm = commissions.find(c => c.id === m.commissionId)
      out.push({
        date: m.date, type: 'reunion',
        label: m.titre || (comm ? `Réunion · ${comm.name}` : 'Réunion'),
        sub: [m.heure, m.lieu].filter(Boolean).join(' · ') || undefined,
        color: C.info, href: '/commissions',
      })
    })
    leaves.filter(l => l.statut === 'Approuvée').forEach(l => {
      const person = people.find(p => p.id === l.personId)
      const start = parseISO(l.dateDebut)
      const end = parseISO(l.dateFin)
      if (!start || !end) return
      for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        out.push({
          date: isoDate(d), type: 'conge',
          label: `${person?.fullName ?? '—'} · ${l.type}`,
          color: C.terra, href: '/rh',
        })
      }
    })
    return out
  }, [tasks, meetings, leaves, commissions, people])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    events.forEach(e => {
      if (!active.has(e.type)) return
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    })
    return map
  }, [events, active])

  // Grille du mois (lundi premier)
  const first = new Date(cursor.y, cursor.m, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const todayIso = isoDate(now)

  const cells: (string | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? isoDate(new Date(cursor.y, cursor.m, dayNum)) : null)
  }

  const go = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }
  const toggleType = (t: EventType) => {
    const next = new Set(active)
    if (next.has(t)) next.delete(t); else next.add(t)
    setActive(next)
  }

  const monthCount = cells.filter(Boolean).reduce((acc, iso) => acc + (eventsByDay.get(iso!)?.length ?? 0), 0)

  return (
    <Shell title="Calendrier">
      <Card padding={16}>
        {/* Barre de navigation du mois */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <button onClick={() => go(-1)} aria-label="Mois précédent" style={navBtn}>‹</button>
          <button onClick={() => go(1)} aria-label="Mois suivant" style={navBtn}>›</button>
          <button onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })} style={{ ...navBtn, width: 'auto', padding: '0 12px', fontSize: 12 }}>Aujourd&apos;hui</button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.fg, textTransform: 'capitalize', marginLeft: 6 }}>
            {FRENCH_MONTHS[cursor.m]} {cursor.y}
          </h2>
          <span style={{ fontSize: 12, color: C.subtle }}>{monthCount} évènement{monthCount > 1 ? 's' : ''}</span>
          <div style={{ flex: 1 }} />
          {/* Légende cliquable (filtre) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(TYPE_META) as EventType[]).map(t => {
              const on = active.has(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 9999, cursor: 'pointer',
                    border: `1px solid ${on ? TYPE_META[t].color : C.border}`,
                    background: on ? `${TYPE_META[t].color}14` : '#fff',
                    color: on ? TYPE_META[t].color : C.subtle,
                    fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    opacity: on ? 1 : 0.6,
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: TYPE_META[t].color }} />
                  {TYPE_META[t].label}
                </button>
              )
            })}
          </div>
        </div>

        {/* En-têtes jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 700, color: C.subtle, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} style={{ minHeight: 96, borderRadius: 8, background: C.bg, opacity: 0.4 }} />
            const dayEvents = eventsByDay.get(iso) ?? []
            const isToday = iso === todayIso
            const dayNum = Number(iso.slice(8, 10))
            return (
              <div key={i} style={{
                minHeight: 96, borderRadius: 8, padding: 6,
                background: '#fff', border: `1px solid ${isToday ? C.green : C.border}`,
                boxShadow: isToday ? `0 0 0 1px ${C.green}` : 'none',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? C.green : C.muted, textAlign: 'right', marginBottom: 2,
                }}>{dayNum}</div>
                {dayEvents.slice(0, 3).map((e, k) => (
                  <button
                    key={k}
                    onClick={() => router.push(e.href)}
                    title={e.sub ? `${e.label} — ${e.sub}` : e.label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                      padding: '2px 5px', borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                      background: `${e.color}14`, border: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, color: C.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: 10, color: C.subtle, paddingLeft: 5 }}>+{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </Shell>
  )
}

const navBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer',
  fontSize: 16, color: C.fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'DM Sans', sans-serif", padding: 0,
}

'use client'

// Journal d'audit : liste des actions sensibles (accès, finances, RH).
// Réservé aux administrateurs (team.edit-roles) ; l'API /api/audit ré-applique
// le droit côté serveur.

import { useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { COLORS as C } from '@/lib/theme'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface AuditRow {
  id: string
  createdAt: string
  actorName: string
  action: string
  entity: string
  entityId: string | null
  summary: string
}

const ENTITY_VARIANT: Record<string, 'primary' | 'warning' | 'info' | 'terra' | 'default'> = {
  person: 'primary',
  facture: 'warning',
  leave: 'info',
  bulletin: 'terra',
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px',
  fontSize: 12, color: C.fg, fontFamily: "'DM Sans', sans-serif", background: '#fff',
}

export default function JournalPage() {
  const { can, hydrated } = useCurrentUser()
  const canView = can('team.edit-roles')
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!canView) return
    fetch('/api/audit')
      .then(r => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => setRows([]))
  }, [canView])

  const filtered = useMemo(() => {
    const list = rows ?? []
    if (!q) return list
    const s = q.toLowerCase()
    return list.filter(r => `${r.summary} ${r.actorName} ${r.action}`.toLowerCase().includes(s))
  }, [rows, q])

  if (!hydrated) {
    return <Shell title="Journal d'audit"><p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p></Shell>
  }
  if (!canView) {
    return (
      <Shell title="Journal d'audit">
        <Card padding={32} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 600 }}>Accès réservé</p>
          <p style={{ fontSize: 12, color: C.subtle, marginTop: 6 }}>Le journal d&apos;audit est réservé aux administrateurs.</p>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell title="Journal d'audit">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: C.subtle, flex: 1 }}>
          {rows == null ? 'Chargement…' : `${filtered.length} évènement${filtered.length > 1 ? 's' : ''}`} · les 300 plus récents
        </p>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher (acteur, action, objet)…"
          aria-label="Rechercher dans le journal"
          style={{ ...inputStyle, minWidth: 240 }}
        />
      </div>

      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px 160px 120px 1fr', gap: 0, padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          {['Date', 'Acteur', 'Type', 'Action'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        {rows != null && filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', fontSize: 12, color: C.subtle }}>Aucun évènement.</p>
        )}
        {filtered.map(r => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '150px 160px 120px 1fr', gap: 0, padding: '9px 14px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>
              {new Date(r.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: 12, color: C.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.actorName}</span>
            <span><Badge label={r.entity} variant={ENTITY_VARIANT[r.entity] ?? 'default'} /></span>
            <span style={{ fontSize: 12, color: C.fg }}>{r.summary}</span>
          </div>
        ))}
      </Card>
    </Shell>
  )
}

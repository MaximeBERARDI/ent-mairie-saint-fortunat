'use client'

// Onglet Délibérations de l'espace Conseil Municipal.
// Suivi structuré : numéro, objet, date, statut, vote (pour/contre/abstention).
// Création/édition/suppression gatées par `canManage` (commissions.manage,
// donc la secrétaire de mairie / DGS).

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { COLORS as C } from '@/lib/theme'
import { formatLongFR } from '@/lib/dateUtils'
import type { Deliberation, DeliberationStatut } from '@/lib/types'

const STATUTS: DeliberationStatut[] = ['À venir', 'Adoptée', 'Rejetée', 'Reportée']

const STATUT_VARIANT: Record<DeliberationStatut, 'default' | 'success' | 'danger' | 'warning'> = {
  'À venir': 'default',
  Adoptée: 'success',
  Rejetée: 'danger',
  Reportée: 'warning',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 34, border: `1px solid ${C.border}`, borderRadius: 6,
  background: '#fff', padding: '0 10px', fontSize: 13, color: C.fg,
  fontFamily: "'DM Sans', sans-serif",
}

type Draft = {
  numero: string
  objet: string
  date: string
  statut: DeliberationStatut
  votePour: string
  voteContre: string
  voteAbstention: string
  notes: string
}

const emptyDraft = (): Draft => ({
  numero: '', objet: '', date: new Date().toISOString().slice(0, 10),
  statut: 'À venir', votePour: '', voteContre: '', voteAbstention: '', notes: '',
})

const draftFrom = (d: Deliberation): Draft => ({
  numero: d.numero, objet: d.objet, date: d.date, statut: d.statut,
  votePour: String(d.votePour), voteContre: String(d.voteContre),
  voteAbstention: String(d.voteAbstention), notes: d.notes ?? '',
})

export function DeliberationsTab({
  commissionId, color, deliberations, canManage, onCreate, onUpdate, onDelete,
}: {
  commissionId: string
  color: string
  deliberations: Deliberation[]
  canManage: boolean
  onCreate: (data: Omit<Deliberation, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, patch: Partial<Deliberation>) => void
  onDelete: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft())

  const openCreate = () => { setDraft(emptyDraft()); setCreating(true); setEditingId(null) }
  const openEdit = (d: Deliberation) => { setDraft(draftFrom(d)); setEditingId(d.id); setCreating(false) }
  const close = () => { setCreating(false); setEditingId(null) }

  const toPayload = () => ({
    numero: draft.numero.trim(),
    objet: draft.objet.trim(),
    date: draft.date,
    statut: draft.statut,
    votePour: parseInt(draft.votePour, 10) || 0,
    voteContre: parseInt(draft.voteContre, 10) || 0,
    voteAbstention: parseInt(draft.voteAbstention, 10) || 0,
    commissionId,
    notes: draft.notes.trim() || undefined,
  })

  const valid = draft.numero.trim() && draft.objet.trim() && draft.date

  const submit = () => {
    if (!valid) return
    if (editingId) onUpdate(editingId, toPayload())
    else onCreate(toPayload())
    close()
  }

  const sorted = [...deliberations].sort((a, b) => b.date.localeCompare(a.date))
  const adoptees = deliberations.filter(d => d.statut === 'Adoptée').length

  return (
    <Card padding={14}>
      <SectionHeader
        level={3}
        title={`Délibérations (${deliberations.length})`}
        actions={canManage && !creating && !editingId
          ? <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvelle délibération</Button>
          : undefined}
      />

      {deliberations.length > 0 && (
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 10 }}>
          {adoptees} adoptée{adoptees > 1 ? 's' : ''} · {deliberations.length} au total
        </p>
      )}

      {(creating || editingId) && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 14, background: C.bg }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>N° de délibération</label>
              <input style={inputStyle} value={draft.numero} placeholder="2026-014"
                onChange={e => setDraft({ ...draft, numero: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={draft.date}
                onChange={e => setDraft({ ...draft, date: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Objet</label>
            <input style={inputStyle} value={draft.objet} placeholder="Approbation du budget primitif 2026"
              onChange={e => setDraft({ ...draft, objet: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Statut</label>
              <select style={inputStyle} value={draft.statut}
                onChange={e => setDraft({ ...draft, statut: e.target.value as DeliberationStatut })}>
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pour</label>
              <input type="number" min="0" style={inputStyle} value={draft.votePour}
                onChange={e => setDraft({ ...draft, votePour: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Contre</label>
              <input type="number" min="0" style={inputStyle} value={draft.voteContre}
                onChange={e => setDraft({ ...draft, voteContre: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Abstention</label>
              <input type="number" min="0" style={inputStyle} value={draft.voteAbstention}
                onChange={e => setDraft({ ...draft, voteAbstention: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, height: 64, padding: 8, resize: 'vertical' }} value={draft.notes}
              onChange={e => setDraft({ ...draft, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" onClick={close}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={!valid}>
              {editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !creating ? (
        <p style={{ fontSize: 13, color: C.subtle, padding: '10px 0', lineHeight: 1.6 }}>
          Aucune délibération enregistrée. {canManage
            ? 'Ajoutez-en une pour suivre les décisions du conseil municipal.'
            : 'Les délibérations du conseil municipal apparaîtront ici.'}
        </p>
      ) : (
        sorted.map(d => (
          <div key={d.id} style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  N° {d.numero}
                </span>
                <Badge label={d.statut} variant={STATUT_VARIANT[d.statut]} />
                <span style={{ fontSize: 12, color: C.subtle }}>{formatLongFR(d.date)}</span>
              </div>
              <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, marginBottom: 4 }}>{d.objet}</p>
              <p style={{ fontSize: 12, color: C.subtle }}>
                Vote : <b style={{ color: C.success }}>{d.votePour}</b> pour ·{' '}
                <b style={{ color: C.danger }}>{d.voteContre}</b> contre ·{' '}
                <b style={{ color: C.fg }}>{d.voteAbstention}</b> abstention
              </p>
              {d.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{d.notes}</p>}
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Button size="sm" onClick={() => openEdit(d)}>Modifier</Button>
                <Button size="sm" variant="danger" onClick={() => { if (confirm(`Supprimer la délibération n° ${d.numero} ?`)) onDelete(d.id) }}>
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </Card>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: C.subtle, fontWeight: 600,
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
}

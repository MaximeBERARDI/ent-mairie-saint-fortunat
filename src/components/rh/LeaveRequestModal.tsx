'use client'

// Modale "Poser un congé" pour l'utilisateur courant (self-service agent).
// Réutilise la vraie logique de calcul (countOuvres) et délègue la création
// au hook (submitLeave) via onSubmit. Le solde est informatif (record optionnel).

import { useEffect, useState } from 'react'
import { COLORS as C } from '@/lib/theme'
import { Button } from '@/components/ui/Button'
import { useModalA11y } from '@/hooks/useModalA11y'
import { countOuvres, type NewLeaveInput } from '@/hooks/useLeaveRequests'
import type { LeaveType, EmployeeRecord } from '@/lib/types'

const LEAVE_TYPES: LeaveType[] = [
  'Congés annuels', 'RTT', 'Maladie', 'Sans solde',
  'Formation', 'Évènement familial', 'Maternité / Paternité',
]

interface Props {
  open: boolean
  onClose: () => void
  personId: string
  record?: EmployeeRecord | null
  onSubmit: (data: NewLeaveInput) => void
}

export function LeaveRequestModal({ open, onClose, personId, record, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<LeaveType>('Congés annuels')
  const [dateDebut, setDateDebut] = useState(today)
  const [dateFin, setDateFin] = useState(today)
  const [motif, setMotif] = useState('')

  useEffect(() => {
    if (!open) return
    setType('Congés annuels')
    setDateDebut(today)
    setDateFin(today)
    setMotif('')
  }, [open])

  const modalRef = useModalA11y<HTMLDivElement>(open, onClose)
  if (!open) return null

  const nbOuvres = countOuvres(dateDebut, dateFin)
  const valid = !!dateDebut && !!dateFin && dateFin >= dateDebut && nbOuvres > 0

  let warning: string | null = null
  if (record) {
    if (type === 'Congés annuels') {
      const solde = record.congesAnnuelsAcquis - record.congesAnnuelsPris
      if (nbOuvres > solde) warning = `Solde de congés insuffisant : ${solde} jour${solde > 1 ? 's' : ''} restant${solde > 1 ? 's' : ''}.`
    } else if (type === 'RTT') {
      const solde = record.rttAcquis - record.rttPris
      if (nbOuvres > solde) warning = `Solde RTT insuffisant : ${solde} jour${solde > 1 ? 's' : ''} restant${solde > 1 ? 's' : ''}.`
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '8px 12px', fontSize: 13, color: C.fg, background: '#fff',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const submit = () => {
    if (!valid) return
    onSubmit({ personId, type, dateDebut, dateFin, motif: motif.trim() || undefined })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,28,22,0.45)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: 20,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Poser un congé"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.fg, margin: 0 }}>Poser un congé</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{ width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 20, color: C.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Type d&apos;absence</label>
            <select value={type} onChange={e => setType(e.target.value as LeaveType)} style={inputStyle}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date de début</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date de fin</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Motif / précisions (facultatif)</label>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              {nbOuvres} jour{nbOuvres > 1 ? 's' : ''} ouvré{nbOuvres > 1 ? 's' : ''}
            </span>
            {warning && <span style={{ fontSize: 12, color: C.warning }}>⚠ {warning}</span>}
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, background: C.bg }}>
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>Soumettre la demande</Button>
        </div>
      </div>
    </div>
  )
}

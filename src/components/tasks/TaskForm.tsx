'use client'

import { useEffect, useState, useRef } from 'react'
import { COLORS as C } from '@/lib/theme'
import { COMMISSIONS } from '@/lib/data'
import { Button } from '@/components/ui/Button'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Task, 'id' | 'createdAt'>) => void
  onDelete?: () => void
  initial?: Partial<Task>
  title?: string
}

const PRIORITIES: TaskPriority[] = ['Urgent', 'Normal', 'Faible']
const STATUSES: TaskStatus[] = ['À faire', 'En cours', 'En attente validation', 'Terminé']

export function TaskForm({ open, onClose, onSubmit, onDelete, initial, title }: TaskFormProps) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [commission, setCommission] = useState<string>('')
  const [assignee, setAssignee] = useState('Jean Martin')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Normal')
  const [status, setStatus] = useState<TaskStatus>('À faire')
  const [error, setError] = useState<string | null>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label ?? '')
    setDescription(initial?.description ?? '')
    setCommission(initial?.commission ?? '')
    setAssignee(initial?.assignee ?? 'Jean Martin')
    setDueDate(initial?.dueDate ?? '')
    setPriority(initial?.priority ?? 'Normal')
    setStatus(initial?.status ?? 'À faire')
    setError(null)
    setTimeout(() => labelInputRef.current?.focus(), 50)
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      setError('Le titre de la tâche est obligatoire')
      return
    }
    if (!assignee.trim()) {
      setError("L'assignation est obligatoire")
      return
    }
    onSubmit({
      label: label.trim(),
      description: description.trim() || undefined,
      commission: commission.trim() || undefined,
      assignee: assignee.trim(),
      dueDate: dueDate.trim() || '—',
      priority,
      status,
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    color: C.fg,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,28,22,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.fg, margin: 0 }}>
            {title ?? (initial?.id ? 'Modifier la tâche' : 'Nouvelle tâche')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 28, height: 28, border: 'none', background: 'transparent',
              borderRadius: 6, cursor: 'pointer', fontSize: 20, color: C.subtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Titre de la tâche <span style={{ color: C.danger }}>*</span></label>
            <input
              ref={labelInputRef}
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex : Préparer l'ordre du jour du conseil"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Détails, contexte, liens utiles…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Commission (optionnel)</label>
              <select
                value={commission}
                onChange={e => setCommission(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Sans commission —</option>
                {COMMISSIONS.map(c => (
                  <option key={c.id} value={c.name.split(' ')[0]}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigné à <span style={{ color: C.danger }}>*</span></label>
              <input
                type="text"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="Nom du responsable"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Échéance</label>
              <input
                type="text"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                placeholder="Ex : 15 mai"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Priorité</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                style={inputStyle}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                style={inputStyle}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: C.dangerLight, border: `1px solid ${C.danger}40`, borderRadius: 6, color: C.danger, fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, background: C.bg }}>
          {onDelete && initial?.id && (
            <Button variant="danger" size="sm" onClick={onDelete}>Supprimer</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit">
            {initial?.id ? 'Enregistrer' : 'Créer la tâche'}
          </Button>
        </div>
      </form>
    </div>
  )
}

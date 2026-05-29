'use client'

import { useEffect, useState, useRef } from 'react'
import { COLORS as C } from '@/lib/theme'
import { PEOPLE, getPerson } from '@/lib/people'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useCommissions } from '@/hooks/useCommissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { Task, TaskPriority, TaskStatus, TaskDocument } from '@/lib/types'

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

const MAX_FILE_SIZE = 1024 * 1024  // 1 Mo par fichier
const MAX_TOTAL_SIZE = 4 * 1024 * 1024  // 4 Mo total

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function TaskForm({ open, onClose, onSubmit, onDelete, initial, title }: TaskFormProps) {
  const { currentUserId } = useCurrentUser()
  const { commissions } = useCommissions()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [commissionIds, setCommissionIds] = useState<string[]>([])
  // Par défaut, l'utilisateur courant s'assigne à lui-même (modifiable, peut être vidé)
  const [assigneeIds, setAssigneeIds] = useState<string[]>([currentUserId])
  const [validatorId, setValidatorId] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('Normal')
  const [status, setStatus] = useState<TaskStatus>('À faire')
  const [documents, setDocuments] = useState<TaskDocument[]>([])
  const [error, setError] = useState<string | null>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label ?? '')
    setDescription(initial?.description ?? '')
    setCommissionIds(initial?.commissionIds ?? [])
    setAssigneeIds(initial?.assigneeIds ?? [currentUserId])
    setValidatorId(initial?.validatorId ?? '')
    setDueDate(initial?.dueDate ?? '')
    setPriority(initial?.priority ?? 'Normal')
    setStatus(initial?.status ?? 'À faire')
    setDocuments(initial?.documents ?? [])
    setError(null)
    setTimeout(() => labelInputRef.current?.focus(), 50)
  }, [open, initial])

  const modalRef = useModalA11y<HTMLFormElement>(open, onClose)

  // Si on passe en "En attente validation" sans validateur → pré-sélectionne
  useEffect(() => {
    if (status === 'En attente validation' && !validatorId) {
      // Par défaut: maire si le maire n'est pas déjà assigné, sinon adjoint finances
      const fallback = assigneeIds.includes('p-jm') ? 'p-rg' : 'p-jm'
      setValidatorId(fallback)
    }
  }, [status, assigneeIds, validatorId])

  if (!open) return null

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    const currentTotal = documents.reduce((s, d) => s + d.size, 0)
    let total = currentTotal
    const newDocs: TaskDocument[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" dépasse 1 Mo (limite localStorage). Pour les gros fichiers, on basculera vers un vrai stockage cloud plus tard.`)
        continue
      }
      if (total + file.size > MAX_TOTAL_SIZE) {
        setError(`Le total des pièces jointes dépasserait 4 Mo. Retirez-en avant d'en ajouter d'autres.`)
        break
      }
      try {
        const dataUrl = await readFileAsDataURL(file)
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        })
        total += file.size
      } catch {
        setError(`Impossible de lire "${file.name}".`)
      }
    }
    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return setError('Le titre de la tâche est obligatoire.')
    if (status === 'En attente validation' && !validatorId) {
      return setError('Indiquez la personne qui doit valider cette tâche.')
    }
    onSubmit({
      label: label.trim(),
      description: description.trim() || undefined,
      commissionIds,
      assigneeIds,
      validatorId: status === 'En attente validation' ? validatorId : (validatorId || undefined),
      dueDate: dueDate || undefined,
      priority,
      status,
      documents,
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
  const groupLabelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: C.subtle, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }
  const chipStyle = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px 4px 6px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${on ? C.green : C.border}`,
    background: on ? C.green : '#fff',
    color: on ? '#fff' : C.muted,
    fontSize: 12, fontWeight: on ? 600 : 400, fontFamily: "'DM Sans', sans-serif",
  })
  const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]

  // Groupes pour l'affichage des personnes
  const elus = PEOPLE.filter(p => p.role !== 'agent')
  const agents = PEOPLE.filter(p => p.role === 'agent')

  const PersonOption = ({ id, label }: { id: string; label?: string }) => {
    const p = getPerson(id)
    if (!p) return null
    return <option value={p.id}>{label ?? `${p.fullName} — ${p.poste}`}</option>
  }

  const renderPersonSelect = (
    value: string, onChange: (v: string) => void,
    placeholder?: string,
  ) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      <optgroup label="Élus">
        {elus.map(p => <PersonOption key={p.id} id={p.id} />)}
      </optgroup>
      <optgroup label="Agents">
        {agents.map(p => <PersonOption key={p.id} id={p.id} />)}
      </optgroup>
    </select>
  )

  const validator = getPerson(validatorId)

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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Formulaire de tâche'}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 600,
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
          >×</button>
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

          <div>
            <label style={labelStyle}>Commissions (optionnel)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {commissions.length === 0 && (
                <span style={{ fontSize: 11, color: C.subtle }}>Aucune commission.</span>
              )}
              {commissions.map(c => {
                const on = commissionIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCommissionIds(prev => toggleId(prev, c.id))}
                    style={chipStyle(on)}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#fff' : c.color }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Assigné(s) — optionnel</label>
            <p style={{ fontSize: 11, color: C.subtle, margin: '0 0 8px' }}>
              Laisser vide = tâche non assignée (elle reste visible dans la/les commission(s)).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ title: 'Élus', list: elus }, { title: 'Agents', list: agents }].map(grp => (
                <div key={grp.title}>
                  <div style={groupLabelStyle}>{grp.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {grp.list.map(p => {
                      const on = assigneeIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAssigneeIds(prev => toggleId(prev, p.id))}
                          style={chipStyle(on)}
                        >
                          <Avatar initials={p.initials} size={18} color={p.color} photo={p.photoUrl} />
                          {p.fullName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inputStyle}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Validateur — visible quand le statut est "En attente validation" */}
          {status === 'En attente validation' && (
            <div style={{ background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 8, padding: 12 }}>
              <label style={{ ...labelStyle, color: C.warning }}>
                Validateur de la tâche <span style={{ color: C.danger }}>*</span>
              </label>
              {renderPersonSelect(validatorId, setValidatorId, '— Sélectionnez la personne qui doit valider —')}
              {validator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: C.muted }}>
                  <Avatar initials={validator.initials} size={20} color={validator.color} photo={validator.photoUrl} />
                  <span>{validator.fullName} sera notifié(e) de la demande de validation.</span>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <div>
            <label style={labelStyle}>Pièces jointes</label>
            <div style={{
              border: `1px dashed ${C.border}`,
              borderRadius: 8,
              padding: 12,
              background: C.bg,
            }}>
              {documents.length === 0 && (
                <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
                  Aucun document — joignez devis, photos, courriers (max 1 Mo / fichier).
                </p>
              )}
              {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#fff', border: `1px solid ${C.border}`,
                      borderRadius: 6, padding: '6px 8px',
                    }}>
                      <span style={{ fontSize: 16 }}>📎</span>
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        style={{ flex: 1, fontSize: 12, color: C.fg, textDecoration: 'none', fontWeight: 500 }}
                      >{doc.name}</a>
                      <span style={{ fontSize: 10, color: C.subtle }}>{formatBytes(doc.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.id)}
                        aria-label="Retirer"
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: C.danger, fontSize: 14, padding: '0 4px',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={e => handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                + Ajouter un document
              </Button>
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

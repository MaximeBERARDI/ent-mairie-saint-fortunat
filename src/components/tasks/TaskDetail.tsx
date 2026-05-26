'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { getPerson } from '@/lib/people'
import { useCommissions } from '@/hooks/useCommissions'
import { formatLongFR } from '@/lib/dateUtils'
import type { Task, TaskStatus, TaskPriority, TaskComment } from '@/lib/types'

const STATUS_VARIANTS: Record<TaskStatus, 'warning' | 'info' | 'success' | 'default' | 'terra'> = {
  'À faire': 'default',
  'En cours': 'warning',
  'En attente validation': 'terra',
  'Terminé': 'success',
}
const PRIORITY_VARIANTS: Record<TaskPriority, 'danger' | 'warning' | 'default'> = {
  Urgent: 'danger',
  Normal: 'default',
  Faible: 'default',
}

const fmtFileSize = (b: number) =>
  b < 1024 ? `${b} o`
    : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko`
    : `${(b / 1024 / 1024).toFixed(1)} Mo`

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

interface TaskDetailContentProps {
  task: Task
  currentUserId: string
  onUpdate: (patch: Partial<Task>) => void
  onCycleStatus: () => void
  onEdit: () => void
  onDelete?: () => void
  onClose?: () => void
  onAddComment?: (content: string) => void
  onDeleteComment?: (commentId: string) => void
  /** Affichage compact (panneau latéral) ou complet (modal) */
  compact?: boolean
}

/**
 * Contenu détaillé d'une tâche : informations, description, pièces jointes,
 * commentaires (avec saisie), historique, actions.
 *
 * Ce composant s'affiche tel quel dans un panneau latéral. Pour un affichage
 * en modal au-dessus de la page, utiliser <TaskDetailModal>.
 */
export function TaskDetailContent({
  task, currentUserId, onUpdate, onCycleStatus, onEdit, onDelete, onClose,
  onAddComment, onDeleteComment, compact = false,
}: TaskDetailContentProps) {
  const { commissions } = useCommissions()
  const assignee = getPerson(task.assigneeId)
  const validator = task.validatorId ? getPerson(task.validatorId) : null
  const author = task.createdById ? getPerson(task.createdById) : null
  const commission = commissions.find(c => c.id === task.commissionId) ?? null

  const [draft, setDraft] = useState('')
  const handleAdd = () => {
    if (!onAddComment) return
    const v = draft.trim()
    if (!v) return
    onAddComment(v)
    setDraft('')
  }

  const comments = task.comments ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <p style={{ flex: 1, fontSize: compact ? 13 : 16, color: C.fg, fontWeight: 700, lineHeight: 1.3 }}>
          {task.label}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 18, lineHeight: 1, padding: 0 }}
          >×</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <Badge label={task.status} variant={STATUS_VARIANTS[task.status]} />
        <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
        {commission && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 12,
            background: `${commission.color}20`, color: commission.color,
            fontSize: 10, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: commission.color }} />
            {commission.name}
          </span>
        )}
      </div>

      <Separator my={10} />

      {/* Métadonnées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <DetailRow
          label="Assigné à"
          value={assignee ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar initials={assignee.initials} size={20} color={assignee.color} />
              {assignee.fullName} <span style={{ color: C.subtle, fontWeight: 400 }}>· {assignee.poste}</span>
            </span>
          ) : '—'}
        />
        {validator && (
          <DetailRow
            label="Validateur"
            value={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar initials={validator.initials} size={20} color={validator.color} />
                {validator.fullName}
              </span>
            }
          />
        )}
        <DetailRow label="Échéance" value={task.dueDate ? formatLongFR(task.dueDate) : <span style={{ color: C.subtle }}>aucune</span>} />
        <DetailRow
          label="Créée"
          value={
            <span style={{ color: C.subtle, fontWeight: 400 }}>
              {fmtDateTime(task.createdAt)}{author ? ` par ${author.fullName}` : ''}
            </span>
          }
        />
        {task.updatedAt && task.updatedAt !== task.createdAt && (
          <DetailRow
            label="Modifiée"
            value={<span style={{ color: C.subtle, fontWeight: 400 }}>{fmtDateTime(task.updatedAt)}</span>}
          />
        )}
      </div>

      {/* Description */}
      <Separator my={10} />
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Description
      </p>
      {task.description ? (
        <div style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6,
          padding: 10, fontSize: 12, color: C.fg, whiteSpace: 'pre-wrap', lineHeight: 1.5,
        }}>
          {task.description}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: C.subtle, fontStyle: 'italic' }}>
          Pas de description. Cliquez sur ✎ Modifier pour en ajouter une.
        </p>
      )}

      {/* Pièces jointes */}
      <Separator my={10} />
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Pièces jointes {(task.documents?.length ?? 0) > 0 && `(${task.documents!.length})`}
      </p>
      {(task.documents?.length ?? 0) > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {task.documents!.map(doc => (
            <a
              key={doc.id}
              href={doc.dataUrl}
              download={doc.name}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '6px 10px', textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>📎</span>
              <span style={{ flex: 1, fontSize: 11, color: C.fg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              <span style={{ fontSize: 10, color: C.subtle, flexShrink: 0 }}>{fmtFileSize(doc.size)}</span>
            </a>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: C.subtle, fontStyle: 'italic' }}>
          Aucune pièce jointe.
        </p>
      )}

      {/* Commentaires */}
      <Separator my={10} />
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Commentaires {comments.length > 0 && `(${comments.length})`}
      </p>
      {comments.length === 0 ? (
        <p style={{ fontSize: 11, color: C.subtle, fontStyle: 'italic', marginBottom: 8 }}>
          Aucun commentaire pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {comments.map(c => {
            const author = getPerson(c.authorId)
            const isMine = c.authorId === currentUserId
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex', gap: 8, padding: '8px 10px',
                  background: isMine ? `${C.green}08` : '#fff',
                  border: `1px solid ${isMine ? `${C.green}30` : C.border}`,
                  borderRadius: 6,
                }}
              >
                {author && <Avatar initials={author.initials} size={24} color={author.color} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 11, color: C.fg, fontWeight: 600 }}>{author?.fullName ?? '—'}</p>
                    <p style={{ fontSize: 10, color: C.subtle }}>{fmtDateTime(c.createdAt)}</p>
                  </div>
                  <p style={{ fontSize: 12, color: C.fg, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {c.content}
                  </p>
                </div>
                {isMine && onDeleteComment && (
                  <button
                    onClick={() => { if (confirm('Supprimer ce commentaire ?')) onDeleteComment(c.id) }}
                    aria-label="Supprimer"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 14, padding: 0, alignSelf: 'flex-start' }}
                    title="Supprimer mon commentaire"
                  >×</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Saisie d'un nouveau commentaire */}
      {onAddComment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Ajouter un commentaire (Ctrl+Entrée pour envoyer)…"
            rows={2}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAdd()
            }}
            style={{
              width: '100%',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: 8,
              fontSize: 12,
              color: C.fg,
              fontFamily: "'DM Sans', sans-serif",
              resize: 'vertical',
              minHeight: 50,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="primary" disabled={!draft.trim()} onClick={handleAdd}>
              Publier le commentaire
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <Separator my={4} />
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {task.status !== 'Terminé' ? (
          <Button variant="primary" size="sm" style={compact ? undefined : { flex: 1, justifyContent: 'center' }} onClick={() => onUpdate({ status: 'Terminé' })}>
            ✓ Marquer terminée
          </Button>
        ) : (
          <Button size="sm" style={compact ? undefined : { flex: 1, justifyContent: 'center' }} onClick={() => onUpdate({ status: 'En cours' })}>
            ↺ Rouvrir la tâche
          </Button>
        )}
        <Button size="sm" style={compact ? undefined : { flex: 1, justifyContent: 'center' }} onClick={onCycleStatus}>
          Changer le statut →
        </Button>
        <Button size="sm" style={compact ? undefined : { flex: 1, justifyContent: 'center' }} onClick={onEdit}>
          ✎ Modifier
        </Button>
        {onDelete && (
          <Button size="sm" variant="danger" style={compact ? undefined : { flex: 1, justifyContent: 'center' }} onClick={() => { if (confirm('Supprimer cette tâche ?')) onDelete() }}>
            Supprimer
          </Button>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 11, color: C.subtle, width: 100, flexShrink: 0, fontWeight: 600 }}>{label}</p>
      <div style={{ flex: 1, fontSize: 12, color: C.fg, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

// ─── Wrapper modal ────────────────────────────────────────────────────

export function TaskDetailModal(props: TaskDetailContentProps & { open: boolean }) {
  const { open, onClose, ...content } = props
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(20, 30, 40, 0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: 640,
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <TaskDetailContent {...content} onClose={onClose} compact={false} />
      </div>
    </div>
  )
}

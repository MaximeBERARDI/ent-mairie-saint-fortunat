// Mappers Task (Postgres) ↔ Task (TypeScript app)
//
// La DB utilise des enums snake_case (a_faire, en_cours…) alors que l'app
// utilise des libellés français avec espaces et accents (À faire, En cours…).
// Ces helpers font la traduction des deux côtés.

import type { Task, TaskComment, TaskDocument, TaskPriority, TaskStatus } from './types'
import type {
  Task as DbTask,
  TaskComment as DbTaskComment,
  TaskPriority as DbTaskPriority,
  TaskStatus as DbTaskStatus,
  Document as DbDocument,
} from '@prisma/client'

const PRIORITY_TO_DB: Record<TaskPriority, DbTaskPriority> = {
  Urgent: 'urgent',
  Normal: 'normal',
  Faible: 'faible',
}
const PRIORITY_FROM_DB: Record<DbTaskPriority, TaskPriority> = {
  urgent: 'Urgent',
  normal: 'Normal',
  faible: 'Faible',
}

const STATUS_TO_DB: Record<TaskStatus, DbTaskStatus> = {
  'À faire': 'a_faire',
  'En cours': 'en_cours',
  'En attente validation': 'en_attente_validation',
  'Terminé': 'termine',
}
const STATUS_FROM_DB: Record<DbTaskStatus, TaskStatus> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente_validation: 'En attente validation',
  termine: 'Terminé',
}

export function priorityToDb(p: TaskPriority): DbTaskPriority {
  return PRIORITY_TO_DB[p]
}
export function priorityFromDb(p: DbTaskPriority): TaskPriority {
  return PRIORITY_FROM_DB[p]
}
export function statusToDb(s: TaskStatus): DbTaskStatus {
  return STATUS_TO_DB[s]
}
export function statusFromDb(s: DbTaskStatus): TaskStatus {
  return STATUS_FROM_DB[s]
}

export function commentFromDb(c: DbTaskComment): TaskComment {
  return {
    id: c.id,
    authorId: c.authorId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  }
}

export function documentFromDb(d: DbDocument): TaskDocument {
  return {
    id: d.id,
    name: d.name,
    size: d.size,
    type: d.type,
    dataUrl: d.dataUrl ?? d.storageUrl ?? '',
    uploadedAt: d.uploadedAt.toISOString(),
  }
}

export function taskFromDb(
  t: DbTask & { comments?: DbTaskComment[]; documents?: DbDocument[] },
): Task {
  return {
    id: t.id,
    label: t.label,
    description: t.description ?? undefined,
    commissionIds: t.commissionIds ?? [],
    assigneeIds: t.assigneeIds ?? [],
    validatorId: t.validatorId ?? undefined,
    createdById: t.createdById ?? undefined,
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : undefined,
    priority: priorityFromDb(t.priority),
    status: statusFromDb(t.status),
    documents: t.documents?.map(documentFromDb) ?? [],
    comments: t.comments?.map(commentFromDb) ?? [],
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

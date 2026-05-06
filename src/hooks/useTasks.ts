'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Task, TaskComment } from '@/lib/types'
import { TASKS } from '@/lib/data'
import { PEOPLE } from '@/lib/people'
import { COMMISSIONS } from '@/lib/data'
import { parseFrenchDateToISO } from '@/lib/dateUtils'

const STORAGE_KEY = 'ent-mairie:tasks:v1'

// Lookup helpers pour la migration depuis l'ancien shape
const PERSON_BY_NAME = new Map<string, string>()
PEOPLE.forEach(p => {
  PERSON_BY_NAME.set(p.fullName.toLowerCase(), p.id)
  PERSON_BY_NAME.set(`${p.prenom[0]}. ${p.nom}`.toLowerCase(), p.id)
  PERSON_BY_NAME.set(p.nom.toLowerCase(), p.id)
})

const COMMISSION_BY_KEYWORD: Array<[RegExp, string]> = [
  [/travaux|urbanisme|voirie/i, 'travaux'],
  [/admin|finance|secr[eé]tariat/i, 'admin-finance'],
  [/d[eé]veloppement|[eé]conomique/i, 'developpement'],
  [/enfance|jeunesse|[eé]cole/i, 'enfance'],
  [/animation|[eé]v[eè]nement/i, 'animation'],
]

interface LegacyTask {
  id: string
  label: string
  description?: string
  commission?: string
  assignee?: string
  dueDate?: string
  priority: Task['priority']
  status: Task['status']
  createdAt?: string
}

function migrateTask(t: Task | LegacyTask): Task | null {
  if (!t || !t.id || !t.label) return null

  const anyT = t as Partial<Task> & Partial<LegacyTask>

  // Si la tâche est déjà au nouveau format
  if (typeof anyT.assigneeId === 'string') {
    return {
      id: t.id,
      label: t.label,
      description: anyT.description,
      commissionId: anyT.commissionId,
      assigneeId: anyT.assigneeId,
      validatorId: anyT.validatorId,
      dueDate: anyT.dueDate,
      priority: t.priority,
      status: t.status,
      documents: anyT.documents ?? [],
      createdAt: anyT.createdAt ?? new Date().toISOString(),
    }
  }

  // Migration depuis l'ancien shape
  const legacy = t as LegacyTask
  let assigneeId = 'p-jm' // fallback : moi
  if (legacy.assignee) {
    const found = PERSON_BY_NAME.get(legacy.assignee.toLowerCase().trim())
    if (found) assigneeId = found
  }

  let commissionId: string | undefined
  if (legacy.commission) {
    const direct = COMMISSIONS.find(c =>
      c.id === legacy.commission ||
      c.name.toLowerCase().includes(legacy.commission!.toLowerCase()),
    )
    if (direct) commissionId = direct.id
    else {
      const match = COMMISSION_BY_KEYWORD.find(([re]) => re.test(legacy.commission!))
      if (match) commissionId = match[1]
    }
  }

  let dueDate: string | undefined
  if (legacy.dueDate) {
    const iso = legacy.dueDate.match(/^\d{4}-\d{2}-\d{2}/)
      ? legacy.dueDate
      : parseFrenchDateToISO(legacy.dueDate)
    dueDate = iso ?? undefined
  }

  return {
    id: t.id,
    label: t.label,
    description: legacy.description,
    commissionId,
    assigneeId,
    validatorId: undefined,
    dueDate,
    priority: t.priority,
    status: t.status,
    documents: [],
    createdAt: legacy.createdAt ?? new Date().toISOString(),
  }
}

function loadFromStorage(): Task[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const migrated = parsed
      .map(t => migrateTask(t as Task | LegacyTask))
      .filter((t): t is Task => t !== null)
    return migrated
  } catch {
    return null
  }
}

function saveToStorage(tasks: Task[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {}
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored && stored.length > 0) {
      setTasks(stored)
    } else {
      saveToStorage(TASKS)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(tasks)
  }, [tasks, hydrated])

  const createTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>, createdById?: string) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      createdById,
    }
    setTasks(prev => [newTask, ...prev])
    return newTask
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)))
  }, [])

  const addComment = useCallback((taskId: string, authorId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    const comment: TaskComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => prev.map(t => (
      t.id === taskId
        ? { ...t, comments: [...(t.comments ?? []), comment], updatedAt: comment.createdAt }
        : t
    )))
  }, [])

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    setTasks(prev => prev.map(t => (
      t.id === taskId
        ? { ...t, comments: (t.comments ?? []).filter(c => c.id !== commentId), updatedAt: new Date().toISOString() }
        : t
    )))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const resetTasks = useCallback(() => {
    setTasks(TASKS)
    saveToStorage(TASKS)
  }, [])

  return { tasks, hydrated, createTask, updateTask, addComment, deleteComment, deleteTask, resetTasks }
}

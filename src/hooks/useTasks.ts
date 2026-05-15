'use client'

// Hook de gestion des tâches branché sur l'API /api/tasks
// (PostgreSQL via Prisma — plus de localStorage).
//
// Pattern "optimistic update" : la mutation modifie le state local
// immédiatement, puis appelle l'API. En cas d'erreur, rollback +
// alert. L'interface (tasks, hydrated, create/update/delete/comments)
// reste identique pour minimiser les changements dans les consommateurs.

import { useEffect, useState, useCallback } from 'react'
import type { Task, TaskComment } from '@/lib/types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/tasks')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Task[]) => {
        if (!cancelled) {
          setTasks(data)
          setHydrated(true)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[useTasks] load error:', e)
          setHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const createTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>, _createdById?: string): Task => {
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Task = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      comments: data.comments ?? [],
    }
    setTasks((prev) => [optimistic, ...prev])

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: data.label,
        description: data.description,
        commissionId: data.commissionId,
        assigneeId: data.assigneeId,
        validatorId: data.validatorId,
        dueDate: data.dueDate,
        priority: data.priority,
        status: data.status,
        documents: data.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)))
      })
      .catch((e) => {
        console.error('[useTasks] create error:', e)
        setTasks((prev) => prev.filter((t) => t.id !== tempId))
        alert('Impossible de créer la tâche.')
      })
    return optimistic
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    let previous: Task[] = []
    setTasks((prev) => {
      previous = prev
      return prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      )
    })

    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: patch.label,
        description: patch.description,
        commissionId: patch.commissionId,
        assigneeId: patch.assigneeId,
        validatorId: patch.validatorId,
        dueDate: patch.dueDate,
        priority: patch.priority,
        status: patch.status,
        documents: patch.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Task) => {
        // Synchronise avec la version serveur (notamment pour les
        // vrais ids des documents fraîchement créés).
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      })
      .catch((e) => {
        console.error('[useTasks] update error:', e)
        setTasks(previous)
        alert('Impossible de mettre à jour la tâche.')
      })
  }, [])

  const deleteTask = useCallback((id: string) => {
    let previous: Task[] = []
    setTasks((prev) => {
      previous = prev
      return prev.filter((t) => t.id !== id)
    })

    fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useTasks] delete error:', e)
        setTasks(previous)
        alert('Impossible de supprimer la tâche.')
      })
  }, [])

  const addComment = useCallback((taskId: string, authorId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    const tempId = `cmt-tmp-${Date.now()}`
    const optimistic: TaskComment = {
      id: tempId,
      authorId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    let previous: Task[] = []
    setTasks((prev) => {
      previous = prev
      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...(t.comments ?? []), optimistic],
              updatedAt: optimistic.createdAt,
            }
          : t,
      )
    })

    fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: TaskComment) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: (t.comments ?? []).map((c) =>
                    c.id === tempId ? created : c,
                  ),
                }
              : t,
          ),
        )
      })
      .catch((e) => {
        console.error('[useTasks] addComment error:', e)
        setTasks(previous)
        alert('Impossible d\'ajouter le commentaire.')
      })
  }, [])

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    let previous: Task[] = []
    setTasks((prev) => {
      previous = prev
      return prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: (t.comments ?? []).filter((c) => c.id !== commentId),
              updatedAt: new Date().toISOString(),
            }
          : t,
      )
    })

    fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw r
      })
      .catch((e) => {
        console.error('[useTasks] deleteComment error:', e)
        setTasks(previous)
        alert('Impossible de supprimer le commentaire.')
      })
  }, [])

  // Le reset n'a plus de sens en mode DB — on garde l'export pour
  // compatibilité d'interface mais c'est un no-op.
  const resetTasks = useCallback(() => {
    console.warn('[useTasks] resetTasks() est obsolète en mode DB.')
  }, [])

  return { tasks, hydrated, createTask, updateTask, addComment, deleteComment, deleteTask, resetTasks }
}

'use client'

// Hook de gestion des tâches branché sur l'API /api/tasks
// (PostgreSQL via Prisma — plus de localStorage).
//
// Cache cross-pages via SWR : un seul fetch partagé par tous les composants
// (Sidebar, NotificationsBell, GlobalSearch, pages métier). Revalidation en
// arrière-plan au focus/reconnexion ; mutations optimistes via `mutate()`.

import { useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import type { Task, TaskComment } from '@/lib/types'

const TASKS_KEY = '/api/tasks'

export function useTasks() {
  const { data, mutate } = useSWR<Task[]>(TASKS_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  })
  const tasks = data ?? []
  const hydrated = data !== undefined

  const createTask = useCallback((dataInput: Omit<Task, 'id' | 'createdAt'>, _createdById?: string): Task => {
    void _createdById
    const tempId = `tmp-${Date.now()}`
    const now = new Date().toISOString()
    const optimistic: Task = {
      ...dataInput,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      comments: dataInput.comments ?? [],
    }
    const previous = tasks
    mutate([optimistic, ...previous], { revalidate: false })

    fetch(TASKS_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: dataInput.label,
        description: dataInput.description,
        commissionIds: dataInput.commissionIds,
        assigneeIds: dataInput.assigneeIds,
        validatorId: dataInput.validatorId,
        dueDate: dataInput.dueDate,
        priority: dataInput.priority,
        status: dataInput.status,
        documents: dataInput.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: Task) => {
        mutate((prev) => (prev ?? []).map((t) => (t.id === tempId ? created : t)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useTasks] create error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de créer la tâche.')
      })
    return optimistic
  }, [tasks, mutate])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    const previous = tasks
    const next = previous.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
    )
    mutate(next, { revalidate: false })

    fetch(`${TASKS_KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: patch.label,
        description: patch.description,
        commissionIds: patch.commissionIds,
        assigneeIds: patch.assigneeIds,
        validatorId: patch.validatorId,
        dueDate: patch.dueDate,
        priority: patch.priority,
        status: patch.status,
        documents: patch.documents,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((updated: Task) => {
        mutate((prev) => (prev ?? []).map((t) => (t.id === id ? updated : t)), { revalidate: false })
      })
      .catch((e) => {
        console.error('[useTasks] update error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de mettre à jour la tâche.')
      })
  }, [tasks, mutate])

  const deleteTask = useCallback((id: string) => {
    const previous = tasks
    mutate(previous.filter((t) => t.id !== id), { revalidate: false })

    fetch(`${TASKS_KEY}/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useTasks] delete error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer la tâche.')
      })
  }, [tasks, mutate])

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
    const previous = tasks
    const next = previous.map((t) =>
      t.id === taskId
        ? { ...t, comments: [...(t.comments ?? []), optimistic], updatedAt: optimistic.createdAt }
        : t,
    )
    mutate(next, { revalidate: false })

    fetch(`${TASKS_KEY}/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((created: TaskComment) => {
        mutate(
          (prev) => (prev ?? []).map((t) =>
            t.id === taskId
              ? { ...t, comments: (t.comments ?? []).map((c) => (c.id === tempId ? created : c)) }
              : t,
          ),
          { revalidate: false },
        )
      })
      .catch((e) => {
        console.error('[useTasks] addComment error:', e)
        mutate(previous, { revalidate: false })
        alert("Impossible d'ajouter le commentaire.")
      })
  }, [tasks, mutate])

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    const previous = tasks
    const next = previous.map((t) =>
      t.id === taskId
        ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId), updatedAt: new Date().toISOString() }
        : t,
    )
    mutate(next, { revalidate: false })

    fetch(`${TASKS_KEY}/${taskId}/comments/${commentId}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw r })
      .catch((e) => {
        console.error('[useTasks] deleteComment error:', e)
        mutate(previous, { revalidate: false })
        alert('Impossible de supprimer le commentaire.')
      })
  }, [tasks, mutate])

  // Compatibilité d'interface — no-op en mode DB.
  const resetTasks = useCallback(() => {
    console.warn('[useTasks] resetTasks() est obsolète en mode DB.')
  }, [])

  return { tasks, hydrated, createTask, updateTask, addComment, deleteComment, deleteTask, resetTasks }
}

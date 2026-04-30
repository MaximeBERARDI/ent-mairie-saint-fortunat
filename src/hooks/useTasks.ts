'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Task } from '@/lib/types'
import { TASKS } from '@/lib/data'

const STORAGE_KEY = 'ent-mairie:tasks:v1'

function loadFromStorage(): Task[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed)) return null
    return parsed
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
    if (stored) {
      setTasks(stored)
    } else {
      saveToStorage(TASKS)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveToStorage(tasks)
  }, [tasks, hydrated])

  const createTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [newTask, ...prev])
    return newTask
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const resetTasks = useCallback(() => {
    setTasks(TASKS)
    saveToStorage(TASKS)
  }, [])

  return { tasks, hydrated, createTask, updateTask, deleteTask, resetTasks }
}

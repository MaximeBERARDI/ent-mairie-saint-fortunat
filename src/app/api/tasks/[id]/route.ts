// PATCH  /api/tasks/[id]   → update
// DELETE /api/tasks/[id]   → delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { priorityToDb, statusToDb, taskFromDb } from '@/lib/task-mapper'
import type { TaskPriority, TaskStatus } from '@/lib/types'

interface PatchBody {
  label?: string
  description?: string | null
  commissionId?: string | null
  assigneeId?: string
  validatorId?: string | null
  dueDate?: string | null
  priority?: TaskPriority
  status?: TaskStatus
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.label !== undefined) data.label = body.label.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.commissionId !== undefined) data.commissionId = body.commissionId || null
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId
  if (body.validatorId !== undefined) data.validatorId = body.validatorId || null
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.priority !== undefined) data.priority = priorityToDb(body.priority)
  if (body.status !== undefined) data.status = statusToDb(body.status)

  try {
    const updated = await db.task.update({
      where: { id: params.id },
      data,
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json(taskFromDb(updated))
  } catch {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.task.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  }
}

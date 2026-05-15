// GET  /api/tasks  → liste (avec commentaires inclus)
// POST /api/tasks  → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { priorityToDb, statusToDb, taskFromDb } from '@/lib/task-mapper'
import type { TaskPriority, TaskStatus } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.task.findMany({
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows.map(taskFromDb))
}

interface DocumentInput {
  name: string
  size: number
  type: string
  dataUrl: string
}

interface CreateTaskBody {
  label?: string
  description?: string
  commissionId?: string | null
  assigneeId?: string
  validatorId?: string | null
  dueDate?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  documents?: DocumentInput[]
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: CreateTaskBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.label?.trim() || !body.assigneeId || !body.priority || !body.status) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const created = await db.task.create({
    data: {
      label: body.label.trim(),
      description: body.description?.trim() || null,
      commissionId: body.commissionId || null,
      assigneeId: body.assigneeId,
      validatorId: body.validatorId || null,
      createdById: session.user.personId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: priorityToDb(body.priority),
      status: statusToDb(body.status),
      documents: body.documents && body.documents.length > 0
        ? {
            create: body.documents.map((d) => ({
              name: d.name,
              size: d.size,
              type: d.type,
              dataUrl: d.dataUrl,
            })),
          }
        : undefined,
    },
    include: { comments: true, documents: true },
  })
  return NextResponse.json(taskFromDb(created))
}

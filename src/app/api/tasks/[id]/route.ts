// PATCH  /api/tasks/[id]   → update
// DELETE /api/tasks/[id]   → delete

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { priorityToDb, statusToDb, taskFromDb } from '@/lib/task-mapper'
import type { TaskPriority, TaskStatus } from '@/lib/types'

interface DocumentInput {
  id?: string
  name: string
  size: number
  type: string
  dataUrl: string
}

interface PatchBody {
  label?: string
  description?: string | null
  commissionId?: string | null
  assigneeId?: string
  validatorId?: string | null
  dueDate?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  documents?: DocumentInput[]
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
    // Si documents est fourni dans le body, on remplace l'intégralité
    // (suppression des anciens + création des nouveaux) dans une
    // transaction. Si non, on ne touche pas aux documents existants.
    const updated = await db.$transaction(async (tx) => {
      if (body.documents !== undefined) {
        // Conserve les documents existants dont l'id est repassé,
        // supprime ceux qui ne sont plus là, crée les nouveaux.
        const keptIds = body.documents
          .filter((d) => d.id && !d.id.startsWith('tmp-'))
          .map((d) => d.id!)
        await tx.document.deleteMany({
          where: { taskId: params.id, id: { notIn: keptIds.length > 0 ? keptIds : [''] } },
        })
        const newDocs = body.documents.filter(
          (d) => !d.id || d.id.startsWith('tmp-'),
        )
        if (newDocs.length > 0) {
          await tx.document.createMany({
            data: newDocs.map((d) => ({
              taskId: params.id,
              name: d.name,
              size: d.size,
              type: d.type,
              dataUrl: d.dataUrl,
            })),
          })
        }
      }
      return tx.task.update({
        where: { id: params.id },
        data,
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          documents: { orderBy: { uploadedAt: 'asc' } },
        },
      })
    })
    return NextResponse.json(taskFromDb(updated))
  } catch (e) {
    console.error('[api/tasks PATCH]', e)
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

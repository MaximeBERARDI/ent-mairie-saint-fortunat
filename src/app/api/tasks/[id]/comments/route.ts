// POST /api/tasks/[id]/comments  → ajoute un commentaire

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { commentFromDb } from '@/lib/task-mapper'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.personId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const content = body.content?.trim()
  if (!content) return NextResponse.json({ error: 'Contenu vide.' }, { status: 400 })

  try {
    const created = await db.taskComment.create({
      data: {
        taskId: params.id,
        authorId: session.user.personId,
        content,
      },
    })
    // Touche updatedAt de la tâche parente (l'update est implicite via la mise à jour Prisma)
    await db.task.update({ where: { id: params.id }, data: {} })
    return NextResponse.json(commentFromDb(created))
  } catch {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  }
}

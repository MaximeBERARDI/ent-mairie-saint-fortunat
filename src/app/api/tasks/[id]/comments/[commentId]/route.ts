// DELETE /api/tasks/[id]/comments/[commentId]  → supprime un commentaire

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: { id: string; commentId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.taskComment.delete({ where: { id: params.commentId } })
    await db.task.update({ where: { id: params.id }, data: {} })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Commentaire introuvable.' }, { status: 404 })
  }
}

// DELETE /api/historique/[id]  → supprime un exercice. Permission finance.manage-budget.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.manage-budget')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.exerciceHistorique.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Exercice introuvable.' }, { status: 404 })
  }
}

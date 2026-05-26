// DELETE /api/ecritures/[id]  → supprime une écriture (et ses lignes en cascade).
// Permission finance.view-all.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('finance.view-all')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.ecriture.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Écriture introuvable.' }, { status: 404 })
  }
}

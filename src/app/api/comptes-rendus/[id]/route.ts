// DELETE /api/comptes-rendus/[id]  → supprime un compte rendu. Permission cr.upload.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('cr.upload')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  try {
    await db.compteRendu.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Compte rendu introuvable.' }, { status: 404 })
  }
}

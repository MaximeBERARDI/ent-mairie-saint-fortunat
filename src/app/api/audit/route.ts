// GET /api/audit → derniers évènements du journal d'audit (admin uniquement).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('team.edit-roles')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const rows = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })
  return NextResponse.json(rows)
}

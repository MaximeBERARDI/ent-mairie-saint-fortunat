// PATCH  /api/commissions/[id]   → update (partial)
// DELETE /api/commissions/[id]   → suppression

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: { name?: string; color?: string; nextMeeting?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const data: Record<string, string> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.color !== undefined) data.color = body.color
  if (body.nextMeeting !== undefined) data.nextMeeting = body.nextMeeting.trim()

  try {
    const updated = await db.commission.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      nextMeeting: updated.nextMeeting,
      tasks: 0,
      members: 0,
      docs: 0,
    })
  } catch {
    return NextResponse.json({ error: 'Commission introuvable.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    await db.commission.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Commission introuvable.' }, { status: 404 })
  }
}

// GET  /api/commissions       → liste
// POST /api/commissions       → create

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const rows = await db.commission.findMany({ orderBy: { name: 'asc' } })
  // Le type front a aussi tasks/members/docs (compteurs d'affichage) qu'on
  // initialise à 0 — les pages les recalculent depuis les vraies relations.
  const commissions = rows.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    nextMeeting: c.nextMeeting,
    tasks: 0,
    members: 0,
    docs: 0,
  }))
  return NextResponse.json(commissions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: { name?: string; color?: string; nextMeeting?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })
  }

  // Génère un id unique basé sur le slug
  const base = slugify(body.name) || `comm-${Date.now()}`
  let id = base
  let suffix = 1
  while (await db.commission.findUnique({ where: { id } })) {
    id = `${base}-${suffix++}`
  }

  const created = await db.commission.create({
    data: {
      id,
      name: body.name.trim(),
      color: body.color ?? '#888888',
      nextMeeting: body.nextMeeting?.trim() || 'À planifier',
    },
  })

  return NextResponse.json({
    id: created.id,
    name: created.name,
    color: created.color,
    nextMeeting: created.nextMeeting,
    tasks: 0,
    members: 0,
    docs: 0,
  })
}

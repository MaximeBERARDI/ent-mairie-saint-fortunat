// GET  /api/library/folders         → arbre complet (à plat, le front construit l'arbre)
// POST /api/library/folders         → crée un dossier { name, parentId? }
//
// Permissions :
//   - GET  : library.read
//   - POST : library.write

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'

interface CreateBody {
  name?: string
  parentId?: string | null
}

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.read')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const folders = await db.libraryFolder.findMany({ orderBy: [{ name: 'asc' }] })
  return NextResponse.json(
    folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId ?? undefined,
      createdById: f.createdById,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  )
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.write')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  let body: CreateBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
  if (name.length > 120) return NextResponse.json({ error: 'Nom trop long (120 caractères max).' }, { status: 400 })

  const parentId = body.parentId ?? null

  if (parentId) {
    const parent = await db.libraryFolder.findUnique({ where: { id: parentId } })
    if (!parent) return NextResponse.json({ error: 'Dossier parent introuvable.' }, { status: 404 })
  }

  try {
    const created = await db.libraryFolder.create({
      data: { name, parentId, createdById: ctx.actor.id },
    })
    return NextResponse.json({
      id: created.id,
      name: created.name,
      parentId: created.parentId ?? undefined,
      createdById: created.createdById,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Un dossier de ce nom existe déjà à cet emplacement.' }, { status: 409 })
    }
    console.error('[api/library/folders POST]', e)
    return NextResponse.json({ error: 'Création impossible.' }, { status: 500 })
  }
}

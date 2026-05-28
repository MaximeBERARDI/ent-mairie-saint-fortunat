// PATCH  /api/library/folders/[id]  → rename / move { name?, parentId? }
// DELETE /api/library/folders/[id]  → supprime + cascade (DB + fichiers Storage)
//
// Permissions :
//   - PATCH  : library.write (le créateur peut renommer/déplacer ses dossiers,
//              library.admin pour ceux des autres)
//   - DELETE : library.admin

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { deleteFile } from '@/lib/supabase-storage'

interface PatchBody {
  name?: string
  parentId?: string | null
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.write')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const existing = await db.libraryFolder.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
  if (existing.createdById !== ctx.actor.id && !ctx.can('library.admin')) {
    return NextResponse.json({ error: 'Seul un administrateur peut modifier ce dossier.' }, { status: 403 })
  }

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: { name?: string; parentId?: string | null } = {}
  if (body.name !== undefined) {
    const n = body.name.trim()
    if (!n) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
    if (n.length > 120) return NextResponse.json({ error: 'Nom trop long.' }, { status: 400 })
    data.name = n
  }
  if (body.parentId !== undefined) {
    if (body.parentId === params.id) {
      return NextResponse.json({ error: 'Un dossier ne peut pas être son propre parent.' }, { status: 400 })
    }
    if (body.parentId) {
      const parent = await db.libraryFolder.findUnique({ where: { id: body.parentId } })
      if (!parent) return NextResponse.json({ error: 'Dossier parent introuvable.' }, { status: 404 })
      // Empêche les cycles : remonter la chaîne parentale ; si on retombe sur
      // params.id, on aurait un cycle.
      let cursor: string | null = parent.parentId
      while (cursor) {
        if (cursor === params.id) {
          return NextResponse.json({ error: 'Déplacement impossible : créerait une boucle.' }, { status: 400 })
        }
        const p: { parentId: string | null } | null = await db.libraryFolder.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        })
        cursor = p?.parentId ?? null
      }
    }
    data.parentId = body.parentId
  }

  try {
    const updated = await db.libraryFolder.update({ where: { id: params.id }, data })
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      parentId: updated.parentId ?? undefined,
      createdById: updated.createdById,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Un dossier de ce nom existe déjà à cet emplacement.' }, { status: 409 })
    }
    console.error('[api/library/folders PATCH]', e)
    return NextResponse.json({ error: 'Modification impossible.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.admin')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const existing = await db.libraryFolder.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })

  // Récolte tous les chemins de fichiers à supprimer dans Storage avant la
  // suppression DB (cascade), pour pouvoir les retirer du bucket.
  // BFS sur les descendants.
  const allFolderIds: string[] = [params.id]
  let frontier: string[] = [params.id]
  while (frontier.length > 0) {
    const children = await db.libraryFolder.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    })
    const ids = children.map((c) => c.id)
    if (ids.length === 0) break
    allFolderIds.push(...ids)
    frontier = ids
  }
  const docs = await db.libraryDocument.findMany({
    where: { folderId: { in: allFolderIds } },
    select: { storagePath: true },
  })

  // Supprime d'abord les fichiers du bucket — si le bucket échoue, on ne touche
  // pas à la DB pour éviter des orphelins côté Storage.
  for (const d of docs) {
    try { await deleteFile(d.storagePath) }
    catch (e) {
      console.error('[api/library/folders DELETE] storage error:', e)
      return NextResponse.json({ error: 'Suppression Storage échouée — DB non modifiée.' }, { status: 500 })
    }
  }

  await db.libraryFolder.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

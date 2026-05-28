// PATCH  /api/library/documents/[id]  → rename / move { name?, folderId? }
// DELETE /api/library/documents/[id]  → supprime (DB + Storage)
//
// Permissions :
//   - PATCH  : library.write (uploader ou library.admin)
//   - DELETE : library.write (uploader ou library.admin)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { deleteFile } from '@/lib/supabase-storage'

interface PatchBody {
  name?: string
  folderId?: string
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.write')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const existing = await db.libraryDocument.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
  if (existing.uploadedById !== ctx.actor.id && !ctx.can('library.admin')) {
    return NextResponse.json({ error: 'Seul un administrateur peut modifier ce document.' }, { status: 403 })
  }

  let body: PatchBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }) }

  const data: { name?: string; folderId?: string } = {}
  if (body.name !== undefined) {
    const n = body.name.trim()
    if (!n) return NextResponse.json({ error: 'Nom requis.' }, { status: 400 })
    if (n.length > 200) return NextResponse.json({ error: 'Nom trop long.' }, { status: 400 })
    data.name = n
  }
  if (body.folderId !== undefined) {
    const folder = await db.libraryFolder.findUnique({ where: { id: body.folderId } })
    if (!folder) return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })
    data.folderId = body.folderId
  }

  const updated = await db.libraryDocument.update({ where: { id: params.id }, data })
  return NextResponse.json({
    id: updated.id,
    folderId: updated.folderId,
    name: updated.name,
    filename: updated.filename,
    mimeType: updated.mimeType,
    size: updated.size,
    uploadedById: updated.uploadedById,
    uploadedAt: updated.uploadedAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.write')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const existing = await db.libraryDocument.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
  if (existing.uploadedById !== ctx.actor.id && !ctx.can('library.admin')) {
    return NextResponse.json({ error: 'Seul un administrateur peut supprimer ce document.' }, { status: 403 })
  }

  // Supprime d'abord dans Storage, puis en DB. Si Storage échoue → on ne
  // touche pas à la DB.
  try { await deleteFile(existing.storagePath) }
  catch (e) {
    console.error('[api/library/documents DELETE] storage:', e)
    return NextResponse.json({ error: 'Suppression Storage échouée.' }, { status: 502 })
  }
  await db.libraryDocument.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

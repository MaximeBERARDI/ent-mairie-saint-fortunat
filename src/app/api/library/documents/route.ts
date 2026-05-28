// GET  /api/library/documents?folderId=<id>  → liste des docs d'un dossier
// POST /api/library/documents                → multipart/form-data : file + folderId + name?
//
// Permissions :
//   - GET  : library.read
//   - POST : library.write
//
// Limite : 25 Mo / fichier (taille HTTP). Vérifiée côté serveur.

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { uploadFile, deleteFile, isStorageConfigured } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024

export async function GET(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.read')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  if (!folderId) return NextResponse.json({ error: 'folderId requis.' }, { status: 400 })

  const docs = await db.libraryDocument.findMany({
    where: { folderId },
    orderBy: [{ uploadedAt: 'desc' }],
  })
  return NextResponse.json(
    docs.map((d) => ({
      id: d.id,
      folderId: d.folderId,
      name: d.name,
      filename: d.filename,
      mimeType: d.mimeType,
      size: d.size,
      uploadedById: d.uploadedById,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
  )
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.write')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Stockage non configuré. L\'admin doit définir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 },
    )
  }

  let form: FormData
  try { form = await req.formData() }
  catch { return NextResponse.json({ error: 'Requête multipart invalide.' }, { status: 400 }) }

  const file = form.get('file')
  const folderId = form.get('folderId')
  const displayName = form.get('name')

  if (!(file instanceof File)) return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
  if (typeof folderId !== 'string' || !folderId) return NextResponse.json({ error: 'folderId requis.' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Fichier trop volumineux (limite ${MAX_BYTES / 1024 / 1024} Mo).` }, { status: 413 })
  }

  const folder = await db.libraryFolder.findUnique({ where: { id: folderId } })
  if (!folder) return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 })

  const documentId = randomUUID()
  const safeFilename = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 200) || 'fichier'
  const storagePath = `${folderId}/${documentId}-${safeFilename}`

  const bytes = Buffer.from(await file.arrayBuffer())
  try {
    await uploadFile(storagePath, bytes, file.type || 'application/octet-stream')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erreur inconnue'
    console.error('[api/library/documents POST] upload:', e)
    return NextResponse.json({ error: `Upload Supabase Storage échoué : ${msg}` }, { status: 502 })
  }

  try {
    const created = await db.libraryDocument.create({
      data: {
        id: documentId,
        folderId,
        name: (typeof displayName === 'string' && displayName.trim()) || file.name,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        storagePath,
        uploadedById: ctx.actor.id,
      },
    })
    return NextResponse.json({
      id: created.id,
      folderId: created.folderId,
      name: created.name,
      filename: created.filename,
      mimeType: created.mimeType,
      size: created.size,
      uploadedById: created.uploadedById,
      uploadedAt: created.uploadedAt.toISOString(),
    })
  } catch (e) {
    // Rollback du bucket : la métadonnée DB n'a pas pu s'écrire, on retire le
    // fichier orphelin.
    try { await deleteFile(storagePath) } catch { /* best effort */ }
    console.error('[api/library/documents POST] db:', e)
    return NextResponse.json({ error: 'Enregistrement DB échoué.' }, { status: 500 })
  }
}

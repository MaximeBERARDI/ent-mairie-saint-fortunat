// GET /api/library/documents/[id]/download
//
// Renvoie une URL signée Supabase (valide 15 min) sous forme JSON { url }.
// Le client navigue alors directement vers l'URL (téléchargement / ouverture
// dans un nouvel onglet selon le mime-type).

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext } from '@/lib/authz'
import { getSignedUrl, isStorageConfigured } from '@/lib/supabase-storage'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  if (!ctx.can('library.read')) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 })
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Stockage non configuré.' },
      { status: 503 },
    )
  }

  const doc = await db.libraryDocument.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })

  try {
    const url = await getSignedUrl(doc.storagePath)
    return NextResponse.json({ url, filename: doc.filename, mimeType: doc.mimeType })
  } catch (e) {
    console.error('[api/library/documents/download]', e)
    return NextResponse.json({ error: 'URL indisponible.' }, { status: 502 })
  }
}

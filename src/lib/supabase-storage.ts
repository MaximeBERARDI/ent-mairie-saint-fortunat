// Helpers Supabase Storage côté serveur.
//
// ⚠️ Ce module utilise la clé service_role qui contourne RLS — il ne doit
// JAMAIS être importé depuis un composant client. Réservé aux route handlers.
//
// Variables d'env requises :
//   SUPABASE_URL                  ex: https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     clé service_role (Settings → API)
//
// Si une variable manque, getStorageClient() lance une erreur explicite
// que les routes API renvoient telle quelle au client (statut 500).

import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const LIBRARY_BUCKET = 'library-files'
export const SIGNED_URL_EXPIRES_SECONDS = 900   // 15 min

let cached: SupabaseClient | null = null

function getStorageClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Supabase Storage non configuré. Définir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l'environnement.",
    )
  }
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function uploadFile(
  path: string,
  body: ArrayBuffer | Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  const sb = getStorageClient()
  const { error } = await sb.storage.from(LIBRARY_BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(`Upload Supabase échoué : ${error.message}`)
}

export async function deleteFile(path: string): Promise<void> {
  const sb = getStorageClient()
  const { error } = await sb.storage.from(LIBRARY_BUCKET).remove([path])
  if (error) throw new Error(`Suppression Supabase échouée : ${error.message}`)
}

export async function getSignedUrl(
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRES_SECONDS,
): Promise<string> {
  const sb = getStorageClient()
  const { data, error } = await sb.storage.from(LIBRARY_BUCKET).createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) throw new Error(`URL signée Supabase indisponible : ${error?.message ?? 'inconnu'}`)
  return data.signedUrl
}

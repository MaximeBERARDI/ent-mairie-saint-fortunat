'use client'

// Hook de gestion de la bibliothèque (arborescence + documents).
// Optimistic update pour les CRUD légers (création / rename / move / delete).
// L'upload de fichier passe en flux non-optimiste : on attend la réponse du
// serveur car le fichier doit transiter par Supabase Storage.

import { useEffect, useState, useCallback } from 'react'
import type { LibraryFolder, LibraryDocument } from '@/lib/types'

export function useLibrary() {
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [documentsByFolder, setDocumentsByFolder] = useState<Record<string, LibraryDocument[]>>({})
  const [hydrated, setHydrated] = useState(false)

  // Charge l'arborescence au montage.
  useEffect(() => {
    let cancelled = false
    fetch('/api/library/folders')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: LibraryFolder[]) => { if (!cancelled) { setFolders(data); setHydrated(true) } })
      .catch((e) => { if (!cancelled) { console.error('[useLibrary] folders load:', e); setHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  // Charge les documents d'un dossier (lazy, à la sélection).
  const loadFolderDocuments = useCallback(async (folderId: string): Promise<LibraryDocument[]> => {
    try {
      const r = await fetch(`/api/library/documents?folderId=${encodeURIComponent(folderId)}`)
      if (!r.ok) throw r
      const docs: LibraryDocument[] = await r.json()
      setDocumentsByFolder((prev) => ({ ...prev, [folderId]: docs }))
      return docs
    } catch (e) {
      console.error('[useLibrary] documents load:', e)
      return []
    }
  }, [])

  const createFolder = useCallback(async (name: string, parentId?: string): Promise<LibraryFolder | null> => {
    try {
      const r = await fetch('/api/library/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: parentId ?? null }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Création impossible.')
        return null
      }
      const created: LibraryFolder = await r.json()
      setFolders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'fr')))
      return created
    } catch (e) {
      console.error('[useLibrary] createFolder:', e)
      alert('Création impossible.')
      return null
    }
  }, [])

  const renameFolder = useCallback(async (id: string, name: string): Promise<void> => {
    const previous = folders
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
    try {
      const r = await fetch(`/api/library/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        setFolders(previous)
        alert(err.error ?? 'Renommage impossible.')
      } else {
        const updated: LibraryFolder = await r.json()
        setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)))
      }
    } catch (e) {
      setFolders(previous)
      console.error('[useLibrary] renameFolder:', e)
      alert('Renommage impossible.')
    }
  }, [folders])

  const moveFolder = useCallback(async (id: string, parentId: string | null): Promise<void> => {
    const previous = folders
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, parentId: parentId ?? undefined } : f)))
    try {
      const r = await fetch(`/api/library/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        setFolders(previous)
        alert(err.error ?? 'Déplacement impossible.')
      }
    } catch (e) {
      setFolders(previous)
      console.error('[useLibrary] moveFolder:', e)
      alert('Déplacement impossible.')
    }
  }, [folders])

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`/api/library/folders/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Suppression impossible.')
        return false
      }
      // Le serveur cascade les enfants ; on retire localement le dossier et
      // toute sa descendance.
      setFolders((prev) => {
        const toRemove = new Set<string>([id])
        let changed = true
        while (changed) {
          changed = false
          for (const f of prev) {
            if (f.parentId && toRemove.has(f.parentId) && !toRemove.has(f.id)) {
              toRemove.add(f.id)
              changed = true
            }
          }
        }
        return prev.filter((f) => !toRemove.has(f.id))
      })
      setDocumentsByFolder((prev) => {
        const out = { ...prev }
        delete out[id]
        return out
      })
      return true
    } catch (e) {
      console.error('[useLibrary] deleteFolder:', e)
      alert('Suppression impossible.')
      return false
    }
  }, [])

  const uploadDocument = useCallback(async (file: File, folderId: string, name?: string): Promise<LibraryDocument | null> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folderId', folderId)
    if (name && name.trim()) fd.append('name', name.trim())
    try {
      const r = await fetch('/api/library/documents', { method: 'POST', body: fd })
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Upload impossible.')
        return null
      }
      const created: LibraryDocument = await r.json()
      setDocumentsByFolder((prev) => ({
        ...prev,
        [folderId]: [created, ...(prev[folderId] ?? [])],
      }))
      return created
    } catch (e) {
      console.error('[useLibrary] upload:', e)
      alert('Upload impossible.')
      return null
    }
  }, [])

  const renameDocument = useCallback(async (id: string, folderId: string, name: string): Promise<void> => {
    const previous = documentsByFolder[folderId] ?? []
    setDocumentsByFolder((prev) => ({
      ...prev,
      [folderId]: (prev[folderId] ?? []).map((d) => (d.id === id ? { ...d, name } : d)),
    }))
    try {
      const r = await fetch(`/api/library/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!r.ok) {
        setDocumentsByFolder((prev) => ({ ...prev, [folderId]: previous }))
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Renommage impossible.')
      }
    } catch (e) {
      setDocumentsByFolder((prev) => ({ ...prev, [folderId]: previous }))
      console.error('[useLibrary] renameDocument:', e)
      alert('Renommage impossible.')
    }
  }, [documentsByFolder])

  const moveDocument = useCallback(async (id: string, fromFolderId: string, toFolderId: string): Promise<void> => {
    const fromPrev = documentsByFolder[fromFolderId] ?? []
    const toPrev = documentsByFolder[toFolderId] ?? []
    const doc = fromPrev.find((d) => d.id === id)
    if (!doc) return
    setDocumentsByFolder((prev) => ({
      ...prev,
      [fromFolderId]: (prev[fromFolderId] ?? []).filter((d) => d.id !== id),
      [toFolderId]: [{ ...doc, folderId: toFolderId }, ...(prev[toFolderId] ?? [])],
    }))
    try {
      const r = await fetch(`/api/library/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: toFolderId }),
      })
      if (!r.ok) {
        setDocumentsByFolder((prev) => ({ ...prev, [fromFolderId]: fromPrev, [toFolderId]: toPrev }))
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Déplacement impossible.')
      }
    } catch (e) {
      setDocumentsByFolder((prev) => ({ ...prev, [fromFolderId]: fromPrev, [toFolderId]: toPrev }))
      console.error('[useLibrary] moveDocument:', e)
      alert('Déplacement impossible.')
    }
  }, [documentsByFolder])

  const deleteDocument = useCallback(async (id: string, folderId: string): Promise<void> => {
    const previous = documentsByFolder[folderId] ?? []
    setDocumentsByFolder((prev) => ({
      ...prev,
      [folderId]: (prev[folderId] ?? []).filter((d) => d.id !== id),
    }))
    try {
      const r = await fetch(`/api/library/documents/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        setDocumentsByFolder((prev) => ({ ...prev, [folderId]: previous }))
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Suppression impossible.')
      }
    } catch (e) {
      setDocumentsByFolder((prev) => ({ ...prev, [folderId]: previous }))
      console.error('[useLibrary] deleteDocument:', e)
      alert('Suppression impossible.')
    }
  }, [documentsByFolder])

  const getDownloadUrl = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      const r = await fetch(`/api/library/documents/${documentId}/download`)
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: 'Erreur inconnue.' }))
        alert(err.error ?? 'Téléchargement impossible.')
        return null
      }
      const { url }: { url: string } = await r.json()
      return url
    } catch (e) {
      console.error('[useLibrary] getDownloadUrl:', e)
      alert('Téléchargement impossible.')
      return null
    }
  }, [])

  return {
    folders,
    documentsByFolder,
    hydrated,
    loadFolderDocuments,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    uploadDocument,
    renameDocument,
    moveDocument,
    deleteDocument,
    getDownloadUrl,
  }
}

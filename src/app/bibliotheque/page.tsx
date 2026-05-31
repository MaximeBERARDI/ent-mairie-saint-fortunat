'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { useLibrary } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeam } from '@/hooks/useTeam'
import type { LibraryFolder } from '@/lib/types'

const MAX_FILE_BYTES = 25 * 1024 * 1024

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️'
  if (mime === 'application/pdf') return '📄'
  if (mime.includes('word')) return '📝'
  if (mime.includes('sheet') || mime.includes('excel')) return '📊'
  if (mime.includes('zip') || mime.includes('compressed')) return '🗜️'
  return '📎'
}

// Construit l'arbre des dossiers depuis la liste plate. Renvoie les racines.
interface TreeNode {
  folder: LibraryFolder
  children: TreeNode[]
}
function buildTree(folders: LibraryFolder[]): TreeNode[] {
  const byId: Record<string, TreeNode> = {}
  folders.forEach((f) => { byId[f.id] = { folder: f, children: [] } })
  const roots: TreeNode[] = []
  folders.forEach((f) => {
    if (f.parentId && byId[f.parentId]) byId[f.parentId].children.push(byId[f.id])
    else roots.push(byId[f.id])
  })
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.folder.name.localeCompare(b.folder.name, 'fr'))
    nodes.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

function breadcrumb(folder: LibraryFolder | null, folders: LibraryFolder[]): LibraryFolder[] {
  if (!folder) return []
  const chain: LibraryFolder[] = [folder]
  let cursor = folder.parentId
  while (cursor) {
    const parent = folders.find((f) => f.id === cursor)
    if (!parent) break
    chain.unshift(parent)
    cursor = parent.parentId
  }
  return chain
}

export default function BibliothequePage() {
  return (
    <Shell title="Bibliothèque">
      <BibliothequeView />
    </Shell>
  )
}

function BibliothequeView() {
  const { can, currentUser } = useCurrentUser()
  const { people } = useTeam()
  const lib = useLibrary()
  const {
    folders, documentsByFolder, hydrated,
    loadFolderDocuments, createFolder, renameFolder, deleteFolder,
    uploadDocument, renameDocument, deleteDocument, getDownloadUrl,
  } = lib

  const canRead = can('library.read')
  const canWrite = can('library.write')
  const canAdmin = can('library.admin')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewRootForm, setShowNewRootForm] = useState(false)
  const [newRootName, setNewRootName] = useState('')
  const [showSubFolderForm, setShowSubFolderForm] = useState(false)
  const [newSubFolderName, setNewSubFolderName] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const tree = useMemo(() => buildTree(folders), [folders])
  const selectedFolder = selectedId ? folders.find((f) => f.id === selectedId) ?? null : null
  const path = useMemo(() => breadcrumb(selectedFolder, folders), [selectedFolder, folders])
  const docs = selectedId ? documentsByFolder[selectedId] ?? null : null

  // Charge les docs du dossier sélectionné si pas déjà en cache.
  useEffect(() => {
    if (selectedId && documentsByFolder[selectedId] === undefined) {
      loadFolderDocuments(selectedId)
    }
  }, [selectedId, documentsByFolder, loadFolderDocuments])

  if (!canRead) {
    return (
      <Card padding={20}>
        <p style={{ fontSize: 13, color: C.subtle }}>Vous n&apos;avez pas accès à la bibliothèque.</p>
      </Card>
    )
  }

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  const handleCreateRoot = async () => {
    const name = newRootName.trim()
    if (!name) return
    const created = await createFolder(name, undefined)
    if (created) {
      setNewRootName('')
      setShowNewRootForm(false)
      setSelectedId(created.id)
    }
  }

  const handleCreateSubFolder = async () => {
    if (!selectedId) return
    const name = newSubFolderName.trim()
    if (!name) return
    const created = await createFolder(name, selectedId)
    if (created) {
      setNewSubFolderName('')
      setShowSubFolderForm(false)
      setSelectedId(created.id)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedId) return
    setUploadError(null)
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setUploadError(`"${file.name}" dépasse ${MAX_FILE_BYTES / 1024 / 1024} Mo.`)
        continue
      }
      await uploadDocument(file, selectedId)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRenameFolder = async (folder: LibraryFolder) => {
    const name = window.prompt('Nouveau nom du dossier', folder.name)
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === folder.name) return
    await renameFolder(folder.id, trimmed)
  }

  const handleDeleteFolder = async (folder: LibraryFolder) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" et tout son contenu ?\nCette action est irréversible.`)) return
    const ok = await deleteFolder(folder.id)
    if (ok && selectedId === folder.id) setSelectedId(folder.parentId ?? null)
  }

  const handleDownload = async (docId: string) => {
    const url = await getDownloadUrl(docId)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRenameDocument = async (id: string, currentName: string, folderId: string) => {
    const name = window.prompt('Nouveau nom du document', currentName)
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) return
    await renameDocument(id, folderId, trimmed)
  }

  const handleDeleteDocument = async (id: string, folderId: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await deleteDocument(id, folderId)
  }

  return (
    <div className="split" style={{ display: 'flex', gap: 'var(--gap)' }}>
      {/* Arbre des dossiers */}
      <Card className="split__aside" style={{ flex: '0 0 280px' }} padding={12}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dossiers</p>
          {canWrite && (
            <button
              onClick={() => setShowNewRootForm((s) => !s)}
              style={{ background: 'transparent', border: 'none', color: C.green, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
              title="Créer un dossier racine"
              aria-label="Créer un dossier racine"
            >+</button>
          )}
        </div>

        {showNewRootForm && canWrite && (
          <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              autoFocus
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRoot(); if (e.key === 'Escape') { setShowNewRootForm(false); setNewRootName('') } }}
              placeholder="Nom du dossier"
              style={{ width: '100%', padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.fg }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="sm" onClick={() => { setShowNewRootForm(false); setNewRootName('') }}>Annuler</Button>
              <Button variant="primary" size="sm" onClick={handleCreateRoot} disabled={!newRootName.trim()}>Créer</Button>
            </div>
          </div>
        )}

        {tree.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '10px 0' }}>
            Aucun dossier — {canWrite ? 'cliquez sur + pour en créer un.' : 'demandez à un contributeur d\'en créer.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tree.map((node) => (
              <FolderTreeRow key={node.folder.id} node={node} depth={0} selectedId={selectedId} onSelect={setSelectedId} />
            ))}
          </div>
        )}
      </Card>

      {/* Contenu du dossier sélectionné */}
      <Card className="split__main" style={{ flex: 1 }} padding={14}>
        {!selectedFolder ? (
          <p style={{ fontSize: 12, color: C.subtle, padding: 20, textAlign: 'center' }}>
            Sélectionnez un dossier à gauche pour voir son contenu.
          </p>
        ) : (
          <>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, fontSize: 12, color: C.subtle, marginBottom: 10 }}>
              <span style={{ color: C.subtle }}>Bibliothèque</span>
              {path.map((f, i) => (
                <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>›</span>
                  <button
                    onClick={() => setSelectedId(f.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === path.length - 1 ? C.fg : C.subtle, fontWeight: i === path.length - 1 ? 600 : 400, fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: 0 }}
                  >{f.name}</button>
                </span>
              ))}
            </div>

            {/* Actions sur le dossier */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {canWrite && (
                <Button size="sm" onClick={() => setShowSubFolderForm((s) => !s)}>+ Sous-dossier</Button>
              )}
              {canWrite && (
                <Button size="sm" onClick={() => fileInputRef.current?.click()}>+ Déposer un fichier</Button>
              )}
              {canWrite && (
                <Button size="sm" onClick={() => handleRenameFolder(selectedFolder)}>Renommer</Button>
              )}
              {canAdmin && (
                <Button size="sm" variant="danger" onClick={() => handleDeleteFolder(selectedFolder)}>Supprimer le dossier</Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />
            </div>

            {showSubFolderForm && canWrite && (
              <div style={{ marginBottom: 10, padding: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  autoFocus
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubFolder(); if (e.key === 'Escape') { setShowSubFolderForm(false); setNewSubFolderName('') } }}
                  placeholder={`Nouveau sous-dossier dans "${selectedFolder.name}"`}
                  style={{ width: '100%', padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: C.fg, background: '#fff' }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button size="sm" onClick={() => { setShowSubFolderForm(false); setNewSubFolderName('') }}>Annuler</Button>
                  <Button variant="primary" size="sm" onClick={handleCreateSubFolder} disabled={!newSubFolderName.trim()}>Créer</Button>
                </div>
              </div>
            )}

            <Separator my={10} />

            {/* Zone de dépôt + liste des fichiers */}
            <div
              onDragOver={(e) => { if (canWrite) { e.preventDefault(); setIsDragging(true) } }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                if (!canWrite) return
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
              }}
              style={{
                border: `2px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? C.green : C.border}`,
                borderRadius: 6,
                padding: 12,
                background: isDragging ? C.greenLight : 'transparent',
                transition: 'background 120ms ease',
                minHeight: 100,
              }}
            >
              {uploadError && (
                <p style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{uploadError}</p>
              )}

              {docs === null ? (
                <p style={{ fontSize: 12, color: C.subtle, padding: 8 }}>Chargement des documents…</p>
              ) : docs.length === 0 ? (
                <p style={{ fontSize: 12, color: C.subtle, textAlign: 'center', padding: 24 }}>
                  Aucun document — {canWrite ? 'glissez-déposez vos fichiers ici (max 25 Mo / fichier) ou utilisez « + Déposer un fichier ».' : 'aucun document dans ce dossier.'}
                </p>
              ) : (
                <SectionHeader title={`Documents (${docs.length})`} />
              )}

              {docs && docs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {docs.map((d) => {
                    const uploader = people.find((p) => p.id === d.uploadedById)
                    const mine = currentUser?.id === d.uploadedById
                    return (
                      <div
                        key={d.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6 }}
                      >
                        <span style={{ fontSize: 18 }}>{fileIcon(d.mimeType)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                          <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
                            {formatBytes(d.size)} • déposé par {uploader?.fullName ?? '—'} • {new Date(d.uploadedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(d.id)}
                          style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', color: C.fg, cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                        >Télécharger</button>
                        {(canWrite && (mine || canAdmin)) && (
                          <button
                            onClick={() => handleRenameDocument(d.id, d.name, d.folderId)}
                            style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: 'transparent', color: C.subtle, cursor: 'pointer', fontSize: 11 }}
                            title="Renommer"
                          >Renommer</button>
                        )}
                        {(canWrite && (mine || canAdmin)) && (
                          <button
                            onClick={() => handleDeleteDocument(d.id, d.folderId, d.name)}
                            style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}
                          >Supprimer</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function FolderTreeRow({
  node, depth, selectedId, onSelect,
}: {
  node: TreeNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const isSelected = selectedId === node.folder.id
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        onClick={() => onSelect(node.folder.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 6px',
          paddingLeft: 6 + depth * 14,
          borderRadius: 4,
          background: isSelected ? C.greenLight : 'transparent',
          color: isSelected ? C.green : C.fg,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
            aria-label={open ? 'Replier' : 'Déplier'}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 10, padding: 0, width: 12, height: 12, lineHeight: 1 }}
          >{open ? '▾' : '▸'}</button>
        ) : (
          <span style={{ width: 12, display: 'inline-block' }} />
        )}
        <span style={{ fontSize: 13 }}>📁</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.folder.name}</span>
      </div>
      {open && hasChildren && node.children.map((child) => (
        <FolderTreeRow key={child.folder.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

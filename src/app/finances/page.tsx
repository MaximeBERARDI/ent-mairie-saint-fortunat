'use client'

import { useState, useMemo, useRef } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { useFactures } from '@/hooks/useFactures'
import { useFournisseurs } from '@/hooks/useFournisseurs'
import { useBudget } from '@/hooks/useBudget'
import { useEcritures } from '@/hooks/useEcritures'
import { useTeam } from '@/hooks/useTeam'
import { hasPermission } from '@/lib/permissions'
import type { Facture, FactureStatut, Fournisseur, PosteBudget, TaskDocument } from '@/lib/types'
import { BudgetM14View } from '@/components/finances/BudgetM14View'
import { ParcImmobilierView } from '@/components/finances/ParcImmobilierView'

type FinView = 'factures' | 'budget' | 'fournisseurs' | 'parc-immobilier'

// Pas encore de système d'auth réel : on simule la session du maire (Jean Martin)
const CURRENT_USER_ID = 'p-jm'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtMontantDecimal = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const MAX_FILE_SIZE = 1024 * 1024            // 1 Mo / fichier
const MAX_TOTAL_SIZE = 4 * 1024 * 1024       // 4 Mo total

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function FinancesPage() {
  const [view, setView] = useState<FinView>('factures')

  return (
    <Shell title="Finances">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['factures', 'Factures'], ['budget', 'Budget'], ['fournisseurs', 'Fournisseurs'], ['parc-immobilier', 'Parc immobilier']] as [FinView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, background: v === view ? '#fff' : 'transparent', border: 'none', color: v === view ? C.fg : C.muted, fontSize: 12, fontWeight: v === view ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'factures' && <FacturesView />}
      {view === 'budget' && <BudgetM14View />}
      {view === 'fournisseurs' && <FournisseursView />}
      {view === 'parc-immobilier' && <ParcImmobilierView />}
    </Shell>
  )
}

// ─── Vue Factures ────────────────────────────────────────────────────

function FacturesView() {
  const { factures, hydrated, submitFacture, validateFacture, rejectFacture, reopenFacture, deleteFacture } = useFactures()
  const { fournisseurs } = useFournisseurs()
  const { postes } = useBudget()
  const { generateEngagementFromFacture, deleteEcrituresByFacture } = useEcritures()
  const { people } = useTeam()

  // Wraps : valider une facture déclenche aussi l'écriture d'engagement.
  const handleValidate = (factureId: string) => {
    validateFacture(factureId, CURRENT_USER_ID)
    const f = factures.find(x => x.id === factureId)
    if (f) generateEngagementFromFacture(f, CURRENT_USER_ID)
  }
  // Réouvrir / supprimer : on retire aussi les écritures liées
  const handleReopen = (factureId: string) => {
    reopenFacture(factureId)
    deleteEcrituresByFacture(factureId)
  }
  const handleDelete = (factureId: string) => {
    deleteFacture(factureId)
    deleteEcrituresByFacture(factureId)
  }

  const currentUser = people.find(p => p.id === CURRENT_USER_ID)
  const canValidate = currentUser ? hasPermission(currentUser.authLevel, 'finance.validate-invoices', currentUser.customPermissions) : false

  const [filter, setFilter] = useState<'toutes' | FactureStatut>('toutes')
  const [selectedId, setSelectedId] = useState<string | null>(factures[0]?.id ?? null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const filtered = useMemo(() => {
    return factures.filter(f => filter === 'toutes' || f.statut === filter)
  }, [factures, filter])

  const selected = factures.find(f => f.id === selectedId) ?? null

  // KPIs calculés à partir des vraies factures
  const kpis = useMemo(() => {
    const enAttente = factures.filter(f => f.statut === 'En attente validation')
    const validees = factures.filter(f => f.statut === 'Validée')
    const rejetees = factures.filter(f => f.statut === 'Rejetée')
    const totalAttente = enAttente.reduce((acc, f) => acc + f.montantTTC, 0)
    const totalValidees = validees.reduce((acc, f) => acc + f.montantTTC, 0)
    return {
      enAttenteCount: enAttente.length,
      enAttenteMontant: totalAttente,
      valideesCount: validees.length,
      valideesMontant: totalValidees,
      rejeteesCount: rejetees.length,
      total: totalValidees,
    }
  }, [factures])

  const counts = {
    toutes: factures.length,
    'À soumettre': factures.filter(f => f.statut === 'À soumettre').length,
    'En attente validation': factures.filter(f => f.statut === 'En attente validation').length,
    'Validée': factures.filter(f => f.statut === 'Validée').length,
    'Rejetée': factures.filter(f => f.statut === 'Rejetée').length,
  }

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="En attente validation" value={String(kpis.enAttenteCount)} sub={`${fmtMontant(kpis.enAttenteMontant)} à valider`} color={C.warning} />
        <KpiCard label="Validées ce mois" value={String(kpis.valideesCount)} sub={`${fmtMontant(kpis.valideesMontant)} imputés`} color={C.success} />
        <KpiCard label="Rejetées" value={String(kpis.rejeteesCount)} sub={kpis.rejeteesCount > 0 ? 'commentaire requis' : '—'} color={C.danger} />
        <KpiCard label="Total dépensé / mois" value={fmtMontant(kpis.total)} sub="sur factures imputées" color={C.slate} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <div style={{ flex: 3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {([
              ['toutes', `Toutes (${counts.toutes})`],
              ['En attente validation', `En attente (${counts['En attente validation']})`],
              ['Validée', `Validées (${counts['Validée']})`],
              ['Rejetée', `Rejetées (${counts['Rejetée']})`],
            ] as [typeof filter, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 20, background: v === filter ? C.green : '#fff', border: `1px solid ${v === filter ? C.green : C.border}`, color: v === filter ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filter ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="sm" onClick={() => setShowSubmitForm(s => !s)}>
              {showSubmitForm ? 'Annuler' : '+ Soumettre une facture'}
            </Button>
          </div>

          {showSubmitForm && (
            <SubmitFactureForm
              fournisseurs={fournisseurs}
              postes={postes}
              onSubmit={(data) => {
                const created = submitFacture(data)
                if (created) {
                  setSelectedId(created.id)
                  setFilter('En attente validation')
                }
                setShowSubmitForm(false)
              }}
              onCancel={() => setShowSubmitForm(false)}
            />
          )}

          {filtered.length === 0 ? (
            <Card padding={24} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.subtle }}>Aucune facture à afficher pour ce filtre.</p>
            </Card>
          ) : (
            <Card padding={0}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1.4fr 90px 1.6fr 70px 90px 80px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
                {['N°', 'Fournisseur', 'Montant', 'Poste comptable', 'Date', 'Statut', 'Action'].map(h => (
                  <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 0 }}>{h}</p>
                ))}
              </div>
              {filtered.map((f, i) => {
                const fournisseur = fournisseurs.find(x => x.id === f.fournisseurId)
                const poste = postes.find(p => p.code === f.posteCode)
                const isSelected = selectedId === f.id
                return (
                  <div key={f.id} onClick={() => setSelectedId(f.id)} style={{ display: 'grid', gridTemplateColumns: '110px 1.4fr 90px 1.6fr 70px 90px 80px', gap: 10, padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: isSelected ? `${C.green}06` : (f.statut === 'En attente validation' ? `${C.warning}06` : '#fff'), alignItems: 'center', cursor: 'pointer' }}>
                    <p style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.numero}</p>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fournisseur?.nom ?? '—'}</p>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, minWidth: 0 }}>{fmtMontant(f.montantTTC)}</p>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <Tag label={poste ? `${poste.code} ${poste.label}` : f.posteCode} color={C.slate} truncate />
                    </div>
                    <p style={{ fontSize: 11, color: C.subtle, minWidth: 0 }}>{fmtDateShort(f.dateFacture)}</p>
                    <div style={{ minWidth: 0 }}>
                      <Badge
                        label={statutShortLabel(f.statut)}
                        variant={statutBadgeVariant(f.statut)}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      {f.statut === 'En attente validation' && canValidate ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleValidate(f.id); setSelectedId(f.id) }}
                            style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.success}`, background: C.successLight, color: C.success, cursor: 'pointer', fontSize: 12 }}
                            title="Valider"
                          >✓</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedId(f.id) }}
                            style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 12 }}
                            title="Voir / rejeter"
                          >✕</button>
                        </div>
                      ) : (
                        <Button size="sm">Voir</Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </div>

        {/* Panneau détail */}
        <Card style={{ flex: 1.8 }} padding={14}>
          {selected ? (
            <FactureDetailPanel
              facture={selected}
              fournisseurs={fournisseurs}
              postes={postes}
              canValidate={canValidate}
              onValidate={() => handleValidate(selected.id)}
              onReject={(reason) => rejectFacture(selected.id, CURRENT_USER_ID, reason)}
              onReopen={() => handleReopen(selected.id)}
              onDelete={() => { handleDelete(selected.id); setSelectedId(null) }}
            />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: C.subtle, fontSize: 12 }}>
              Sélectionnez une facture pour voir le détail
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── Sous-composant : formulaire de soumission ───────────────────────

function SubmitFactureForm({
  fournisseurs, postes, onSubmit, onCancel,
}: {
  fournisseurs: Fournisseur[]
  postes: PosteBudget[]
  onSubmit: (data: {
    fournisseurId: string; montantTTC: number; posteCode: string;
    dateFacture: string; dateEcheance?: string; submittedById: string;
    notes?: string; documents?: TaskDocument[];
  }) => void
  onCancel: () => void
}) {
  const { people } = useTeam()
  const [fournisseurId, setFournisseurId] = useState('')
  const [montant, setMontant] = useState('')
  const [posteCode, setPosteCode] = useState('')
  const [dateFacture, setDateFacture] = useState(new Date().toISOString().slice(0, 10))
  const [dateEcheance, setDateEcheance] = useState('')
  const [submittedById, setSubmittedById] = useState(CURRENT_USER_ID)
  const [notes, setNotes] = useState('')
  const [documents, setDocuments] = useState<TaskDocument[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pré-remplir le poste comptable depuis le fournisseur sélectionné
  const handleFournisseurChange = (id: string) => {
    setFournisseurId(id)
    const f = fournisseurs.find(x => x.id === id)
    if (f?.posteParDefaut && !posteCode) setPosteCode(f.posteParDefaut)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setFileError(null)
    const currentTotal = documents.reduce((s, d) => s + d.size, 0)
    let total = currentTotal
    const newDocs: TaskDocument[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" dépasse 1 Mo (limite localStorage).`)
        continue
      }
      if (total + file.size > MAX_TOTAL_SIZE) {
        setFileError(`Total des pièces jointes > 4 Mo. Retirez-en avant d'en ajouter.`)
        break
      }
      try {
        const dataUrl = await readFileAsDataURL(file)
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        })
        total += file.size
      } catch {
        setFileError(`Impossible de lire "${file.name}".`)
      }
    }
    if (newDocs.length > 0) setDocuments(prev => [...prev, ...newDocs])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const valid = fournisseurId && montant && parseFloat(montant) > 0 && posteCode && dateFacture && submittedById

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title="Soumettre une nouvelle facture" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Fournisseur *">
          <select value={fournisseurId} onChange={e => handleFournisseurChange(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionner —</option>
            {fournisseurs.filter(f => f.active).map(f => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </Field>
        <Field label="Montant TTC (€) *">
          <input type="number" step="0.01" min="0" value={montant} onChange={e => setMontant(e.target.value)} placeholder="ex: 1240.00" style={inputStyle} />
        </Field>
        <Field label="Poste comptable *">
          <select value={posteCode} onChange={e => setPosteCode(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionner —</option>
            {postes.map(p => (
              <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Date de facture *">
          <input type="date" value={dateFacture} onChange={e => setDateFacture(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date d'échéance">
          <input type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Soumis par *">
          <select value={submittedById} onChange={e => setSubmittedById(e.target.value)} style={inputStyle}>
            {people.filter(p => p.active).map(p => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes / commentaires (facultatif)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Référence interne, commande, contexte…" rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 6 }}>Pièces justificatives (PDF, photos…)</p>
        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 6, padding: 10, background: '#fff' }}>
          {documents.length === 0 && (
            <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
              Aucune pièce — joignez la facture PDF, devis, bon de livraison… (max 1 Mo / fichier, 4 Mo total).
            </p>
          )}
          {documents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px' }}>
                  <span style={{ fontSize: 16 }}>📎</span>
                  <a href={doc.dataUrl} download={doc.name} style={{ flex: 1, fontSize: 12, color: C.fg, textDecoration: 'none', fontWeight: 500 }}>{doc.name}</a>
                  <span style={{ fontSize: 10, color: C.subtle }}>{formatBytes(doc.size)}</span>
                  <button type="button" onClick={() => removeDoc(doc.id)} aria-label="Retirer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 14, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>+ Ajouter une pièce jointe</Button>
        </div>
        {fileError && (
          <p style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>{fileError}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            fournisseurId,
            montantTTC: parseFloat(montant),
            posteCode,
            dateFacture,
            dateEcheance: dateEcheance || undefined,
            submittedById,
            notes: notes.trim() || undefined,
            documents: documents.length > 0 ? documents : undefined,
          })}
        >
          Soumettre la facture
        </Button>
      </div>
    </Card>
  )
}

// ─── Sous-composant : panneau détail d'une facture ───────────────────

function FactureDetailPanel({
  facture, fournisseurs, postes, canValidate,
  onValidate, onReject, onReopen, onDelete,
}: {
  facture: Facture
  fournisseurs: Fournisseur[]
  postes: PosteBudget[]
  canValidate: boolean
  onValidate: () => void
  onReject: (reason: string) => void
  onReopen: () => void
  onDelete: () => void
}) {
  const { people } = useTeam()
  const [comment, setComment] = useState('')
  const fournisseur = fournisseurs.find(f => f.id === facture.fournisseurId)
  const poste = postes.find(p => p.code === facture.posteCode)
  const submitter = people.find(p => p.id === facture.submittedById)
  const validator = facture.validatedById ? people.find(p => p.id === facture.validatedById) : null
  const rejector = facture.rejectedById ? people.find(p => p.id === facture.rejectedById) : null

  const handleReject = () => {
    const reason = comment.trim()
    if (!reason) {
      alert('Le motif du rejet est obligatoire.')
      return
    }
    onReject(reason)
    setComment('')
  }

  const lines: [string, string][] = [
    ['Fournisseur', fournisseur?.nom ?? '—'],
    ['Montant TTC', fmtMontantDecimal(facture.montantTTC)],
    ['Poste', poste ? `${poste.code} — ${poste.label}` : facture.posteCode],
    ['Date facture', new Date(facture.dateFacture).toLocaleDateString('fr-FR')],
  ]
  if (facture.dateEcheance) lines.push(['Échéance', new Date(facture.dateEcheance).toLocaleDateString('fr-FR')])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 2 }}>{facture.numero}</p>
          <p style={{ fontSize: 11, color: C.subtle }}>{fournisseur?.nom ?? '—'}</p>
        </div>
        <Badge label={statutShortLabel(facture.statut)} variant={statutBadgeVariant(facture.statut)} />
      </div>
      <Separator my={12} />

      {lines.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < lines.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <p style={{ fontSize: 10, color: C.subtle, width: 90, flexShrink: 0 }}>{k}</p>
          <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
        </div>
      ))}

      <Separator my={12} />

      {/* Soumission */}
      {submitter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Avatar initials={submitter.initials} size={20} color={submitter.color} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>Soumis par {submitter.fullName}</p>
            <p style={{ fontSize: 9, color: C.subtle }}>{fmtDateTime(facture.submittedAt)}</p>
          </div>
        </div>
      )}

      {/* Décision : validée */}
      {validator && facture.validatedAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: 8, background: C.successLight, borderRadius: 6 }}>
          <Avatar initials={validator.initials} size={20} color={validator.color} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>Validée par {validator.fullName}</p>
            <p style={{ fontSize: 9, color: C.muted }}>{fmtDateTime(facture.validatedAt)} — imputée sur le poste {facture.posteCode}</p>
          </div>
        </div>
      )}

      {/* Décision : rejetée */}
      {rejector && facture.rejectedAt && (
        <div style={{ marginBottom: 8, padding: 8, background: C.dangerLight, borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Avatar initials={rejector.initials} size={20} color={rejector.color} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: C.danger, fontWeight: 600 }}>Rejetée par {rejector.fullName}</p>
              <p style={{ fontSize: 9, color: C.muted }}>{fmtDateTime(facture.rejectedAt)}</p>
            </div>
          </div>
          {facture.rejectionReason && (
            <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic', paddingLeft: 26 }}>« {facture.rejectionReason} »</p>
          )}
        </div>
      )}

      {/* Notes / commentaires saisis à la soumission */}
      {facture.notes && (
        <div style={{ padding: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 10 }}>
          <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Commentaire</p>
          <p style={{ fontSize: 11, color: C.fg, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{facture.notes}</p>
        </div>
      )}

      {/* Pièces jointes */}
      {facture.documents && facture.documents.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pièces jointes ({facture.documents.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {facture.documents.map(doc => (
              <a
                key={doc.id}
                href={doc.dataUrl}
                download={doc.name}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, textDecoration: 'none', color: C.fg, fontSize: 11 }}
              >
                <span style={{ fontSize: 14 }}>📎</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{doc.name}</span>
                <span style={{ fontSize: 9, color: C.subtle }}>{formatBytes(doc.size)}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ height: 56, background: C.ph, borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: C.subtle }}>Aucune pièce jointe</span>
        </div>
      )}

      {/* Actions selon statut + permissions */}
      {facture.statut === 'En attente validation' && canValidate && (
        <>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Commentaire (obligatoire si rejet)</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Motif du rejet…"
            style={{ width: '100%', height: 56, border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, fontSize: 12, resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: C.fg, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onValidate}>Valider</Button>
            <Button variant="danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReject}>Rejeter</Button>
          </div>
        </>
      )}

      {facture.statut === 'En attente validation' && !canValidate && (
        <p style={{ fontSize: 11, color: C.subtle, padding: '8px 0', fontStyle: 'italic' }}>
          Vous n&apos;avez pas la permission de valider cette facture.
        </p>
      )}

      {(facture.statut === 'Validée' || facture.statut === 'Rejetée') && canValidate && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <Button style={{ flex: 1, justifyContent: 'center' }} onClick={onReopen}>↺ Rouvrir</Button>
          <Button variant="danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { if (confirm('Supprimer définitivement cette facture ?')) onDelete() }}>Supprimer</Button>
        </div>
      )}
    </>
  )
}


// ─── Vue Fournisseurs ────────────────────────────────────────────────

function FournisseursView() {
  const { fournisseurs, hydrated, createFournisseur, updateFournisseur, deleteFournisseur } = useFournisseurs()
  const { factures } = useFactures()
  const { postes } = useBudget()

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(fournisseurs[0]?.id ?? null)
  const [showNewForm, setShowNewForm] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return fournisseurs
    return fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(q) ||
      f.categorie.toLowerCase().includes(q) ||
      (f.siret ?? '').includes(q),
    )
  }, [fournisseurs, search])

  // Calculs sur le fournisseur sélectionné
  const selected = fournisseurs.find(f => f.id === selectedId) ?? null
  const stats = useMemo(() => {
    if (!selected) return null
    const ours = factures.filter(f => f.fournisseurId === selected.id)
    const total = ours.filter(f => f.statut === 'Validée').reduce((acc, f) => acc + f.montantTTC, 0)
    const enAttente = ours.filter(f => f.statut === 'En attente validation').reduce((acc, f) => acc + f.montantTTC, 0)
    const sorted = [...ours].sort((a, b) => b.dateFacture.localeCompare(a.dateFacture))
    return {
      ours: sorted,
      total,
      enAttente,
      derniere: sorted[0] ?? null,
    }
  }, [selected, factures])

  // Total facturé par fournisseur (pour la liste latérale)
  const totalParFournisseur = useMemo(() => {
    const map = new Map<string, number>()
    factures.forEach(f => {
      if (f.statut !== 'Rejetée') {
        map.set(f.fournisseurId, (map.get(f.fournisseurId) ?? 0) + f.montantTTC)
      }
    })
    return map
  }, [factures])

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 160px)' }}>
      {/* Liste fournisseurs */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur…"
          style={{ width: '100%', height: 34, border: `1px solid ${C.border}`, borderRadius: 20, background: '#fff', padding: '0 14px', fontSize: 11, color: C.fg, marginBottom: 8, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
        />
        <Button size="sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => setShowNewForm(true)}>
          + Nouveau fournisseur
        </Button>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 11, color: C.subtle, padding: 12, fontStyle: 'italic' }}>Aucun résultat</p>
          )}
          {filtered.map(s => {
            const isSel = selectedId === s.id
            const total = totalParFournisseur.get(s.id) ?? 0
            return (
              <div key={s.id} onClick={() => setSelectedId(s.id)} style={{ padding: '9px 10px', borderRadius: 6, cursor: 'pointer', background: isSel ? 'var(--accent-light)' : 'transparent', border: `1px solid ${isSel ? 'var(--accent)' : C.border}`, marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: isSel ? 'var(--accent)' : C.fg, fontWeight: isSel ? 600 : 400 }}>
                  {s.nom} {!s.active && <span style={{ fontSize: 9, color: C.subtle }}>(inactif)</span>}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <Tag label={s.categorie} color={isSel ? C.green : C.slate} />
                  <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600 }}>{fmtMontant(total)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Détail fournisseur */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)', overflow: 'auto' }}>
        {showNewForm && (
          <NewFournisseurForm
            postes={postes}
            onCreate={(data) => {
              const f = createFournisseur(data)
              setSelectedId(f.id)
              setShowNewForm(false)
            }}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {selected && stats && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={selected.nom.slice(0, 3).toUpperCase()} size={36} color={C.warning} />
                <div>
                  <p style={{ fontSize: 17, color: C.fg, fontWeight: 700 }}>{selected.nom}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>
                    {selected.categorie}
                    {selected.posteParDefaut && ` — Poste ${selected.posteParDefaut}`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="sm" onClick={() => updateFournisseur(selected.id, { active: !selected.active })}>
                  {selected.active ? 'Désactiver' : 'Réactiver'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (stats.ours.length > 0) {
                      alert(`Impossible : ${stats.ours.length} facture(s) liée(s).`)
                      return
                    }
                    if (confirm(`Supprimer le fournisseur ${selected.nom} ?`)) {
                      deleteFournisseur(selected.id)
                      setSelectedId(null)
                    }
                  }}
                >Supprimer</Button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--gap)' }}>
              <KpiCard label="Total facturé 2026" value={fmtMontant(stats.total)} />
              <KpiCard label="En attente" value={fmtMontant(stats.enAttente)} color={C.warning} />
              <KpiCard label="Dernière facture" value={stats.derniere ? fmtDateShort(stats.derniere.dateFacture) : '—'} color={C.slate} />
            </div>

            <Card padding={14}>
              <SectionHeader title={`Historique des factures (${stats.ours.length})`} />
              {stats.ours.length === 0 ? (
                <p style={{ fontSize: 12, color: C.subtle, padding: 12, textAlign: 'center', fontStyle: 'italic' }}>
                  Aucune facture pour ce fournisseur
                </p>
              ) : stats.ours.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < stats.ours.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <p style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{f.numero}</p>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{fmtMontant(f.montantTTC)}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>{fmtDateShort(f.dateFacture)}</p>
                  <Badge label={statutShortLabel(f.statut)} variant={statutBadgeVariant(f.statut)} />
                </div>
              ))}
            </Card>

            <Card padding={14}>
              <SectionHeader title="Coordonnées & infos contrat" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['SIRET', selected.siret ?? '—'],
                  ['N° client', selected.numClient ?? '—'],
                  ['Email', selected.email ?? '—'],
                  ['Délai paiement', selected.delaiPaiement ? `${selected.delaiPaiement} jours` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: '6px 8px', background: 'var(--page-bg)', borderRadius: 6 }}>
                    <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>{k}</p>
                    <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {!selected && !showNewForm && (
          <div style={{ padding: 32, textAlign: 'center', color: C.subtle, fontSize: 12 }}>
            Sélectionnez un fournisseur pour voir ses informations
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sous-composant : nouveau fournisseur ────────────────────────────

function NewFournisseurForm({
  postes, onCreate, onCancel,
}: {
  postes: PosteBudget[]
  onCreate: (data: Omit<Fournisseur, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState('')
  const [siret, setSiret] = useState('')
  const [email, setEmail] = useState('')
  const [posteParDefaut, setPosteParDefaut] = useState('')
  const [delaiPaiement, setDelaiPaiement] = useState('30')

  const valid = nom.trim() && categorie.trim()

  return (
    <Card padding={14} style={{ background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title="Nouveau fournisseur" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Nom *">
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Catégorie *">
          <input type="text" value={categorie} onChange={e => setCategorie(e.target.value)} placeholder="Énergie, Voirie…" style={inputStyle} />
        </Field>
        <Field label="SIRET">
          <input type="text" value={siret} onChange={e => setSiret(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Poste comptable par défaut">
          <select value={posteParDefaut} onChange={e => setPosteParDefaut(e.target.value)} style={inputStyle}>
            <option value="">Aucun</option>
            {postes.map(p => (
              <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Délai paiement (jours)">
          <input type="number" min="0" value={delaiPaiement} onChange={e => setDelaiPaiement(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onCreate({
            nom: nom.trim(),
            categorie: categorie.trim(),
            siret: siret.trim() || undefined,
            email: email.trim() || undefined,
            posteParDefaut: posteParDefaut || undefined,
            delaiPaiement: parseInt(delaiPaiement, 10) || undefined,
            active: true,
          })}
        >
          Créer le fournisseur
        </Button>
      </div>
    </Card>
  )
}

// ─── Helpers UI ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 32,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  background: '#fff',
  padding: '0 10px',
  fontSize: 12,
  color: C.fg,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
}

function statutShortLabel(s: FactureStatut): string {
  switch (s) {
    case 'En attente validation': return 'En attente'
    case 'Validée': return 'Validée'
    case 'Rejetée': return 'Rejetée'
    case 'À soumettre': return 'Brouillon'
  }
}

function statutBadgeVariant(s: FactureStatut): 'warning' | 'success' | 'danger' | 'default' {
  switch (s) {
    case 'En attente validation': return 'warning'
    case 'Validée': return 'success'
    case 'Rejetée': return 'danger'
    case 'À soumettre': return 'default'
  }
}

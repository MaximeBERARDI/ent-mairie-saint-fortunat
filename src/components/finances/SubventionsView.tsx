'use client'

import { useState, useMemo, useRef } from 'react'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { DataList } from '@/components/ui/DataList'
import { useSubventions } from '@/hooks/useSubventions'
import { useEcritures } from '@/hooks/useEcritures'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { DemandeSubvention, SourceSubvention, StatutSubvention, TaskDocument } from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtPct = (n: number, d: number) => d > 0 ? `${Math.round((n / d) * 100)}%` : '—'

const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
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

const SOURCE_OPTIONS: SourceSubvention[] = [
  'État (DETR)', 'État (DSIL)', 'État (FNADT)', 'État (autre)',
  'Région', 'Département',
  'GFP / Intercommunalité',
  'Europe (FEDER)', 'Europe (LEADER)',
  'Autre organisme',
]

const STATUT_OPTIONS: StatutSubvention[] = [
  'Préparation', 'Déposée', 'Instruction',
  'Accordée', 'Versement partiel', 'Versée',
  'Refusée', 'Annulée',
]

function statutVariant(s: StatutSubvention): 'warning' | 'success' | 'danger' | 'default' | 'terra' | 'info' | 'primary' {
  switch (s) {
    case 'Versée': return 'success'
    case 'Accordée': return 'primary'
    case 'Versement partiel': return 'info'
    case 'Instruction': return 'warning'
    case 'Déposée': return 'terra'
    case 'Refusée': return 'danger'
    case 'Annulée': return 'default'
    case 'Préparation': return 'default'
  }
}

function sourceColor(s: SourceSubvention): string {
  if (s.startsWith('État')) return C.info
  if (s === 'Région') return C.terra
  if (s === 'Département') return C.warning
  if (s.startsWith('Europe')) return C.success
  if (s === 'GFP / Intercommunalité') return C.slate
  return C.muted
}

const MAX_FILE_SIZE = 1024 * 1024
const MAX_TOTAL_SIZE = 4 * 1024 * 1024

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

const fmtBytes = (b: number) =>
  b < 1024 ? `${b} o` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`

export function SubventionsView() {
  const { subventions, hydrated, createSubvention, updateSubvention, deleteSubvention } = useSubventions()
  const { generateVersementSubvention, deleteEcrituresBySubvention } = useEcritures()
  const { currentUserId } = useCurrentUser()

  // Wraps : enregistrer un versement déclenche automatiquement
  // une écriture comptable D 515 / C [imputationCompte] et passe le
  // statut en "Versement partiel" ou "Versée" selon le cumul.
  const handleEnregistrerVersement = (s: DemandeSubvention, montantVersement: number) => {
    if (!s.imputationCompte) {
      alert('Cette subvention n\'a pas d\'imputation comptable. Renseignez-la avant d\'enregistrer le versement.')
      return
    }
    const cumul = (s.montantVerse ?? 0) + montantVersement
    const accordeNum = s.montantAccorde ?? 0
    const newStatut: StatutSubvention = cumul >= accordeNum - 0.01 ? 'Versée' : 'Versement partiel'
    updateSubvention(s.id, { montantVerse: cumul, statut: newStatut })
    generateVersementSubvention({
      subventionId: s.id,
      reference: s.reference,
      intitule: s.intitule,
      montantVersement,
      imputationCompte: s.imputationCompte,
      createdBy: currentUserId,
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleDeleteSubvention = (id: string) => {
    deleteSubvention(id)
    deleteEcrituresBySubvention(id)
  }
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DemandeSubvention | null>(null)
  const [filterStatut, setFilterStatut] = useState<StatutSubvention | 'tous' | 'en-cours'>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const enCours: StatutSubvention[] = ['Préparation', 'Déposée', 'Instruction', 'Accordée', 'Versement partiel']

  const filtered = useMemo(() => {
    return subventions
      .filter(s => {
        if (filterStatut === 'tous') return true
        if (filterStatut === 'en-cours') return enCours.includes(s.statut)
        return s.statut === filterStatut
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subventions, filterStatut])

  const selected = subventions.find(s => s.id === selectedId) ?? null

  // KPI
  const kpis = useMemo(() => {
    const enInstruction = subventions.filter(s => ['Déposée', 'Instruction'].includes(s.statut))
    const totalDemande = enInstruction.reduce((acc, s) => acc + s.montantDemande, 0)
    const accordees = subventions.filter(s => ['Accordée', 'Versement partiel'].includes(s.statut))
    const totalAccorde = accordees.reduce((acc, s) => acc + (s.montantAccorde ?? 0), 0)
    const totalVerse = subventions.reduce((acc, s) => acc + (s.montantVerse ?? 0), 0)
    const totalSollicite = subventions.reduce((acc, s) => acc + s.montantDemande, 0)
    const totalRefuse = subventions.filter(s => s.statut === 'Refusée').reduce((acc, s) => acc + s.montantDemande, 0)

    return {
      enCoursCount: enCours.filter(st => subventions.some(s => s.statut === st)).length,
      enInstructionCount: enInstruction.length,
      totalDemande,
      accordeesCount: accordees.length,
      totalAccorde,
      totalVerse,
      totalSollicite,
      totalRefuse,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subventions])

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard
          label="En instruction"
          value={String(kpis.enInstructionCount)}
          sub={`${fmtMontant(kpis.totalDemande)} sollicités`}
          color={C.warning}
        />
        <KpiCard
          label="Accordées"
          value={String(kpis.accordeesCount)}
          sub={`${fmtMontant(kpis.totalAccorde)} obtenus`}
          color={C.success}
        />
        <KpiCard
          label="Versées (cumul)"
          value={fmtMontant(kpis.totalVerse)}
          sub="reçues sur compte"
          color={C.green}
        />
        <KpiCard
          label="Total sollicité"
          value={fmtMontant(kpis.totalSollicite)}
          sub="toutes demandes confondues"
          color={C.slate}
        />
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          ['tous', `Toutes (${subventions.length})`],
          ['en-cours', `En cours (${subventions.filter(s => enCours.includes(s.statut)).length})`],
          ['Accordée', 'Accordées'],
          ['Versée', 'Versées'],
          ['Refusée', 'Refusées'],
        ] as [typeof filterStatut, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilterStatut(v)}
            style={{ padding: '5px 12px', borderRadius: 20, background: v === filterStatut ? C.green : '#fff', border: `1px solid ${v === filterStatut ? C.green : C.border}`, color: v === filterStatut ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filterStatut ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouvelle demande
        </Button>
      </div>

      {showForm && (
        <SubventionForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) updateSubvention(editing.id, data)
            else createSubvention(data)
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        {/* Liste */}
        <div style={{ flex: selected ? 2 : 3 }}>
          <DataList
            rows={filtered}
            rowKey={(s) => s.id}
            onRowClick={(s) => setSelectedId(s.id)}
            isSelected={(s) => selectedId === s.id}
            emptyMessage="Aucune demande dans cette catégorie."
            columns={[
              {
                key: 'reference',
                label: 'Réf.',
                width: '120px',
                primaryOnMobile: true,
                render: (s) => <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle, fontSize: 12 }}>{s.reference}</span>,
              },
              {
                key: 'intitule',
                label: 'Intitulé',
                width: '1fr',
                secondaryOnMobile: true,
                render: (s) => (
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.intitule}</p>
                    <p style={{ fontSize: 10, color: C.subtle }}>{fmtDate(s.dateDepot)}</p>
                  </div>
                ),
              },
              {
                key: 'source',
                label: 'Source',
                width: '140px',
                hideOnMedium: true,
                render: (s) => (
                  <div style={{ minWidth: 0 }}>
                    <Tag label={s.source} color={sourceColor(s.source)} truncate />
                  </div>
                ),
              },
              {
                key: 'demande',
                label: 'Demandé',
                width: '110px',
                align: 'right',
                render: (s) => <span style={{ color: C.fg, fontWeight: 700 }}>{fmtMontant(s.montantDemande)}</span>,
              },
              {
                key: 'accorde',
                label: 'Accordé',
                width: '110px',
                align: 'right',
                render: (s) => (
                  <span style={{ color: s.montantAccorde ? C.success : C.subtle, fontWeight: 700 }}>
                    {s.montantAccorde ? fmtMontant(s.montantAccorde) : '—'}
                  </span>
                ),
              },
              {
                key: 'statut',
                label: 'Statut',
                width: '130px',
                render: (s) => <Badge label={s.statut} variant={statutVariant(s.statut)} />,
              },
              {
                key: 'action',
                label: 'Action',
                width: '80px',
                align: 'right',
                render: (s) => (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(s); setShowForm(true) }}
                      style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 12 }}
                    >✎</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer ${s.reference} ? Les écritures comptables liées seront aussi supprimées.`)) handleDeleteSubvention(s.id) }}
                      style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 12 }}
                    >×</button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Détail */}
        {selected && (
          <Card style={{ flex: 1.5 }} padding={16}>
            <SubventionDetail
              subvention={selected}
              onClose={() => setSelectedId(null)}
              onEdit={() => { setEditing(selected); setShowForm(true) }}
              onUpdate={(patch) => updateSubvention(selected.id, patch)}
              onEnregistrerVersement={(m) => handleEnregistrerVersement(selected, m)}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

function SubventionDetail({ subvention, onClose, onEdit, onUpdate, onEnregistrerVersement }: {
  subvention: DemandeSubvention
  onClose: () => void
  onEdit: () => void
  onUpdate: (patch: Partial<DemandeSubvention>) => void
  onEnregistrerVersement: (montant: number) => void
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
            {subvention.reference}
          </p>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 700, lineHeight: 1.3 }}>{subvention.intitule}</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 18, padding: 0 }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Badge label={subvention.statut} variant={statutVariant(subvention.statut)} />
        <Tag label={subvention.source} color={sourceColor(subvention.source)} />
      </div>

      {subvention.description && (
        <>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</p>
          <p style={{ fontSize: 12, color: C.fg, lineHeight: 1.5, marginBottom: 12 }}>{subvention.description}</p>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <Stat label="Coût total projet" value={fmtMontant(subvention.montantProjet)} />
        <Stat label="Subvention demandée" value={fmtMontant(subvention.montantDemande)} sub={fmtPct(subvention.montantDemande, subvention.montantProjet)} />
        {subvention.montantAccorde != null && (
          <Stat label="Accordé" value={fmtMontant(subvention.montantAccorde)} color={C.success} sub={fmtPct(subvention.montantAccorde, subvention.montantProjet)} />
        )}
        {(subvention.montantVerse ?? 0) > 0 && (
          <Stat label="Versé à ce jour" value={fmtMontant(subvention.montantVerse!)} color={C.green} />
        )}
      </div>

      <Separator my={10} />

      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calendrier</p>
      <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.6, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: C.subtle }}>Date de dépôt</span><span>{fmtDate(subvention.dateDepot)}</span>
        </div>
        {subvention.dateDecision && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.subtle }}>Date de décision</span><span>{fmtDate(subvention.dateDecision)}</span>
          </div>
        )}
        {subvention.datePrevisionVersement && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.subtle }}>Versement prévu</span><span>{fmtDate(subvention.datePrevisionVersement)}</span>
          </div>
        )}
      </div>

      {(subvention.contactNom || subvention.contactEmail) && (
        <>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact</p>
          <div style={{ fontSize: 12, color: C.fg, marginBottom: 12 }}>
            {subvention.contactNom && <p>{subvention.contactNom}</p>}
            {subvention.contactEmail && <p style={{ color: C.subtle, fontSize: 11 }}>{subvention.contactEmail}</p>}
          </div>
        </>
      )}

      {subvention.imputationCompte && (
        <>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Imputation comptable</p>
          <Tag label={`Compte ${subvention.imputationCompte}`} color={C.slate} />
          <div style={{ marginBottom: 12 }} />
        </>
      )}

      {subvention.notes && (
        <>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</p>
          <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 12 }}>
            {subvention.notes}
          </p>
        </>
      )}

      {subvention.motifRefus && (
        <div style={{ padding: 10, background: C.dangerLight, borderRadius: 6, marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginBottom: 4 }}>Motif du refus</p>
          <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic' }}>« {subvention.motifRefus} »</p>
        </div>
      )}

      {/* Actions rapides : changement de statut */}
      <Separator my={10} />
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {subvention.statut === 'Préparation' && (
          <Button size="sm" onClick={() => onUpdate({ statut: 'Déposée', dateDepot: subvention.dateDepot ?? new Date().toISOString().slice(0, 10) })}>
            ✉ Marquer déposée
          </Button>
        )}
        {(subvention.statut === 'Déposée' || subvention.statut === 'Instruction') && (
          <>
            <Button size="sm" onClick={() => onUpdate({ statut: 'Instruction' })}>
              ⏳ En instruction
            </Button>
            <Button size="sm" variant="primary" onClick={() => {
              const m = prompt('Montant accordé (€) :', String(subvention.montantDemande))
              if (m) onUpdate({ statut: 'Accordée', montantAccorde: parseFloat(m), dateDecision: new Date().toISOString().slice(0, 10) })
            }}>
              ✓ Accordée
            </Button>
            <Button size="sm" variant="danger" onClick={() => {
              const motif = prompt('Motif du refus :')
              if (motif) onUpdate({ statut: 'Refusée', motifRefus: motif, dateDecision: new Date().toISOString().slice(0, 10) })
            }}>
              ✕ Refusée
            </Button>
          </>
        )}
        {(subvention.statut === 'Accordée' || subvention.statut === 'Versement partiel') && (
          <>
            <Button size="sm" variant="primary" onClick={() => {
              const m = prompt(
                'Montant du versement reçu (€) :',
                String((subvention.montantAccorde ?? 0) - (subvention.montantVerse ?? 0)),
              )
              if (!m) return
              const versement = parseFloat(m)
              if (Number.isNaN(versement) || versement <= 0) return
              onEnregistrerVersement(versement)
            }}>
              € Enregistrer un versement
            </Button>
          </>
        )}
        <Button size="sm" onClick={onEdit}>✎ Modifier</Button>
      </div>
    </>
  )
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: 8, background: C.bg, borderRadius: 6 }}>
      <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 14, color: color ?? C.fg, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: C.subtle, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ─── Formulaire de création / édition ────────────────────────────────

function SubventionForm({ initial, onSubmit, onCancel }: {
  initial: DemandeSubvention | null
  onSubmit: (data: Omit<DemandeSubvention, 'id' | 'createdAt' | 'updatedAt' | 'reference'>) => void
  onCancel: () => void
}) {
  const [intitule, setIntitule] = useState(initial?.intitule ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [source, setSource] = useState<SourceSubvention>(initial?.source ?? 'État (DETR)')
  const [organisme, setOrganisme] = useState(initial?.organisme ?? '')
  const [contactNom, setContactNom] = useState(initial?.contactNom ?? '')
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? '')
  const [montantProjet, setMontantProjet] = useState(String(initial?.montantProjet ?? ''))
  const [montantDemande, setMontantDemande] = useState(String(initial?.montantDemande ?? ''))
  const [montantAccorde, setMontantAccorde] = useState(String(initial?.montantAccorde ?? ''))
  const [montantVerse, setMontantVerse] = useState(String(initial?.montantVerse ?? ''))
  const [dateDepot, setDateDepot] = useState(initial?.dateDepot ?? '')
  const [dateDecision, setDateDecision] = useState(initial?.dateDecision ?? '')
  const [datePrevisionVersement, setDatePrevisionVersement] = useState(initial?.datePrevisionVersement ?? '')
  const [statut, setStatut] = useState<StatutSubvention>(initial?.statut ?? 'Préparation')
  const [imputationCompte, setImputationCompte] = useState(initial?.imputationCompte ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [motifRefus, setMotifRefus] = useState(initial?.motifRefus ?? '')
  const [documents, setDocuments] = useState<TaskDocument[]>(initial?.documents ?? [])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const num = (s: string) => Number.isNaN(parseFloat(s)) ? 0 : parseFloat(s)
  const valid = intitule.trim() && organisme.trim() && num(montantProjet) > 0 && num(montantDemande) > 0

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setFileError(null)
    const currentTotal = documents.reduce((s, d) => s + d.size, 0)
    let total = currentTotal
    const newDocs: TaskDocument[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" dépasse 1 Mo.`)
        continue
      }
      if (total + file.size > MAX_TOTAL_SIZE) {
        setFileError('Total > 4 Mo.')
        break
      }
      try {
        const dataUrl = await readFileAsDataURL(file)
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? `Modifier ${initial.reference}` : 'Nouvelle demande de subvention'} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Intitulé du projet *">
          <input type="text" value={intitule} onChange={e => setIntitule(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Statut">
          <select value={statut} onChange={e => setStatut(e.target.value as StatutSubvention)} style={inputStyle}>
            {STATUT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Financeur</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Source *">
          <select value={source} onChange={e => setSource(e.target.value as SourceSubvention)} style={inputStyle}>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Organisme *">
          <input type="text" value={organisme} onChange={e => setOrganisme(e.target.value)} placeholder="ex: Préfecture de l'Ardèche" style={inputStyle} />
        </Field>
        <Field label="Contact (nom)">
          <input type="text" value={contactNom} onChange={e => setContactNom(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Contact (email)">
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginTop: 6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Montants (€)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <Field label="Coût total projet (HT) *">
          <input type="number" min="0" value={montantProjet} onChange={e => setMontantProjet(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Subvention demandée *">
          <input type="number" min="0" value={montantDemande} onChange={e => setMontantDemande(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Accordé (si décision)">
          <input type="number" min="0" value={montantAccorde} onChange={e => setMontantAccorde(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Cumul versé">
          <input type="number" min="0" value={montantVerse} onChange={e => setMontantVerse(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginTop: 6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calendrier</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Date de dépôt">
          <input type="date" value={dateDepot} onChange={e => setDateDepot(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date de décision">
          <input type="date" value={dateDecision} onChange={e => setDateDecision(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Versement prévu">
          <input type="date" value={datePrevisionVersement} onChange={e => setDatePrevisionVersement(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Imputation cpte M14">
          <input type="text" value={imputationCompte} onChange={e => setImputationCompte(e.target.value)} placeholder="ex: 1321" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
        </Field>
      </div>

      {statut === 'Refusée' && (
        <div style={{ marginBottom: 10 }}>
          <Field label="Motif du refus">
            <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
          </Field>
        </div>
      )}

      <Field label="Notes (suivi du dossier, relances…)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      {/* Documents */}
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 6 }}>Documents (dossier de demande, notification, conventions…)</p>
        <div style={{ border: `1px dashed ${C.border}`, borderRadius: 6, padding: 10, background: '#fff' }}>
          {documents.length === 0 && (
            <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
              Aucun document — joignez le dossier, la notification, le RIB, etc.
            </p>
          )}
          {documents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px' }}>
                  <span style={{ fontSize: 14 }}>📎</span>
                  <a href={doc.dataUrl} download={doc.name} style={{ flex: 1, fontSize: 11, color: C.fg, textDecoration: 'none', fontWeight: 500 }}>{doc.name}</a>
                  <span style={{ fontSize: 9, color: C.subtle }}>{fmtBytes(doc.size)}</span>
                  <button type="button" onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 14 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>+ Joindre un document</Button>
        </div>
        {fileError && <p style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>{fileError}</p>}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            intitule: intitule.trim(),
            description: description.trim() || undefined,
            source,
            organisme: organisme.trim(),
            contactNom: contactNom.trim() || undefined,
            contactEmail: contactEmail.trim() || undefined,
            montantProjet: num(montantProjet),
            montantDemande: num(montantDemande),
            montantAccorde: montantAccorde ? num(montantAccorde) : undefined,
            montantVerse: montantVerse ? num(montantVerse) : undefined,
            dateDepot: dateDepot || undefined,
            dateDecision: dateDecision || undefined,
            datePrevisionVersement: datePrevisionVersement || undefined,
            statut,
            motifRefus: motifRefus.trim() || undefined,
            imputationCompte: imputationCompte.trim() || undefined,
            notes: notes.trim() || undefined,
            documents,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer la demande'}
        </Button>
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

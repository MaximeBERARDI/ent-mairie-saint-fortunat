'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Step } from '@/components/ui/Step'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Row } from '@/components/ui/Row'
import { COLORS as C } from '@/lib/theme'
import { useCommissions } from '@/hooks/useCommissions'
import { useTeam } from '@/hooks/useTeam'
import { useTasks } from '@/hooks/useTasks'
import { useComptesRendus } from '@/hooks/useComptesRendus'
import type { ExtractedTask, CompteRendu, TaskPriority } from '@/lib/types'

type TabView = 'liste' | 'wizard'

interface WizardState {
  // Étape 0 : upload
  filename: string | null
  pdfBase64: string | null
  pdfDataUrl: string | null
  pdfSize: number
  commissionId: string
  meetingDate: string  // ISO YYYY-MM-DD ou ''

  // Étape 1 : extraction
  extracting: boolean
  extractError: string | null
  extractedTasks: ExtractedTask[]

  // Étape 2 : validation (modifications utilisateur par index)
  edits: Record<number, Partial<ExtractedTask>>
  rejected: Record<number, boolean>

  // Étape 3 : résultat
  createdTaskIds: string[]
  createdCR: CompteRendu | null
}

const INITIAL_WIZARD: WizardState = {
  filename: null,
  pdfBase64: null,
  pdfDataUrl: null,
  pdfSize: 0,
  commissionId: '',
  meetingDate: '',
  extracting: false,
  extractError: null,
  extractedTasks: [],
  edits: {},
  rejected: {},
  createdTaskIds: [],
  createdCR: null,
}

export default function CompteRendusPage() {
  const { commissions } = useCommissions()
  const [tab, setTab] = useState<TabView>('liste')
  const [wizardStep, setWizardStep] = useState<number>(0)
  const [wizard, setWizard] = useState<WizardState>(INITIAL_WIZARD)

  const updateWizard = useCallback((patch: Partial<WizardState>) => {
    setWizard(prev => ({ ...prev, ...patch }))
  }, [])

  const resetWizard = useCallback(() => {
    setWizard(INITIAL_WIZARD)
    setWizardStep(0)
  }, [])

  return (
    <Shell title="Comptes rendus">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['liste', 'Vue liste'], ['wizard', 'Nouveau CR']] as [TabView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '5px 12px', borderRadius: 6, background: v === tab ? '#fff' : 'transparent', border: 'none', color: v === tab ? C.fg : C.muted, fontSize: 12, fontWeight: v === tab ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: v === tab ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'liste' && (
          <>
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="sm" onClick={() => { resetWizard(); setTab('wizard') }}>+ Importer un CR</Button>
          </>
        )}
      </div>

      {tab === 'liste' && <ListeView />}
      {tab === 'wizard' && (
        <WizardView
          step={wizardStep}
          onStepChange={setWizardStep}
          wizard={wizard}
          updateWizard={updateWizard}
          resetWizard={resetWizard}
          onFinishedAllNew={() => setTab('liste')}
        />
      )}
    </Shell>
  )
}

// ─── Vue liste : CRs réels persistés en localStorage ─────────────────

function ListeView() {
  const { crs, hydrated, deleteCR } = useComptesRendus()
  const { tasks } = useTasks()
  const { commissions } = useCommissions()
  const [selected, setSelected] = useState<CompteRendu | null>(null)

  const selectedTasks = selected
    ? tasks.filter(t => selected.taskIds.includes(t.id))
    : []

  return (
    <div className="split" style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 180px)' }}>
      <Card style={{ flex: 2 }} padding={0}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, flex: 1 }}>
            {selected?.filename ?? 'Sélectionner un compte rendu'}
          </p>
          {selected && (
            <>
              <Badge label="PDF" />
              {selected.pdfDataUrl && (
                <a href={selected.pdfDataUrl} download={selected.filename}>
                  <Button size="sm">Télécharger</Button>
                </a>
              )}
              <Button size="sm" variant="danger" onClick={() => { deleteCR(selected.id); setSelected(null) }}>Supprimer</Button>
            </>
          )}
        </div>
        <div style={{ padding: 16, overflow: 'auto', height: 'calc(100% - 48px)' }}>
          {selected ? (
            selected.pdfDataUrl ? (
              <iframe
                src={selected.pdfDataUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={selected.filename}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: C.subtle, textAlign: 'center', padding: 24 }}>
                <span style={{ fontSize: 32 }}>📄</span>
                <p style={{ fontSize: 14 }}>PDF non sauvegardé (trop volumineux pour le stockage local)</p>
                <p style={{ fontSize: 12 }}>{selectedTasks.length} tâche{selectedTasks.length > 1 ? 's' : ''} créée{selectedTasks.length > 1 ? 's' : ''} à partir de ce CR</p>
              </div>
            )
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: C.subtle }}>
              <span style={{ fontSize: 32 }}>📄</span>
              <p style={{ fontSize: 14 }}>
                {hydrated && crs.length === 0
                  ? 'Aucun CR importé pour le moment — clique sur « Nouveau CR » pour commencer.'
                  : 'Cliquez sur un CR pour le visualiser'}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: `${C.green}08`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>IA</span>
            </div>
            <p style={{ fontSize: 14, color: C.fg, fontWeight: 700, flex: 1 }}>Comptes rendus traités</p>
            <Badge label={`${crs.length}`} variant="default" />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {!hydrated && <p style={{ padding: 16, fontSize: 12, color: C.subtle }}>Chargement…</p>}
            {hydrated && crs.length === 0 && (
              <p style={{ padding: 16, fontSize: 12, color: C.subtle }}>Aucun CR pour le moment.</p>
            )}
            {crs.map((cr, i) => {
              const commissionName = commissions.find(c => c.id === cr.commissionId)?.name ?? 'Sans commission'
              const dateLabel = cr.meetingDate
                ? new Date(cr.meetingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : new Date(cr.importedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              return (
                <div key={cr.id} onClick={() => setSelected(cr)} style={{ padding: '10px 14px', borderBottom: i < crs.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: selected?.id === cr.id ? `${C.green}06` : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{cr.filename}</p>
                    <Badge label="Validé" variant="success" />
                  </div>
                  <p style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>{commissionName} · {cr.taskIds.length} tâche{cr.taskIds.length > 1 ? 's' : ''} · {dateLabel}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Wizard ──────────────────────────────────────────────────────────

function WizardView({
  step, onStepChange, wizard, updateWizard, resetWizard, onFinishedAllNew,
}: {
  step: number
  onStepChange: (s: number) => void
  wizard: WizardState
  updateWizard: (patch: Partial<WizardState>) => void
  resetWizard: () => void
  onFinishedAllNew: () => void
}) {
  return (
    <div>
      <Step steps={['Upload', 'Extraction IA', 'Validation tâches', 'Notification']} current={step} />

      {step === 0 && (
        <UploadStep
          wizard={wizard}
          updateWizard={updateWizard}
          onNext={() => onStepChange(1)}
        />
      )}
      {step === 1 && (
        <ExtractionStep
          wizard={wizard}
          updateWizard={updateWizard}
          onNext={() => onStepChange(2)}
          onPrev={() => onStepChange(0)}
        />
      )}
      {step === 2 && (
        <ValidationStep
          wizard={wizard}
          updateWizard={updateWizard}
          onPrev={() => onStepChange(1)}
          onNext={() => onStepChange(3)}
        />
      )}
      {step === 3 && (
        <NotificationStep
          wizard={wizard}
          onNewCR={() => { resetWizard() }}
          onBackToList={() => { resetWizard(); onFinishedAllNew() }}
        />
      )}
    </div>
  )
}

// ─── Étape 0 : upload ────────────────────────────────────────────────

function UploadStep({
  wizard, updateWizard, onNext,
}: {
  wizard: WizardState
  updateWizard: (patch: Partial<WizardState>) => void
  onNext: () => void
}) {
  const { commissions } = useCommissions()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setReadError(null)
    if (file.type !== 'application/pdf') {
      setReadError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setReadError('Fichier trop volumineux (max 10 Mo).')
      return
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    // Conversion en base64 par chunks pour éviter le stack overflow sur les gros PDFs
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)))
    }
    const base64 = btoa(binary)
    const dataUrl = `data:application/pdf;base64,${base64}`

    updateWizard({
      filename: file.name,
      pdfBase64: base64,
      pdfDataUrl: dataUrl,
      pdfSize: file.size,
    })
  }, [updateWizard])

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }, [handleFile])

  const canProceed = !!wizard.pdfBase64

  return (
    <div className="split" style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 2 }} padding={16}>
        <SectionHeader title="Importer un compte rendu" />

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.green : wizard.pdfBase64 ? C.success : C.green}`,
            borderRadius: 10,
            padding: 32,
            textAlign: 'center',
            background: wizard.pdfBase64 ? C.successLight : C.greenLight,
            marginBottom: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>{wizard.pdfBase64 ? '✓' : '📁'}</div>
          {wizard.pdfBase64 ? (
            <>
              <p style={{ fontSize: 14, color: C.success, fontWeight: 600, marginBottom: 4 }}>{wizard.filename}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                {(wizard.pdfSize / 1024).toFixed(0)} Ko — Cliquez pour changer
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: C.green, fontWeight: 600, marginBottom: 6 }}>Glissez votre PDF ici</p>
              <p style={{ fontSize: 12, color: C.subtle, marginBottom: 14 }}>PDF uniquement — Max 10 Mo</p>
              <Button variant="primary" size="sm">Parcourir les fichiers</Button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        {readError && (
          <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}`, color: C.danger, padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
            {readError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={wizard.commissionId}
            onChange={e => updateWizard({ commissionId: e.target.value })}
            style={{ flex: 1, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', padding: '0 10px', fontSize: 12, color: wizard.commissionId ? C.fg : C.subtle, fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="">Affecter à une commission… (optionnel)</option>
            {commissions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={wizard.meetingDate}
            onChange={e => updateWizard({ meetingDate: e.target.value })}
            style={{ width: 170, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', padding: '0 10px', fontSize: 12, color: C.fg, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="primary" onClick={onNext} disabled={!canProceed}>
            Lancer l&apos;extraction →
          </Button>
        </div>
      </Card>

      <Card style={{ flex: 1 }} padding={14}>
        <SectionHeader title="Comment ça marche" />
        <ol style={{ paddingLeft: 18, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          <li>Importez le PDF du compte rendu</li>
          <li>L&apos;IA Claude analyse le document et identifie les actions à effectuer</li>
          <li>Vérifiez et ajustez les tâches proposées</li>
          <li>Les tâches sont créées et les responsables notifiés</li>
        </ol>
        <div style={{ marginTop: 12, padding: 10, background: C.bg, borderRadius: 6, fontSize: 12, color: C.subtle }}>
          🔒 Le PDF est traité côté serveur via l&apos;API Anthropic. Aucune donnée n&apos;est conservée par l&apos;IA après traitement.
        </div>
      </Card>
    </div>
  )
}

// ─── Étape 1 : extraction (vrai appel API) ───────────────────────────

function ExtractionStep({
  wizard, updateWizard, onNext, onPrev,
}: {
  wizard: WizardState
  updateWizard: (patch: Partial<WizardState>) => void
  onNext: () => void
  onPrev: () => void
}) {
  // Démarre l'extraction au montage si pas déjà faite
  const startedRef = useRef(false)

  const startExtraction = useCallback(async () => {
    if (!wizard.pdfBase64 || wizard.extracting) return
    updateWizard({ extracting: true, extractError: null, extractedTasks: [] })

    try {
      const res = await fetch('/api/cr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: wizard.pdfBase64,
          filename: wizard.filename,
          commissionId: wizard.commissionId || undefined,
          meetingDate: wizard.meetingDate || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        updateWizard({ extracting: false, extractError: data.error || 'Erreur inconnue' })
        return
      }

      updateWizard({
        extracting: false,
        extractedTasks: data.tasks || [],
        edits: {},
        rejected: {},
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau'
      updateWizard({ extracting: false, extractError: msg })
    }
  }, [wizard.pdfBase64, wizard.filename, wizard.commissionId, wizard.meetingDate, wizard.extracting, updateWizard])

  // Auto-déclenchement à l'arrivée sur l'étape (une seule fois)
  useEffect(() => {
    if (!startedRef.current && !wizard.extracting && wizard.extractedTasks.length === 0 && !wizard.extractError) {
      startedRef.current = true
      void startExtraction()
    }
  }, [wizard.extracting, wizard.extractedTasks.length, wizard.extractError, startExtraction])

  return (
    <div className="split" style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 1 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.greenLight, border: `2px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>IA</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: C.fg, fontWeight: 700 }}>
              {wizard.extracting && 'Extraction en cours…'}
              {!wizard.extracting && wizard.extractError && 'Erreur d\'extraction'}
              {!wizard.extracting && !wizard.extractError && wizard.extractedTasks.length > 0 && 'Extraction terminée'}
            </p>
            <p style={{ fontSize: 12, color: C.subtle }}>{wizard.filename}</p>
          </div>
          {wizard.extracting && <Badge label="Traitement IA" variant="primary" />}
          {!wizard.extracting && wizard.extractedTasks.length > 0 && (
            <Badge label={`${wizard.extractedTasks.length} tâche${wizard.extractedTasks.length > 1 ? 's' : ''}`} variant="success" />
          )}
        </div>

        {wizard.extracting && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              </div>
              <p style={{ fontSize: 12, color: C.warning, fontWeight: 600, flex: 1 }}>
                Claude analyse le document, identifie les actions et les responsables…
              </p>
            </div>
            <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: C.ph, overflow: 'hidden' }}>
              <div className="cr-progress-bar" style={{ width: '40%', height: '100%', background: C.green, borderRadius: 2, animation: 'cr-pulse 1.4s ease-in-out infinite' }} />
            </div>
            <p style={{ fontSize: 12, color: C.subtle, marginTop: 6 }}>
              Cela prend généralement 15 à 45 secondes selon la longueur du CR.
            </p>
            <style>{`
              @keyframes cr-pulse {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(250%); }
              }
            `}</style>
          </>
        )}

        {!wizard.extracting && wizard.extractError && (
          <>
            <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}`, color: C.danger, padding: 12, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Échec de l&apos;extraction</p>
              <p>{wizard.extractError}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={onPrev}>← Retour</Button>
              <Button variant="primary" onClick={() => { startedRef.current = false; void startExtraction() }}>
                Réessayer
              </Button>
            </div>
          </>
        )}

        {!wizard.extracting && !wizard.extractError && wizard.extractedTasks.length > 0 && (
          <Button variant="primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={onNext}>
            Voir les {wizard.extractedTasks.length} tâche{wizard.extractedTasks.length > 1 ? 's' : ''} extraite{wizard.extractedTasks.length > 1 ? 's' : ''} →
          </Button>
        )}

        {!wizard.extracting && !wizard.extractError && wizard.extractedTasks.length === 0 && (
          <p style={{ fontSize: 12, color: C.subtle, padding: '20px 0', textAlign: 'center' }}>
            Aucune tâche extraite. Le document ne contient peut-être pas d&apos;actions assignées clairement.
          </p>
        )}
      </Card>
    </div>
  )
}

// ─── Étape 2 : validation des tâches ─────────────────────────────────

function ValidationStep({
  wizard, updateWizard, onPrev, onNext,
}: {
  wizard: WizardState
  updateWizard: (patch: Partial<WizardState>) => void
  onPrev: () => void
  onNext: () => void
}) {
  const { commissions } = useCommissions()
  const { people } = useTeam()
  // Helper : valeur effective d'une tâche (extracted + edits)
  const effective = (i: number): ExtractedTask => ({
    ...wizard.extractedTasks[i],
    ...wizard.edits[i],
  })

  const updateEdit = (i: number, patch: Partial<ExtractedTask>) => {
    updateWizard({
      edits: {
        ...wizard.edits,
        [i]: { ...wizard.edits[i], ...patch },
      },
    })
  }

  const toggleReject = (i: number) => {
    updateWizard({
      rejected: { ...wizard.rejected, [i]: !wizard.rejected[i] },
    })
  }

  // Toutes les tâches non rejetées sont créées (les non assignées tombent
  // dans la commission, non assignées).
  const acceptedCount = wizard.extractedTasks.reduce(
    (acc, _, i) => (wizard.rejected[i] ? acc : acc + 1), 0,
  )
  const unassignedCount = wizard.extractedTasks.reduce((acc, _, i) => {
    const t = effective(i)
    return acc + (!wizard.rejected[i] && !t.assigneeId ? 1 : 0)
  }, 0)

  // Récap : qui sera notifié
  const notifyCounts = new Map<string, number>()
  wizard.extractedTasks.forEach((_, i) => {
    if (wizard.rejected[i]) return
    const t = effective(i)
    if (t.assigneeId) {
      notifyCounts.set(t.assigneeId, (notifyCounts.get(t.assigneeId) ?? 0) + 1)
    }
  })

  return (
    <div className="split" style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 3 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: C.greenLight, borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>IA</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>Extraction terminée</p>
            <p style={{ fontSize: 12, color: C.muted }}>
              {wizard.extractedTasks.length} tâche{wizard.extractedTasks.length > 1 ? 's' : ''} identifiée{wizard.extractedTasks.length > 1 ? 's' : ''}
              {unassignedCount > 0 && ` — ${unassignedCount} sans responsable identifié`}
            </p>
          </div>
        </div>

        {wizard.extractedTasks.length === 0 && (
          <p style={{ fontSize: 12, color: C.subtle, padding: 20, textAlign: 'center' }}>
            Aucune tâche à valider.
          </p>
        )}

        {wizard.extractedTasks.map((_, i) => {
          const t = effective(i)
          const isRejected = wizard.rejected[i]
          const wasEdited = !!wizard.edits[i] && Object.keys(wizard.edits[i]).length > 0
          const needsAssignee = !t.assigneeId

          return (
            <div
              key={i}
              style={{
                border: `1px solid ${isRejected ? C.subtle : needsAssignee ? C.warning : wasEdited ? C.warning : C.border}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                background: isRejected ? C.bg : needsAssignee ? C.warningLight : wasEdited ? C.warningLight : '#fff',
                opacity: isRejected ? 0.55 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={t.label}
                    onChange={e => updateEdit(i, { label: e.target.value })}
                    style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 6, width: '100%', border: 'none', background: 'transparent', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge
                      label={`Confiance : ${t.confidence}%`}
                      variant={t.confidence > 80 ? 'success' : t.confidence > 70 ? 'warning' : 'danger'}
                    />
                    {wasEdited && <Badge label="Modifié" variant="terra" />}
                    {needsAssignee && !isRejected && <Badge label="Responsable à définir" variant="warning" />}
                    {t.sourceQuote && (
                      <span style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>
                        « {t.sourceQuote.length > 80 ? t.sourceQuote.slice(0, 80) + '…' : t.sourceQuote} »
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleReject(i)}
                  title={isRejected ? 'Réintégrer' : 'Rejeter cette tâche'}
                  style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${isRejected ? C.subtle : C.danger}`, background: isRejected ? C.bg : C.dangerLight, color: isRejected ? C.subtle : C.danger, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  {isRejected ? '↺' : '✕'}
                </button>
              </div>

              {!isRejected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={t.assigneeId ?? ''}
                    onChange={e => updateEdit(i, { assigneeId: e.target.value || null })}
                    style={{ flex: 1.5, height: 28, border: `1px solid ${needsAssignee ? C.warning : C.border}`, borderRadius: 5, background: needsAssignee ? '#fff' : C.bg, padding: '0 8px', fontSize: 12, color: t.assigneeId ? C.fg : C.warning, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <option value="">— Choisir un responsable —</option>
                    {people.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.poste})</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={t.dueDate ?? ''}
                    onChange={e => updateEdit(i, { dueDate: e.target.value || null })}
                    style={{ width: 130, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, padding: '0 8px', fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                  />
                  <select
                    value={t.priority}
                    onChange={e => updateEdit(i, { priority: e.target.value as TaskPriority })}
                    style={{ width: 90, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, padding: '0 8px', fontSize: 12, color: C.muted, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="Normal">Normal</option>
                    <option value="Faible">Faible</option>
                  </select>
                </div>
              )}
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button style={{ flex: 1, justifyContent: 'center' }} onClick={onPrev}>← Retour à l&apos;extraction</Button>
          <Button
            variant="primary"
            style={{ flex: 2, justifyContent: 'center' }}
            disabled={acceptedCount === 0}
            onClick={onNext}
          >
            Créer {acceptedCount} tâche{acceptedCount > 1 ? 's' : ''} et notifier →
          </Button>
        </div>
      </Card>

      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 10 }}>Récapitulatif</p>
          {[
            ['Document', wizard.filename ?? '—'],
            ['Commission', commissions.find(c => c.id === wizard.commissionId)?.name ?? '—'],
            ['Tâches extraites', String(wizard.extractedTasks.length)],
            ['À créer', `${acceptedCount}`],
            ['Rejetées', `${Object.values(wizard.rejected).filter(Boolean).length}`],
            ['Dont non assignées', `${unassignedCount}`],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 0', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
              <p style={{ fontSize: 12, color: C.subtle, width: 110, flexShrink: 0 }}>{k}</p>
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{v}</p>
            </div>
          ))}
        </Card>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Personnes à notifier</p>
          {notifyCounts.size === 0 && (
            <p style={{ fontSize: 12, color: C.subtle }}>Aucune personne à notifier — les tâches non assignées tomberont dans la commission.</p>
          )}
          {Array.from(notifyCounts.entries()).map(([personId, count], i, arr) => {
            const p = people.find(x => x.id === personId)
            if (!p) return null
            return (
              <div key={personId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Avatar initials={p.initials} size={20} color={p.color} photo={p.photoUrl} />
                <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{p.fullName}</p>
                <p style={{ fontSize: 12, color: C.subtle }}>{count} tâche{count > 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

// ─── Étape 3 : création effective + confirmation ─────────────────────

function NotificationStep({
  wizard, onNewCR, onBackToList,
}: {
  wizard: WizardState
  onNewCR: () => void
  onBackToList: () => void
}) {
  const { createTask } = useTasks()
  const { createCR } = useComptesRendus()
  const { commissions } = useCommissions()
  const { people } = useTeam()

  // Création des tâches au montage (idempotent : un ref évite la double-exécution en strict mode)
  const createdRef = useRef(false)
  const [created, setCreated] = useState<{ taskIds: string[]; cr: CompteRendu } | null>(null)

  useEffect(() => {
    if (createdRef.current || wizard.extractedTasks.length === 0) return
    createdRef.current = true

    const newTaskIds: string[] = []
    wizard.extractedTasks.forEach((_, i) => {
      if (wizard.rejected[i]) return
      const t = { ...wizard.extractedTasks[i], ...wizard.edits[i] }

      const newTask = createTask({
        label: t.label,
        assigneeIds: t.assigneeId ? [t.assigneeId] : [],
        commissionIds: wizard.commissionId ? [wizard.commissionId] : [],
        dueDate: t.dueDate ?? undefined,
        priority: t.priority,
        status: 'À faire',
        documents: [],
      })
      newTaskIds.push(newTask.id)
    })

    const newCR = createCR({
      filename: wizard.filename ?? 'CR sans nom',
      commissionId: wizard.commissionId || undefined,
      meetingDate: wizard.meetingDate || undefined,
      taskIds: newTaskIds,
      pdfDataUrl: wizard.pdfDataUrl ?? undefined,
    })

    setCreated({ taskIds: newTaskIds, cr: newCR })
  }, [wizard, createTask, createCR])

  // Compté à partir de l'état wizard (disponible au 1er render, contrairement à `created`)
  const taskCount = wizard.extractedTasks.reduce(
    (acc, _, i) => (wizard.rejected[i] ? acc : acc + 1), 0,
  )
  const personCount = new Set(
    wizard.extractedTasks
      .filter((_, i) => !wizard.rejected[i])
      .map((_, i) => ({ ...wizard.extractedTasks[i], ...wizard.edits[i] }).assigneeId)
      .filter(Boolean),
  ).size
  // `created` n'est utilisé que pour confirmer la création (debug / future telemetry)
  void created

  return (
    <Card padding={24} style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.successLight, border: `2px solid ${C.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <span style={{ fontSize: 24 }}>✓</span>
      </div>
      <p style={{ fontSize: 18, color: C.fg, fontWeight: 700, marginBottom: 8 }}>
        {taskCount} tâche{taskCount > 1 ? 's' : ''} créée{taskCount > 1 ? 's' : ''}
      </p>
      <p style={{ fontSize: 14, color: C.subtle, marginBottom: 24 }}>
        {personCount} personne{personCount > 1 ? 's' : ''} concernée{personCount > 1 ? 's' : ''} — les tâches sont disponibles dans la rubrique « Tâches ».
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Button onClick={onBackToList}>Voir tous les CR</Button>
        <Button variant="primary" onClick={onNewCR}>Importer un autre CR</Button>
      </div>
    </Card>
  )
}

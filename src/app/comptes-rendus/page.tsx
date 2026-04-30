'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Step } from '@/components/ui/Step'
import { Separator } from '@/components/ui/Separator'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Row } from '@/components/ui/Row'
import { COLORS as C } from '@/lib/theme'

type CRView = 'upload' | 'extraction' | 'validation' | 'notification'
type TabView = 'liste' | 'wizard'

const EXTRACTED_TASKS = [
  { task: 'Répondre à la demande de permis de construire — parcelle B-204', who: 'Marie Durand', date: '15 mai', conf: 95 },
  { task: 'Finaliser le dossier PLU révision secteur Nord', who: 'Jean Martin', date: '30 mai', conf: 88 },
  { task: 'Commander les panneaux de signalisation route des Combes', who: 'Laurent Fabre', date: '20 mai', conf: 82, modified: true },
  { task: 'Vérifier la conformité du chantier école', who: 'Pierre Roche', date: '10 mai', conf: 74 },
  { task: 'Mettre à jour le registre des travaux Q2', who: 'Pierre Roche', date: '30 mai', conf: 61 },
]

const RECENT_CRS = [
  { title: 'CR Commission Travaux — 12 avril 2026', commission: 'Travaux & Urbanisme', tasks: 3, status: 'IA', date: '12 avr.' },
  { title: 'CR Commission Urbanisme — 28 mars 2026', commission: 'Travaux & Urbanisme', tasks: 5, status: 'Validé', date: '28 mars' },
  { title: 'CR Enfance & Jeunesse — 19 mars 2026', commission: 'Enfance & Jeunesse', tasks: 2, status: 'Archivé', date: '19 mars' },
  { title: 'CR Admin Générale — 5 mars 2026', commission: 'Admin & Finance', tasks: 4, status: 'Archivé', date: '5 mars' },
]

export default function CompteRendusPage() {
  const [tab, setTab] = useState<TabView>('liste')
  const [wizardStep, setWizardStep] = useState<number>(0)
  const [taskValidations, setTaskValidations] = useState<Record<number, boolean | null>>({})

  return (
    <Shell title="Comptes rendus" notif={1}>
      {/* Tab toggle */}
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
            <Button variant="primary" size="sm" onClick={() => setTab('wizard')}>+ Importer un CR</Button>
            <div style={{ width: 180, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <span style={{ fontSize: 11, color: C.subtle }}>Filtrer par commission…</span>
            </div>
          </>
        )}
      </div>

      {tab === 'liste' && <ListeView />}
      {tab === 'wizard' && (
        <WizardView
          step={wizardStep}
          onStepChange={setWizardStep}
          validations={taskValidations}
          onValidate={(i, v) => setTaskValidations(prev => ({ ...prev, [i]: v }))}
        />
      )}
    </Shell>
  )
}

function ListeView() {
  const [selected, setSelected] = useState<typeof RECENT_CRS[0] | null>(null)

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 180px)' }}>
      {/* Left: document viewer */}
      <Card style={{ flex: 2 }} padding={0}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 600, flex: 1 }}>{selected?.title ?? 'Sélectionner un compte rendu'}</p>
          {selected && <><Badge label="PDF" /><Button size="sm">Télécharger</Button></>}
        </div>
        <div style={{ padding: 16, overflow: 'auto', height: 'calc(100% - 48px)' }}>
          {selected ? (
            <>
              <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>Présents : J. Martin, M. Durand, L. Fabre, P. Roche, S. Bonnet</p>
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>1. Approbation du compte rendu précédent</p>
              <div style={{ height: 36, background: C.ph, borderRadius: 4, marginBottom: 10 }} />
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>2. Suivi chantier route des Combes</p>
              <div style={{ background: C.warningLight, border: `1px solid ${C.warning}30`, borderRadius: 4, padding: '8px 10px 8px 20px', marginBottom: 8, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: C.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>IA</span>
                </div>
                <p style={{ fontSize: 11, color: C.fg }}>« L. Fabre est chargé de commander les panneaux de signalisation avant le 20 mai. »</p>
              </div>
              <div style={{ height: 32, background: C.ph, borderRadius: 4, marginBottom: 10 }} />
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>3. Dossier PLU — secteur Nord</p>
              <div style={{ background: C.greenLight, border: `1px solid ${C.green}30`, borderRadius: 4, padding: '8px 10px 8px 20px', marginBottom: 8, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>IA</span>
                </div>
                <p style={{ fontSize: 11, color: C.fg }}>« Le dossier PLU doit être finalisé par J. Martin et M. Durand avant la fin mai. »</p>
              </div>
              <div style={{ height: 56, background: C.ph, borderRadius: 4 }} />
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: C.subtle }}>
              <span style={{ fontSize: 32 }}>📄</span>
              <p style={{ fontSize: 13 }}>Cliquez sur un CR pour le visualiser</p>
            </div>
          )}
        </div>
      </Card>

      {/* Right: list + tasks */}
      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: `${C.green}08`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>IA</span>
            </div>
            <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, flex: 1 }}>Comptes rendus</p>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {RECENT_CRS.map((cr, i) => (
              <div key={i} onClick={() => setSelected(cr)} style={{ padding: '10px 14px', borderBottom: i < RECENT_CRS.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: selected?.title === cr.title ? `${C.green}06` : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{cr.title}</p>
                  <Badge label={cr.status} variant={cr.status === 'IA' ? 'primary' : cr.status === 'Validé' ? 'success' : 'default'} />
                </div>
                <p style={{ fontSize: 10, color: C.subtle, marginTop: 2 }}>{cr.commission} · {cr.tasks} tâches · {cr.date}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function WizardView({ step, onStepChange, validations, onValidate }: {
  step: number
  onStepChange: (s: number) => void
  validations: Record<number, boolean | null>
  onValidate: (i: number, v: boolean) => void
}) {
  return (
    <div>
      <Step steps={['Upload', 'Extraction IA', 'Validation tâches', 'Notification']} current={step} />

      {step === 0 && <UploadStep onNext={() => onStepChange(1)} />}
      {step === 1 && <ExtractionStep onNext={() => onStepChange(2)} />}
      {step === 2 && <ValidationStep validations={validations} onValidate={onValidate} onPrev={() => onStepChange(1)} onNext={() => onStepChange(3)} />}
      {step === 3 && <NotificationStep onPrev={() => onStepChange(2)} />}
    </div>
  )
}

function UploadStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 2 }} padding={16}>
        <SectionHeader title="Importer un compte rendu" />
        <div style={{ border: `2px dashed ${C.green}`, borderRadius: 10, padding: 32, textAlign: 'center', background: C.greenLight, marginBottom: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
          <p style={{ fontSize: 14, color: C.green, fontWeight: 600, marginBottom: 6 }}>Glissez votre fichier ici</p>
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 14 }}>PDF, DOCX, TXT — Max 20 Mo</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button variant="primary" size="sm" onClick={onNext}>Parcourir les fichiers</Button>
            <Button size="sm">Depuis Hupmeet</Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Affecter à une commission…</span>
          </div>
          <div style={{ width: 150, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Date de la réunion</span>
          </div>
        </div>
      </Card>
      <Card style={{ flex: 1 }} padding={14}>
        <SectionHeader title="CRs récents" />
        {RECENT_CRS.slice(0, 3).map((cr, i) => (
          <Row key={i} label={cr.title} sub={cr.commission} badge={cr.status} badgeVariant={cr.status === 'IA' ? 'primary' : 'default'} right={cr.date} last={i === 2} />
        ))}
      </Card>
    </div>
  )
}

function ExtractionStep({ onNext }: { onNext: () => void }) {
  const steps = [
    { label: 'Lecture et indexation du document', done: true },
    { label: 'Identification des décisions et actions', done: true },
    { label: 'Extraction des tâches et responsables', done: false, active: true },
    { label: "Proposition d'affectation par rôle", done: false },
  ]
  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 1 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.greenLight, border: `2px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>IA</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: C.fg, fontWeight: 700 }}>Extraction en cours…</p>
            <p style={{ fontSize: 10, color: C.subtle }}>CR Commission Travaux — 12 avril 2026</p>
          </div>
          <Badge label="Traitement IA" variant="primary" />
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: s.done ? C.success : s.active ? C.warning : '#e2e6e3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.done && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
              {s.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
            </div>
            <p style={{ fontSize: 12, color: s.done ? C.success : s.active ? C.warning : C.subtle, fontWeight: s.active ? 600 : 400, flex: 1 }}>{s.label}</p>
            {s.active && <Badge label="En cours…" variant="warning" />}
          </div>
        ))}
        <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: C.ph, overflow: 'hidden' }}>
          <div style={{ width: '65%', height: '100%', background: C.green, borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 10, color: C.subtle, marginTop: 4 }}>Analyse : 65% — environ 30 secondes restantes</p>
        <Button variant="primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={onNext}>
          Voir les résultats →
        </Button>
      </Card>
    </div>
  )
}

function ValidationStep({ validations, onValidate, onPrev, onNext }: {
  validations: Record<number, boolean | null>
  onValidate: (i: number, v: boolean) => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 3 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: C.greenLight, borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>IA</span>
          </div>
          <div>
            <p style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>Extraction terminée</p>
            <p style={{ fontSize: 10, color: C.muted }}>5 tâches identifiées dans le CR — Commission Travaux du 12 avril</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button size="sm" variant="primary" onClick={onNext}>Tout valider</Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '6px 8px', background: C.bg, borderRadius: 6 }}>
          {['Tâche', 'Assigné à', 'Échéance', 'Commission', 'Action'].map((h, i) => (
            <p key={i} style={{ flex: [1.5, 1, 0.8, 0.8, 0.5][i], fontSize: 11, color: C.subtle }}>{h}</p>
          ))}
        </div>

        {EXTRACTED_TASKS.map((item, i) => (
          <div key={i} style={{ border: `1px solid ${item.modified ? C.warning : C.border}`, borderRadius: 8, padding: 12, marginBottom: 8, background: item.modified ? C.warningLight : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, marginBottom: 6 }}>{item.task}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge label={`Confiance : ${item.conf}%`} variant={item.conf > 80 ? 'success' : item.conf > 70 ? 'warning' : 'danger'} />
                  {item.modified && <Badge label="Modifié" variant="terra" />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => onValidate(i, true)}
                  style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${validations[i] === true ? C.success : C.border}`, background: validations[i] === true ? C.successLight : '#fff', color: validations[i] === true ? C.success : C.fg, cursor: 'pointer', fontSize: 13 }}
                >✓</button>
                <button
                  onClick={() => onValidate(i, false)}
                  style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${validations[i] === false ? C.danger : C.border}`, background: validations[i] === false ? C.dangerLight : '#fff', color: validations[i] === false ? C.danger : C.fg, cursor: 'pointer', fontSize: 13 }}
                >✕</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1.5, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <p style={{ fontSize: 11, color: C.muted }}>{item.who}</p>
              </div>
              <div style={{ flex: 0.8, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <p style={{ fontSize: 11, color: C.muted }}>{item.date}</p>
              </div>
              <div style={{ flex: 0.8, height: 28, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <p style={{ fontSize: 11, color: C.muted }}>Travaux</p>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button style={{ flex: 1, justifyContent: 'center' }} onClick={onPrev}>← Retour à l'extraction</Button>
          <Button variant="primary" style={{ flex: 2, justifyContent: 'center' }} onClick={onNext}>Valider la sélection et notifier →</Button>
        </div>
      </Card>

      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 10 }}>Récapitulatif</p>
          {[['Document', 'CR Travaux 12/04'], ['Commission', 'Travaux & Urbanisme'], ['Tâches extraites', '5'], ['Validées', `${Object.values(validations).filter(v => v === true).length} / 5`], ['À traiter', `${5 - Object.values(validations).filter(v => v !== null).length} restantes`]].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
              <p style={{ fontSize: 10, color: C.subtle, width: 100, flexShrink: 0 }}>{k}</p>
              <p style={{ fontSize: 10, color: C.fg, fontWeight: 500 }}>{v}</p>
            </div>
          ))}
        </Card>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Personnes à notifier</p>
          {[['M. Durand', '1 tâche', C.green], ['J. Martin', '1 tâche', C.slate], ['L. Fabre', '1 tâche', C.terra], ['P. Roche', '2 tâches', C.subtle]].map(([n, t, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <Avatar initials={String(n).split(' ').map(x => x[0]).join('')} size={20} color={String(color)} />
              <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{n}</p>
              <p style={{ fontSize: 10, color: C.subtle }}>{t}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function NotificationStep({ onPrev }: { onPrev: () => void }) {
  return (
    <Card padding={24} style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.successLight, border: `2px solid ${C.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <span style={{ fontSize: 24 }}>✓</span>
      </div>
      <p style={{ fontSize: 18, color: C.fg, fontWeight: 700, marginBottom: 8 }}>Tâches créées et notifications envoyées</p>
      <p style={{ fontSize: 13, color: C.subtle, marginBottom: 24 }}>4 personnes ont été notifiées par e-mail avec leurs tâches assignées.</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Button onClick={onPrev}>Retour à la validation</Button>
        <Button variant="primary">Voir les tâches créées</Button>
      </div>
    </Card>
  )
}

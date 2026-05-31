'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { useProjets, projeterProjet, annuiteConstante } from '@/hooks/useProjets'
import type { RatiosM14 } from '@/lib/ratios'
import type { Projet, FinancementProjet, SourceFinancement, ProjectionAnnuelle } from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtMontantK = (v: number) => `${Math.round(v / 1000)} k€`

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
}

const SOURCE_OPTIONS: SourceFinancement[] = [
  'Emprunt', 'Subvention État', 'Subvention Région', 'Subvention Département',
  'Subvention GFP', 'Subvention Europe', 'Autofinancement', 'FCTVA',
]

interface ProjectionViewProps {
  baseRatios: RatiosM14
}

export function ProjectionView({ baseRatios }: ProjectionViewProps) {
  const { projets, hydrated, createProjet, updateProjet, deleteProjet } = useProjets()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Projet | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [horizon, setHorizon] = useState(5)
  const [croissance, setCroissance] = useState(1.5)

  // Si rien de sélectionné, on prend le premier projet
  const selected = selectedId
    ? projets.find(p => p.id === selectedId)
    : projets[0]

  const projection: ProjectionAnnuelle[] = useMemo(() => {
    if (!selected) return []
    return projeterProjet(selected, baseRatios, horizon, croissance)
  }, [selected, baseRatios, horizon, croissance])

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      {/* En-tête + actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', flex: 1, minWidth: 200 }}>
          Simulez l'impact d'un projet d'investissement sur les finances communales : étalement,
          financement, projection des ratios M14.
        </p>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouveau projet
        </Button>
      </div>

      {showForm && (
        <ProjetForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) updateProjet(editing.id, data)
            else {
              const created = createProjet(data)
              setSelectedId(created.id)
            }
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div className="split" data-open={selected ? 'true' : 'false'} style={{ display: 'flex', gap: 'var(--gap)' }}>
        {/* Liste des projets */}
        <div className="split__aside" style={{ width: 260, flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Projets en simulation ({projets.length})
          </p>
          {projets.length === 0 ? (
            <Card padding={14}>
              <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', textAlign: 'center' }}>
                Aucun projet pour le moment. Créez votre premier projet d'investissement.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {projets.map(p => {
                const isSel = (selected?.id === p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${isSel ? C.green : C.border}`,
                      background: isSel ? `${C.green}10` : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 4 }}>{p.nom}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag label={String(p.anneeDebut)} color={C.slate} />
                      <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600 }}>{fmtMontant(p.coutTotal)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Projection */}
        <div className="split__main" style={{ flex: 1, minWidth: 0 }}>
          {selected && <button type="button" className="split__back" onClick={() => setSelectedId(null)}>← Liste des projets</button>}
          {selected ? (
            <ProjetProjection
              projet={selected}
              projection={projection}
              baseRatios={baseRatios}
              horizon={horizon}
              setHorizon={setHorizon}
              croissance={croissance}
              setCroissance={setCroissance}
              onEdit={() => { setEditing(selected); setShowForm(true) }}
              onDelete={() => {
                if (confirm(`Supprimer le projet « ${selected.nom} » ?`)) {
                  deleteProjet(selected.id)
                  setSelectedId(null)
                }
              }}
            />
          ) : (
            <Card padding={32} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: C.subtle }}>Sélectionnez un projet pour voir sa projection.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Affichage de la projection d'un projet ─────────────────────────

function ProjetProjection({
  projet, projection, baseRatios, horizon, setHorizon, croissance, setCroissance, onEdit, onDelete,
}: {
  projet: Projet
  projection: ProjectionAnnuelle[]
  baseRatios: RatiosM14
  horizon: number
  setHorizon: (n: number) => void
  croissance: number
  setCroissance: (n: number) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const totalFinancement = projet.financements.reduce((acc, f) => acc + f.montant, 0)
  const equilibre = totalFinancement - projet.coutTotal

  // Données enrichies pour les graphes (en k€)
  const chartData = projection.map(p => ({
    annee: String(p.annee),
    rrf: Math.round(p.rrf / 1000),
    drf: Math.round(p.drf / 1000),
    cafBrute: Math.round(p.cafBrute / 1000),
    encoursDette: Math.round(p.encoursDetteEndAnnee / 1000),
    capaciteDesendettement: p.capaciteDesendettement,
    detteParHab: p.detteParHab,
    interets: Math.round(p.interetsDette),
    capital: Math.round(p.remboursementCapital),
  }))

  // Comparaison avec/sans projet sur la dernière année
  const lastYear = projection[projection.length - 1]
  const baseDetteParHab = baseRatios.population > 0 ? Math.round(baseRatios.encoursDette / baseRatios.population) : 0

  return (
    <Card padding={16}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, color: C.fg, fontWeight: 700, lineHeight: 1.3 }}>{projet.nom}</p>
          {projet.description && (
            <p style={{ fontSize: 12, color: C.subtle, marginTop: 4 }}>{projet.description}</p>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Tag label={`Début ${projet.anneeDebut}`} color={C.slate} />
            <Tag label={`Étalé sur ${projet.anneesEtalement} an${projet.anneesEtalement > 1 ? 's' : ''}`} color={C.info} />
            <Tag label={`Imputation ${projet.imputationCompte}`} color={C.terra} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" onClick={onEdit}>✎ Modifier</Button>
          <Button size="sm" variant="danger" onClick={onDelete}>Supprimer</Button>
        </div>
      </div>

      {/* Récap financement */}
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 16 }}>
        <KpiCard label="Coût total" value={fmtMontant(projet.coutTotal)} sub={projet.coutHT ? `HT ${fmtMontant(projet.coutHT)}` : undefined} color={C.slate} />
        <KpiCard label="Financement total" value={fmtMontant(totalFinancement)} sub={equilibre === 0 ? '✓ équilibré' : `Δ ${fmtMontant(equilibre)}`} color={equilibre === 0 ? C.success : C.warning} />
        <KpiCard label="Subventions" value={fmtMontant(projet.financements.filter(f => f.source.startsWith('Subvention')).reduce((a, f) => a + f.montant, 0))} sub={`${projet.financements.filter(f => f.source.startsWith('Subvention')).length} financeur(s)`} color={C.success} />
        <KpiCard label="Emprunt" value={fmtMontant(projet.financements.filter(f => f.source === 'Emprunt').reduce((a, f) => a + f.montant, 0))} sub={(() => {
          const emp = projet.financements.find(f => f.source === 'Emprunt')
          if (!emp) return 'aucun'
          return `${emp.dureeAnnees ?? '?'}ans @ ${emp.tauxInteret ?? '?'}%`
        })()} color={C.danger} />
      </div>

      {/* Détail financements */}
      <SectionHeader title="Plan de financement" />
      <Card padding={0} style={{ marginBottom: 16, background: C.bg }}>
        <div className="table-stack--head" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 90px', gap: 10, padding: '8px 14px', borderBottom: `1px solid ${C.border}` }}>
          {['Source', 'Organisme', 'Montant', 'Détail', 'Versement'].map(h => (
            <p key={h} style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {projet.financements.map((f, i) => (
          <div key={f.id} className="table-stack" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 90px', gap: 10, padding: '8px 14px', borderBottom: i < projet.financements.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
            <Tag label={f.source} color={f.source === 'Emprunt' ? C.danger : f.source === 'FCTVA' ? C.info : f.source === 'Autofinancement' ? C.slate : C.success} />
            <span style={{ color: C.subtle, fontSize: 12 }}>{f.organisme ?? '—'}</span>
            <span style={{ color: C.fg, fontWeight: 600 }}>{fmtMontant(f.montant)}</span>
            <span style={{ color: C.subtle, fontSize: 12 }}>
              {f.source === 'Emprunt' && f.dureeAnnees && f.tauxInteret
                ? `${f.dureeAnnees} ans à ${f.tauxInteret}% — annuité ${fmtMontant(annuiteConstante(f.montant, f.tauxInteret, f.dureeAnnees))}`
                : f.certitude ? `Certitude : ${f.certitude}` : ''}
            </span>
            <span style={{ color: C.muted }}>{f.anneeVersement ?? projet.anneeDebut}</span>
          </div>
        ))}
      </Card>

      {/* Configuration projection */}
      <Card padding={12} style={{ marginBottom: 16, background: `${C.green}06`, borderColor: `${C.green}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>Paramètres de la projection</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            Horizon :
            <select value={horizon} onChange={e => setHorizon(parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 80, height: 28 }}>
              {[3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} ans</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            Croissance recettes/dépenses :
            <input type="number" step="0.5" value={croissance} onChange={e => setCroissance(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 70, height: 28 }} />
            <span>% / an</span>
          </label>
        </div>
      </Card>

      {/* KPI projection finale */}
      {lastYear && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Projection à {horizon} ans (impact en {lastYear.annee})
          </p>
          <div style={{ display: 'flex', gap: 'var(--gap)' }}>
            <KpiCard
              label="Encours dette projeté"
              value={fmtMontant(lastYear.encoursDetteEndAnnee)}
              sub={`vs ${fmtMontant(baseRatios.encoursDette)} aujourd'hui`}
              color={lastYear.encoursDetteEndAnnee > baseRatios.encoursDette ? C.warning : C.success}
            />
            <KpiCard
              label="Désendettement projeté"
              value={lastYear.cafBrute > 0 ? `${lastYear.capaciteDesendettement} ans` : '∞'}
              sub={lastYear.capaciteDesendettement < 8 ? '✓ sain' : lastYear.capaciteDesendettement <= 12 ? '⚠ à surveiller' : '✕ critique'}
              color={lastYear.capaciteDesendettement < 8 ? C.success : lastYear.capaciteDesendettement <= 12 ? C.warning : C.danger}
            />
            <KpiCard
              label="Dette par hab. projetée"
              value={`${lastYear.detteParHab} €`}
              sub={`vs ${baseDetteParHab} € aujourd'hui`}
              color={lastYear.detteParHab > baseDetteParHab ? C.warning : C.success}
            />
            <KpiCard
              label="CAF brute projetée"
              value={fmtMontant(lastYear.cafBrute)}
              sub={`vs ${fmtMontant(baseRatios.cafBrute)} aujourd'hui`}
              color={lastYear.cafBrute >= baseRatios.cafBrute ? C.success : C.warning}
            />
          </div>
        </div>
      )}

      {/* Graphes */}
      <div className="grid-reflow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <Card padding={14}>
          <SectionHeader title="Encours de dette projeté" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>En milliers d'euros</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="encoursDette" name="Encours dette (k€)" fill={C.slate} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding={14}>
          <SectionHeader title="Capacité de désendettement" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>Seuil sain &lt; 8 ans · Surveillance 8-12 · Critique &gt; 12</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" ans" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="capaciteDesendettement" name="Désendettement (années)" stroke={C.danger} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card padding={14}>
          <SectionHeader title="Recettes vs Dépenses fonctionnement" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>RRF, DRF (avec intérêts du projet) et CAF brute en k€</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rrf" name="RRF" fill={C.success} />
              <Bar dataKey="drf" name="DRF" fill={C.warning} />
              <Line type="monotone" dataKey="cafBrute" name="CAF brute" stroke={C.green} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card padding={14}>
          <SectionHeader title="Annuités d'emprunt" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>Décomposition intérêts (chap. 66) / capital (chap. 16D) en €</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" €" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="capital" name="Capital remboursé" stackId="a" fill={C.slate} />
              <Bar dataKey="interets" name="Intérêts" stackId="a" fill={C.warning} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <SectionHeader title="Détail année par année" />
      <Card padding={0}>
        <div className="table-stack--head" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr 1fr 90px', gap: 8, padding: '8px 12px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['Année', 'Dép. équip.', 'Recettes inv.', 'Intérêts', 'Capital remb.', 'Encours fin', 'CAF brute', 'Désendet.'].map(h => (
            <p key={h} style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</p>
          ))}
        </div>
        {projection.map((p, i) => (
          <div key={p.annee} className="table-stack" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr 1fr 90px', gap: 8, padding: '8px 12px', borderBottom: i < projection.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: C.fg, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.annee}</span>
            <span style={{ color: p.depEquipement > 0 ? C.warning : C.subtle }}>{p.depEquipement > 0 ? fmtMontantK(p.depEquipement) : '—'}</span>
            <span style={{ color: p.recettesInvest > 0 ? C.success : C.subtle }}>{p.recettesInvest > 0 ? fmtMontantK(p.recettesInvest) : '—'}</span>
            <span style={{ color: C.muted }}>{p.interetsDette > 0 ? fmtMontant(p.interetsDette) : '—'}</span>
            <span style={{ color: C.muted }}>{p.remboursementCapital > 0 ? fmtMontant(p.remboursementCapital) : '—'}</span>
            <span style={{ color: C.fg, fontWeight: 600 }}>{fmtMontantK(p.encoursDetteEndAnnee)}</span>
            <span style={{ color: p.cafBrute >= 0 ? C.success : C.danger, fontWeight: 600 }}>{fmtMontantK(p.cafBrute)}</span>
            <Badge
              label={p.cafBrute > 0 ? `${p.capaciteDesendettement} ans` : '∞'}
              variant={p.capaciteDesendettement < 8 ? 'success' : p.capaciteDesendettement <= 12 ? 'warning' : 'danger'}
            />
          </div>
        ))}
      </Card>
    </Card>
  )
}

// ─── Formulaire projet ───────────────────────────────────────────────

function ProjetForm({ initial, onSubmit, onCancel }: {
  initial: Projet | null
  onSubmit: (data: Omit<Projet, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [coutTotal, setCoutTotal] = useState(String(initial?.coutTotal ?? ''))
  const [coutHT, setCoutHT] = useState(String(initial?.coutHT ?? ''))
  const [imputationCompte, setImputationCompte] = useState(initial?.imputationCompte ?? '21')
  const [anneeDebut, setAnneeDebut] = useState(String(initial?.anneeDebut ?? new Date().getFullYear()))
  const [anneesEtalement, setAnneesEtalement] = useState(String(initial?.anneesEtalement ?? 1))
  const [tauxFCTVA, setTauxFCTVA] = useState(String(initial?.tauxFCTVA ?? 16.404))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [financements, setFinancements] = useState<FinancementProjet[]>(initial?.financements ?? [])

  const num = (s: string) => Number.isNaN(parseFloat(s)) ? 0 : parseFloat(s)
  const valid = nom.trim() && num(coutTotal) > 0 && num(anneeDebut) >= 2020

  const totalFin = financements.reduce((acc, f) => acc + f.montant, 0)

  const addFinancement = () => {
    setFinancements(prev => [...prev, {
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: 'Subvention État',
      montant: 0,
      anneeVersement: parseInt(anneeDebut, 10),
      certitude: 'Probable',
    }])
  }

  const updateFinancement = (id: string, patch: Partial<FinancementProjet>) => {
    setFinancements(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const removeFinancement = (id: string) => {
    setFinancements(prev => prev.filter(f => f.id !== id))
  }

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? `Modifier ${initial.nom}` : 'Nouveau projet d\'investissement'} />
      <Field label="Nom du projet *">
        <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="ex: Réfection école — toiture" style={inputStyle} />
      </Field>
      <div style={{ marginTop: 10 }}>
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
        </Field>
      </div>

      <div className="grid-reflow" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 10 }}>
        <Field label="Coût total TTC (€) *">
          <input type="number" min="0" value={coutTotal} onChange={e => setCoutTotal(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Coût HT (€)">
          <input type="number" min="0" value={coutHT} onChange={e => setCoutHT(e.target.value)} placeholder="auto si vide" style={inputStyle} />
        </Field>
        <Field label="Imputation M14 *">
          <input type="text" value={imputationCompte} onChange={e => setImputationCompte(e.target.value)} placeholder="ex: 21312" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
        </Field>
        <Field label="Année début *">
          <input type="number" min="2020" value={anneeDebut} onChange={e => setAnneeDebut(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Étalement (années)">
          <input type="number" min="1" max="10" value={anneesEtalement} onChange={e => setAnneesEtalement(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <div style={{ marginTop: 10 }}>
        <Field label="Taux FCTVA (%) — récupéré 2 ans après l'investissement">
          <input type="number" step="0.001" value={tauxFCTVA} onChange={e => setTauxFCTVA(e.target.value)} style={{ ...inputStyle, width: 120 }} />
        </Field>
      </div>

      {/* Financements */}
      <p style={{ fontSize: 12, color: C.subtle, fontWeight: 700, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Plan de financement
      </p>
      {financements.length === 0 && (
        <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', marginBottom: 8 }}>
          Aucun financement. Ajoutez les subventions, l'emprunt, le FCTVA et l'autofinancement.
        </p>
      )}
      {financements.map((f, idx) => (
        <div key={f.id} className="grid-reflow" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 100px 80px 80px 90px 100px 30px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <select value={f.source} onChange={e => updateFinancement(f.id, { source: e.target.value as SourceFinancement })} style={{ ...inputStyle, fontSize: 12 }}>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" value={f.organisme ?? ''} onChange={e => updateFinancement(f.id, { organisme: e.target.value })} placeholder="organisme" style={{ ...inputStyle, fontSize: 12 }} />
          <input type="number" min="0" value={f.montant} onChange={e => updateFinancement(f.id, { montant: num(e.target.value) })} placeholder="€" style={{ ...inputStyle, fontSize: 12, textAlign: 'right' }} />
          {f.source === 'Emprunt' ? (
            <>
              <input type="number" min="0" max="30" value={f.dureeAnnees ?? ''} onChange={e => updateFinancement(f.id, { dureeAnnees: parseInt(e.target.value, 10) || undefined })} placeholder="durée" style={{ ...inputStyle, fontSize: 12 }} />
              <input type="number" min="0" step="0.01" value={f.tauxInteret ?? ''} onChange={e => updateFinancement(f.id, { tauxInteret: parseFloat(e.target.value) || undefined })} placeholder="taux %" style={{ ...inputStyle, fontSize: 12 }} />
            </>
          ) : (
            <>
              <select value={f.certitude ?? ''} onChange={e => updateFinancement(f.id, { certitude: e.target.value as 'Certaine' | 'Probable' | 'À demander' })} style={{ ...inputStyle, fontSize: 12 }}>
                <option value="Certaine">Certaine</option>
                <option value="Probable">Probable</option>
                <option value="À demander">À demander</option>
              </select>
              <span />
            </>
          )}
          <input type="number" min="2020" value={f.anneeVersement ?? ''} onChange={e => updateFinancement(f.id, { anneeVersement: parseInt(e.target.value, 10) || undefined })} placeholder="année" style={{ ...inputStyle, fontSize: 12 }} />
          <span style={{ fontSize: 12, color: C.subtle, textAlign: 'right' }}>{Math.round((f.montant / num(coutTotal)) * 100) || 0}%</span>
          <button onClick={() => removeFinancement(f.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 14 }}>×</button>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <Button size="sm" onClick={addFinancement}>+ Financement</Button>
        <span style={{ fontSize: 12, color: C.subtle }}>
          Total : <strong style={{ color: totalFin === num(coutTotal) ? C.success : C.warning }}>{fmtMontant(totalFin)}</strong>
          {totalFin !== num(coutTotal) && num(coutTotal) > 0 && (
            <span style={{ color: C.danger, marginLeft: 8 }}>
              (Δ {fmtMontant(totalFin - num(coutTotal))})
            </span>
          )}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <Field label="Notes">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            nom: nom.trim(),
            description: description.trim() || undefined,
            coutTotal: num(coutTotal),
            coutHT: coutHT ? num(coutHT) : undefined,
            imputationCompte: imputationCompte.trim(),
            anneeDebut: parseInt(anneeDebut, 10),
            anneesEtalement: parseInt(anneesEtalement, 10) || 1,
            tauxFCTVA: num(tauxFCTVA),
            notes: notes.trim() || undefined,
            financements,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer le projet'}
        </Button>
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

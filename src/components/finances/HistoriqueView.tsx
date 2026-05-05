'use client'

import { useState, useMemo, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { useHistorique, type ExerciceInput } from '@/hooks/useHistorique'
import {
  downloadHistoriqueTemplate, parseHistoriqueFromFile, exportHistorique,
} from '@/lib/excel-export'
import { computeRatiosFromAggregates, type RatiosM14 } from '@/lib/ratios'
import type { ExerciceHistorique } from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtMontantCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} k€`
  return `${v} €`
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

// Année courante calculée à partir des ratios live (2026)
type CurrentYear = {
  exercice: number
  population: number
  ratios: RatiosM14
  estimated: true
}

interface HistoriqueViewProps {
  // Année courante (calculée live depuis le plan comptable + factures + écritures)
  currentRatios: RatiosM14
  currentYearLabel?: string
}

// Construit une "ligne" pour les graphes : combine historique + année courante
type SerieRow = {
  exercice: number
  rrf: number
  drf: number
  cafBrute: number
  cafNette: number
  tauxEpargne: number
  capaciteDesendettement: number
  encoursDette: number
  capitalRembourse: number
  charges011: number
  charges012: number
  charges65: number
  charges66: number
  depEquipement: number
  population: number
  drfParHab: number
  rrfParHab: number
  detteParHab: number
  isCurrent?: boolean
}

function buildSerieRow(e: ExerciceHistorique): SerieRow {
  const r = computeRatiosFromAggregates(e)
  return {
    exercice: e.exercice,
    rrf: e.rrf,
    drf: e.drf,
    cafBrute: r.cafBrute,
    cafNette: r.cafNette,
    tauxEpargne: r.tauxEpargneBrute,
    capaciteDesendettement: r.capaciteDesendettement,
    encoursDette: e.encoursDette,
    capitalRembourse: e.capitalRembourse,
    charges011: e.charges011,
    charges012: e.charges012,
    charges65: e.charges65,
    charges66: e.charges66,
    depEquipement: e.depEquipement,
    population: e.population,
    drfParHab: r.ratio1_drfParHab,
    rrfParHab: r.ratio3_rrfParHab,
    detteParHab: r.ratio5_encoursDetteParHab,
  }
}

function buildSerieRowFromCurrent(currentYear: number, ratios: RatiosM14): SerieRow {
  return {
    exercice: currentYear,
    rrf: ratios.rrf,
    drf: ratios.drf,
    cafBrute: ratios.cafBrute,
    cafNette: ratios.cafNette,
    tauxEpargne: ratios.tauxEpargneBrute,
    capaciteDesendettement: ratios.capaciteDesendettement,
    encoursDette: ratios.encoursDette,
    capitalRembourse: ratios.capital16D,
    charges011: ratios.charges011,
    charges012: ratios.charges012,
    charges65: 0, // non détaillé dans les ratios courants
    charges66: ratios.charges66,
    depEquipement: 0, // non distingué (chap 20+21+23 → présent dans drInv)
    population: ratios.population,
    drfParHab: ratios.ratio1_drfParHab,
    rrfParHab: ratios.ratio3_rrfParHab,
    detteParHab: ratios.ratio5_encoursDetteParHab,
    isCurrent: true,
  }
}

export function HistoriqueView({ currentRatios, currentYearLabel }: HistoriqueViewProps) {
  const { exercices, hydrated, upsertExercice, deleteExercice, importExercices } = useHistorique()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExerciceHistorique | null>(null)
  const [importInfo, setImportInfo] = useState<{ ok: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentYear = new Date().getFullYear()

  // Série combinée : historique + année courante calculée
  const serie: SerieRow[] = useMemo(() => {
    const rows = exercices.map(buildSerieRow)
    // Si l'année courante n'a pas déjà été saisie, on l'ajoute en estimation live
    if (!exercices.some(e => e.exercice === currentYear) && currentRatios.rrf + currentRatios.drf > 0) {
      rows.push(buildSerieRowFromCurrent(currentYear, currentRatios))
    }
    return rows.sort((a, b) => a.exercice - b.exercice)
  }, [exercices, currentRatios, currentYear])

  // Variations N/N-1 sur les indicateurs clés
  const variations = useMemo(() => {
    if (serie.length < 2) return []
    return serie.slice(1).map((row, i) => {
      const prev = serie[i]
      const v = (curr: number, p: number) => p > 0 ? Math.round(((curr - p) / p) * 1000) / 10 : 0
      return {
        exercice: row.exercice,
        deltaRrf: v(row.rrf, prev.rrf),
        deltaDrf: v(row.drf, prev.drf),
        deltaCaf: v(row.cafBrute, prev.cafBrute),
        deltaPersonnel: v(row.charges012, prev.charges012),
        deltaDette: v(row.encoursDette, prev.encoursDette),
      }
    })
  }, [serie])

  const handleFile = async (file: File | null) => {
    if (!file) return
    setImportInfo(null)
    try {
      const { rows, errors } = await parseHistoriqueFromFile(file)
      if (rows.length > 0) {
        importExercices(rows)
      }
      setImportInfo({ ok: rows.length, errors })
    } catch (e) {
      setImportInfo({ ok: 0, errors: [`Erreur de lecture : ${(e as Error).message}`] })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      {/* Barre d'actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SectionHeader title={`Historique pluriannuel (${exercices.length} exercice${exercices.length > 1 ? 's' : ''} importé${exercices.length > 1 ? 's' : ''})`} />
        <div style={{ flex: 1 }} />
        <Button size="sm" onClick={() => downloadHistoriqueTemplate()}>📥 Modèle Excel</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => handleFile(e.target.files?.[0] ?? null)}
          style={{ display: 'none' }}
        />
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>📤 Importer .xlsx</Button>
        <Button size="sm" onClick={() => exportHistorique(exercices)} disabled={exercices.length === 0}>📊 Exporter</Button>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>+ Saisir un exercice</Button>
      </div>

      {/* Feedback import */}
      {importInfo && (
        <Card padding={10} style={{ marginBottom: 12, background: importInfo.errors.length === 0 ? C.successLight : C.dangerLight, borderColor: importInfo.errors.length === 0 ? C.success : C.danger }}>
          <p style={{ fontSize: 12, color: importInfo.errors.length === 0 ? C.success : C.danger, fontWeight: 600 }}>
            {importInfo.ok > 0 && `✓ ${importInfo.ok} exercice${importInfo.ok > 1 ? 's' : ''} importé${importInfo.ok > 1 ? 's' : ''}.`}
            {importInfo.errors.length > 0 && ` ${importInfo.errors.length} erreur${importInfo.errors.length > 1 ? 's' : ''} :`}
          </p>
          {importInfo.errors.slice(0, 5).map((err, i) => (
            <p key={i} style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>· {err}</p>
          ))}
          {importInfo.errors.length > 5 && (
            <p style={{ fontSize: 11, color: C.subtle, fontStyle: 'italic', marginTop: 4 }}>… et {importInfo.errors.length - 5} autre(s).</p>
          )}
          <button onClick={() => setImportInfo(null)} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Fermer</button>
        </Card>
      )}

      {/* Formulaire saisie */}
      {showForm && (
        <ExerciceForm
          initial={editing}
          onSubmit={(data) => {
            upsertExercice(data)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* État vide */}
      {exercices.length === 0 && !showForm && (
        <Card padding={32} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, marginBottom: 8 }}>
            Aucun exercice historique pour le moment
          </p>
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 16 }}>
            Importez les agrégats des années précédentes (RRF, DRF, dette, etc.) pour comparer<br />
            l'évolution de votre commune et calculer les ratios pluriannuels.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button size="sm" onClick={() => downloadHistoriqueTemplate()}>📥 Télécharger le modèle</Button>
            <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>+ Saisir manuellement</Button>
          </div>
        </Card>
      )}

      {/* Liste des exercices */}
      {exercices.length > 0 && (
        <Card padding={0} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 1fr 1fr 1fr 1fr 1fr 80px', padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Exercice', 'Pop.', 'RRF', 'DRF', 'CAF brute', 'Encours dette', 'Désendet.', 'Actions'].map(h => (
              <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {exercices.map((e, i) => {
            const r = computeRatiosFromAggregates(e)
            return (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '70px 70px 1fr 1fr 1fr 1fr 1fr 80px', padding: '8px 14px', alignItems: 'center', borderBottom: i < exercices.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 12 }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: C.fg }}>{e.exercice}</p>
                <p style={{ color: C.subtle }}>{e.population}</p>
                <p style={{ color: C.success, fontWeight: 600 }}>{fmtMontant(e.rrf)}</p>
                <p style={{ color: C.warning, fontWeight: 600 }}>{fmtMontant(e.drf)}</p>
                <p style={{ color: r.cafBrute >= 0 ? C.success : C.danger, fontWeight: 600 }}>{fmtMontant(r.cafBrute)}</p>
                <p style={{ color: C.fg }}>{fmtMontant(e.encoursDette)}</p>
                <p style={{ color: r.capaciteDesendettement < 8 ? C.success : r.capaciteDesendettement <= 12 ? C.warning : C.danger, fontWeight: 600 }}>
                  {r.cafBrute > 0 ? `${r.capaciteDesendettement} ans` : '∞'}
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => { setEditing(e); setShowForm(true) }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', color: C.muted, cursor: 'pointer', fontSize: 11 }}
                    title="Modifier"
                  >✎</button>
                  <button
                    onClick={() => { if (confirm(`Supprimer l'exercice ${e.exercice} ?`)) deleteExercice(e.id) }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}
                    title="Supprimer"
                  >×</button>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Graphiques comparatifs */}
      {serie.length >= 1 && (
        <ChartsSection serie={serie} variations={variations} currentYearLabel={currentYearLabel ?? `${currentYear} (estimation live)`} />
      )}
    </div>
  )
}

// ─── Section graphiques ────────────────────────────────────────────────

function ChartsSection({
  serie, variations, currentYearLabel,
}: {
  serie: SerieRow[]
  variations: ReturnType<typeof useMemo<{ exercice: number; deltaRrf: number; deltaDrf: number; deltaCaf: number; deltaPersonnel: number; deltaDette: number }[]>>
  currentYearLabel: string
}) {
  // Affichage : pour les valeurs en €, on convertit en k€ pour lisibilité du graphe
  const serieKeur = serie.map(s => ({
    ...s,
    rrfK: s.rrf / 1000,
    drfK: s.drf / 1000,
    cafBruteK: s.cafBrute / 1000,
    encoursK: s.encoursDette / 1000,
    capitalK: s.capitalRembourse / 1000,
    charges011K: s.charges011 / 1000,
    charges012K: s.charges012 / 1000,
    charges65K: s.charges65 / 1000,
    charges66K: s.charges66 / 1000,
    autresK: Math.max(0, (s.drf - s.charges011 - s.charges012 - s.charges65 - s.charges66) / 1000),
    label: s.isCurrent ? `${s.exercice} (live)` : String(s.exercice),
  }))

  const lastTwo = serie.length >= 2 ? serie.slice(-2) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {/* KPI résumé période */}
      {lastTwo && (
        <div style={{ display: 'flex', gap: 'var(--gap)' }}>
          <KpiCard
            label={`Évolution RRF ${lastTwo[0].exercice}→${lastTwo[1].exercice}`}
            value={`${variations[variations.length - 1]?.deltaRrf >= 0 ? '+' : ''}${variations[variations.length - 1]?.deltaRrf ?? 0}%`}
            sub={`${fmtMontant(lastTwo[0].rrf)} → ${fmtMontant(lastTwo[1].rrf)}`}
            color={(variations[variations.length - 1]?.deltaRrf ?? 0) >= 0 ? C.success : C.danger}
          />
          <KpiCard
            label="Évolution DRF"
            value={`${variations[variations.length - 1]?.deltaDrf >= 0 ? '+' : ''}${variations[variations.length - 1]?.deltaDrf ?? 0}%`}
            sub={`${fmtMontant(lastTwo[0].drf)} → ${fmtMontant(lastTwo[1].drf)}`}
            color={(variations[variations.length - 1]?.deltaDrf ?? 0) > 3 ? C.warning : C.muted}
          />
          <KpiCard
            label="Évolution CAF brute"
            value={`${variations[variations.length - 1]?.deltaCaf >= 0 ? '+' : ''}${variations[variations.length - 1]?.deltaCaf ?? 0}%`}
            sub={`${fmtMontant(lastTwo[0].cafBrute)} → ${fmtMontant(lastTwo[1].cafBrute)}`}
            color={(variations[variations.length - 1]?.deltaCaf ?? 0) >= 0 ? C.success : C.danger}
          />
          <KpiCard
            label="Évolution encours dette"
            value={`${variations[variations.length - 1]?.deltaDette >= 0 ? '+' : ''}${variations[variations.length - 1]?.deltaDette ?? 0}%`}
            sub={`${fmtMontant(lastTwo[0].encoursDette)} → ${fmtMontant(lastTwo[1].encoursDette)}`}
            color={(variations[variations.length - 1]?.deltaDette ?? 0) <= 0 ? C.success : C.warning}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        {/* Recettes vs Dépenses */}
        <Card padding={14}>
          <SectionHeader title="Recettes vs Dépenses de fonctionnement" />
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>En milliers d'euros — l'écart vert représente la CAF brute.</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={serieKeur} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
              <Tooltip
                formatter={(v) => [`${Math.round(Number(v))} k€`]}
                labelStyle={{ color: C.fg }}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rrfK" name="RRF" fill={C.success} />
              <Bar dataKey="drfK" name="DRF" fill={C.warning} />
              <Line type="monotone" dataKey="cafBruteK" name="CAF brute" stroke={C.green} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Capacité désendettement */}
        <Card padding={14}>
          <SectionHeader title="Encours de dette & capacité de désendettement" />
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>Seuil sain : &lt; 8 ans · Surveillance : 8-12 · Critique : &gt; 12.</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={serieKeur} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" fontSize={11} stroke={C.subtle} />
              <YAxis yAxisId="left" fontSize={11} stroke={C.subtle} unit=" k€" />
              <YAxis yAxisId="right" orientation="right" fontSize={11} stroke={C.subtle} unit=" ans" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="encoursK" name="Encours dette (k€)" fill={C.slate} />
              <Line yAxisId="right" type="monotone" dataKey="capaciteDesendettement" name="Désendettement (ans)" stroke={C.danger} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Ventilation des dépenses */}
        <Card padding={14}>
          <SectionHeader title="Ventilation des dépenses de fonctionnement" />
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>En milliers d'euros — empilé par chapitre M14.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serieKeur} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="charges012K" name="Personnel (012)" stackId="a" fill={C.slate} />
              <Bar dataKey="charges011K" name="Charges générales (011)" stackId="a" fill={C.green} />
              <Bar dataKey="charges65K" name="Gestion courante (65)" stackId="a" fill={C.terra} />
              <Bar dataKey="charges66K" name="Intérêts dette (66)" stackId="a" fill={C.warning} />
              <Bar dataKey="autresK" name="Autres" stackId="a" fill={C.info} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Indicateurs par habitant */}
        <Card padding={14}>
          <SectionHeader title="Indicateurs par habitant (R. 2313-1)" />
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>Évolution des principaux ratios DGFiP.</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={serieKeur} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" €" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="rrfParHab" name="RRF / hab." stroke={C.success} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="drfParHab" name="DRF / hab." stroke={C.warning} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="detteParHab" name="Dette / hab." stroke={C.danger} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Taux d'épargne */}
        <Card padding={14}>
          <SectionHeader title="Taux d'épargne brute" />
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 8 }}>Seuil sain : &gt; 12% · Surveillance : 8-12% · Faible : &lt; 8%.</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={serieKeur} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" fontSize={11} stroke={C.subtle} />
              <YAxis fontSize={11} stroke={C.subtle} unit=" %" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="tauxEpargne" name="Taux d'épargne brute (%)" stroke={C.green} strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Variations N/N-1 */}
        <Card padding={14}>
          <SectionHeader title="Variations annuelles" />
          {variations.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Au moins 2 exercices nécessaires pour calculer les variations.</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr 1fr', padding: '6px 8px', background: C.bg, borderRadius: 4, fontSize: 9, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                <span>Exercice</span>
                <span>RRF</span>
                <span>DRF</span>
                <span>CAF</span>
                <span>Personnel</span>
                <span>Dette</span>
              </div>
              {variations.map(v => (
                <div key={v.exercice} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr 1fr', padding: '6px 8px', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: C.fg }}>{v.exercice}</span>
                  <VariationCell value={v.deltaRrf} positiveIsGood />
                  <VariationCell value={v.deltaDrf} positiveIsGood={false} />
                  <VariationCell value={v.deltaCaf} positiveIsGood />
                  <VariationCell value={v.deltaPersonnel} positiveIsGood={false} />
                  <VariationCell value={v.deltaDette} positiveIsGood={false} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function VariationCell({ value, positiveIsGood }: { value: number; positiveIsGood: boolean }) {
  const sign = value >= 0 ? '+' : ''
  const isGood = positiveIsGood ? value >= 0 : value <= 0
  const color = Math.abs(value) < 0.5 ? C.subtle : isGood ? C.success : C.danger
  const arrow = Math.abs(value) < 0.5 ? '' : value > 0 ? '↑ ' : '↓ '
  return <span style={{ color, fontWeight: 600 }}>{arrow}{sign}{value}%</span>
}

// ─── Formulaire de saisie d'un exercice ───────────────────────────────

function ExerciceForm({ initial, onSubmit, onCancel }: {
  initial: ExerciceHistorique | null
  onSubmit: (data: ExerciceInput) => void
  onCancel: () => void
}) {
  const [exercice, setExercice] = useState(String(initial?.exercice ?? new Date().getFullYear() - 1))
  const [population, setPopulation] = useState(String(initial?.population ?? 900))
  const [rrf, setRrf] = useState(String(initial?.rrf ?? ''))
  const [drf, setDrf] = useState(String(initial?.drf ?? ''))
  const [charges011, setCharges011] = useState(String(initial?.charges011 ?? ''))
  const [charges012, setCharges012] = useState(String(initial?.charges012 ?? ''))
  const [charges65, setCharges65] = useState(String(initial?.charges65 ?? ''))
  const [charges66, setCharges66] = useState(String(initial?.charges66 ?? ''))
  const [produits73, setProduits73] = useState(String(initial?.produits73 ?? ''))
  const [produits74, setProduits74] = useState(String(initial?.produits74 ?? ''))
  const [produits7411, setProduits7411] = useState(String(initial?.produits7411 ?? ''))
  const [produits7311, setProduits7311] = useState(String(initial?.produits7311 ?? ''))
  const [depEquipement, setDepEquipement] = useState(String(initial?.depEquipement ?? ''))
  const [recettesInvest, setRecettesInvest] = useState(String(initial?.recettesInvest ?? ''))
  const [encoursDette, setEncoursDette] = useState(String(initial?.encoursDette ?? ''))
  const [capitalRembourse, setCapitalRembourse] = useState(String(initial?.capitalRembourse ?? ''))
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const num = (s: string) => {
    const n = parseFloat(s.replace(',', '.'))
    return Number.isNaN(n) ? 0 : n
  }
  const ex = parseInt(exercice, 10)
  const pop = parseInt(population, 10)
  const valid = ex >= 1990 && ex <= 2100 && pop > 0

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? `Modifier l'exercice ${initial.exercice}` : 'Nouvel exercice historique'} />
      <p style={{ fontSize: 11, color: C.subtle, marginBottom: 10 }}>
        Les agrégats se trouvent dans le compte administratif (CA) de l'année concernée.
        Les valeurs en € peuvent être saisies sans séparateur (ex: <code>295000</code>).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Exercice *">
          <input type="number" value={exercice} onChange={e => setExercice(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Population (hab.) *">
          <input type="number" value={population} onChange={e => setPopulation(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section fonctionnement</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="RRF — Recettes réelles de fonctionnement (€)">
          <input type="number" value={rrf} onChange={e => setRrf(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="DRF — Dépenses réelles de fonctionnement (€)">
          <input type="number" value={drf} onChange={e => setDrf(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges 011 — Charges générales (€)">
          <input type="number" value={charges011} onChange={e => setCharges011(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges 012 — Personnel (€)">
          <input type="number" value={charges012} onChange={e => setCharges012(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges 65 — Gestion courante (€)">
          <input type="number" value={charges65} onChange={e => setCharges65(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges 66 — Intérêts dette (€)">
          <input type="number" value={charges66} onChange={e => setCharges66(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Produits 73 — Impôts & taxes (€)">
          <input type="number" value={produits73} onChange={e => setProduits73(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Produits 74 — Dotations (€)">
          <input type="number" value={produits74} onChange={e => setProduits74(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="DGF (compte 7411) (€)">
          <input type="number" value={produits7411} onChange={e => setProduits7411(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Impôts directs (compte 7311) (€)">
          <input type="number" value={produits7311} onChange={e => setProduits7311(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section investissement & dette</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Dépenses équipement (chap. 20+21+23) (€)">
          <input type="number" value={depEquipement} onChange={e => setDepEquipement(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Recettes investissement (€)">
          <input type="number" value={recettesInvest} onChange={e => setRecettesInvest(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Encours dette au 31/12 (€)">
          <input type="number" value={encoursDette} onChange={e => setEncoursDette(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Capital remboursé sur l'exercice (€)">
          <input type="number" value={capitalRembourse} onChange={e => setCapitalRembourse(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <Field label="Notes (facultatif)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      {/* Aperçu CAF */}
      {(num(rrf) > 0 && num(drf) > 0) && (
        <div style={{ marginTop: 12, padding: 10, background: C.bg, borderRadius: 6, display: 'flex', gap: 16 }}>
          <Tag label={`CAF brute ${fmtMontant(num(rrf) - num(drf))}`} color={(num(rrf) - num(drf)) >= 0 ? C.success : C.danger} />
          <Tag label={`Taux d'épargne ${num(rrf) > 0 ? Math.round(((num(rrf) - num(drf)) / num(rrf)) * 1000) / 10 : 0}%`} color={C.slate} />
          {num(encoursDette) > 0 && (num(rrf) - num(drf)) > 0 && (
            <Tag label={`Désendettement ${Math.round((num(encoursDette) / (num(rrf) - num(drf))) * 10) / 10} ans`} color={C.warning} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            exercice: ex,
            population: pop,
            rrf: num(rrf),
            drf: num(drf),
            charges011: num(charges011),
            charges012: num(charges012),
            charges65: num(charges65),
            charges66: num(charges66),
            produits73: num(produits73),
            produits74: num(produits74),
            produits7411: num(produits7411),
            produits7311: num(produits7311),
            depEquipement: num(depEquipement),
            recettesInvest: num(recettesInvest),
            encoursDette: num(encoursDette),
            capitalRembourse: num(capitalRembourse),
            notes: notes.trim() || undefined,
          })}
        >
          {initial ? 'Enregistrer les modifications' : 'Ajouter cet exercice'}
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

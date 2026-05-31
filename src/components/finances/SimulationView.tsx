'use client'

// Simulation financière « what-if » : ajuste des leviers (pression fiscale,
// dotations, charges, vente d'un bâtiment, nouvel emprunt, recette
// exceptionnelle) et compare la trajectoire « scénario » à la « référence »
// (situation actuelle projetée). Scénarios enregistrables en base.

import { useMemo, useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { useScenarios } from '@/hooks/useScenarios'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { projeterScenario, impactImmediat } from '@/lib/scenario'
import type { RatiosM14 } from '@/lib/ratios'
import type { ScenarioParams } from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const inputStyle: React.CSSProperties = {
  width: '100%', height: 32, border: `1px solid ${C.border}`, borderRadius: 6,
  background: '#fff', padding: '0 10px', fontSize: 12, color: C.fg, fontFamily: "'DM Sans', sans-serif",
}

interface SimulationViewProps {
  baseRatios: RatiosM14
}

export function SimulationView({ baseRatios }: SimulationViewProps) {
  const { scenarios, hydrated, createScenario, deleteScenario } = useScenarios()
  const { biens } = useParcImmobilier()
  const { can } = useCurrentUser()
  const canManage = can('finance.manage-budget')

  const [params, setParams] = useState<ScenarioParams>({})
  const [horizon, setHorizon] = useState(5)
  const [croissance, setCroissance] = useState(1.5)
  const [nom, setNom] = useState('')

  const setP = (patch: Partial<ScenarioParams>) => setParams(prev => ({ ...prev, ...patch }))
  const numOrUndef = (s: string) => (s === '' || Number.isNaN(parseFloat(s)) ? undefined : parseFloat(s))

  const biensActifs = useMemo(() => biens.filter(b => b.active), [biens])
  const venteBien = params.venteBienId ? biens.find(b => b.id === params.venteBienId) : undefined
  const loyerAnnuel = venteBien ? venteBien.loyerMensuel * 12 : 0

  const refProj = useMemo(
    () => projeterScenario(baseRatios, {}, { horizon, croissance }),
    [baseRatios, horizon, croissance],
  )
  const scnProj = useMemo(
    () => projeterScenario(baseRatios, params, { horizon, croissance, loyerAnnuelBienVendu: loyerAnnuel }),
    [baseRatios, params, horizon, croissance, loyerAnnuel],
  )
  const impact = useMemo(
    () => impactImmediat(baseRatios, params, loyerAnnuel),
    [baseRatios, params, loyerAnnuel],
  )

  const chartData = scnProj.map((s, i) => ({
    annee: String(s.annee),
    cafRef: Math.round((refProj[i]?.cafBrute ?? 0) / 1000),
    cafScn: Math.round(s.cafBrute / 1000),
    detteRef: Math.round((refProj[i]?.encoursDette ?? 0) / 1000),
    detteScn: Math.round(s.encoursDette / 1000),
  }))

  // Impact immédiat (an 1) : ratios dérivés.
  const impTauxEpargne = impact.rrf > 0 ? Math.round((impact.cafBrute / impact.rrf) * 1000) / 10 : 0
  const impDesend = impact.cafBrute > 0 ? Math.round((impact.encoursDette / impact.cafBrute) * 10) / 10 : 0

  const lastScn = scnProj[scnProj.length - 1]
  const lastRef = refProj[refProj.length - 1]

  const reset = () => setParams({})
  const save = () => {
    if (!nom.trim()) return
    createScenario({ nom: nom.trim(), horizon, croissance, params })
    setNom('')
  }
  const load = (id: string) => {
    const s = scenarios.find(x => x.id === id)
    if (!s) return
    setParams(s.params); setHorizon(s.horizon); setCroissance(s.croissance)
  }

  const delta = (scn: number, ref: number) => {
    const d = scn - ref
    if (d === 0) return null
    return <span style={{ color: d >= 0 ? C.success : C.danger }}> ({d >= 0 ? '+' : ''}{fmtMontant(d)})</span>
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>
          Simulez l&apos;effet d&apos;une décision (pression fiscale, vente d&apos;un bâtiment, emprunt…) sur les
          finances communales : comparaison de la trajectoire « scénario » à la « référence » (situation actuelle projetée).
        </p>
      </div>

      <div className="split" style={{ display: 'flex', gap: 'var(--gap)', alignItems: 'flex-start' }}>
        {/* ─── Panneau leviers ─── */}
        <div className="split__aside" style={{ width: 330, flexShrink: 0 }}>
          <Card padding={14}>
            <SectionHeader title="Leviers de simulation" />

            <LeverPct
              label="Pression fiscale (chap. 73)"
              base={baseRatios.produits73}
              value={params.pressionFiscalePct}
              onChange={v => setP({ pressionFiscalePct: v })}
            />
            <LeverPct
              label="Dotations (chap. 74)"
              base={baseRatios.produits74}
              value={params.dotationsPct}
              onChange={v => setP({ dotationsPct: v })}
            />
            <LeverPct
              label="Charges de personnel (chap. 012)"
              base={baseRatios.charges012}
              value={params.chargesPersonnelPct}
              onChange={v => setP({ chargesPersonnelPct: v })}
              invert
            />
            <LeverPct
              label="Charges générales (chap. 011)"
              base={baseRatios.charges011}
              value={params.chargesGeneralesPct}
              onChange={v => setP({ chargesGeneralesPct: v })}
              invert
            />

            <Separator my={10} />

            <p style={labelStyle}>Vente d&apos;un bâtiment communal</p>
            <select
              style={{ ...inputStyle, marginBottom: 6 }}
              value={params.venteBienId ?? ''}
              onChange={e => setP({ venteBienId: e.target.value || undefined })}
            >
              <option value="">— Aucun —</option>
              {biensActifs.map(b => (
                <option key={b.id} value={b.id}>{b.nom} ({fmtMontant(b.loyerMensuel)}/mois)</option>
              ))}
            </select>
            {venteBien && (
              <>
                <label style={labelStyle}>Produit de cession (€)</label>
                <input
                  type="number" min="0" style={{ ...inputStyle, marginBottom: 4 }}
                  value={params.venteBienPrix ?? ''}
                  onChange={e => setP({ venteBienPrix: numOrUndef(e.target.value) })}
                />
                <p style={{ fontSize: 11, color: C.subtle, marginBottom: 4 }}>
                  Perte de loyer : {fmtMontant(loyerAnnuel)}/an (RRF)
                </p>
              </>
            )}

            <Separator my={10} />

            <p style={labelStyle}>Nouvel emprunt</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
              <input type="number" min="0" placeholder="Montant €" style={inputStyle}
                value={params.empruntMontant ?? ''} onChange={e => setP({ empruntMontant: numOrUndef(e.target.value) })} />
              <input type="number" min="0" step="0.01" placeholder="Taux %" style={inputStyle}
                value={params.empruntTauxPct ?? ''} onChange={e => setP({ empruntTauxPct: numOrUndef(e.target.value) })} />
              <input type="number" min="1" max="40" placeholder="Durée" style={inputStyle}
                value={params.empruntDureeAnnees ?? ''} onChange={e => setP({ empruntDureeAnnees: numOrUndef(e.target.value) })} />
            </div>

            <p style={labelStyle}>Recette exceptionnelle (an 1, €)</p>
            <input type="number" min="0" style={{ ...inputStyle, marginBottom: 10 }}
              value={params.recetteExceptionnelle ?? ''} onChange={e => setP({ recetteExceptionnelle: numOrUndef(e.target.value) })} />

            <Separator my={10} />

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                Horizon
                <select value={horizon} onChange={e => setHorizon(parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 78, height: 28 }}>
                  {[3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} ans</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                Croissance
                <input type="number" step="0.5" value={croissance} onChange={e => setCroissance(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 56, height: 28 }} />%
              </label>
            </div>
            <Button size="sm" style={{ width: '100%' }} onClick={reset}>Réinitialiser les leviers</Button>
          </Card>

          {/* Scénarios enregistrés */}
          <Card padding={14} style={{ marginTop: 'var(--gap)' }}>
            <SectionHeader title={`Scénarios enregistrés (${scenarios.length})`} />
            {canManage && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input type="text" placeholder="Nom du scénario" style={inputStyle} value={nom} onChange={e => setNom(e.target.value)} />
                <Button variant="primary" size="sm" onClick={save} disabled={!nom.trim()}>Enregistrer</Button>
              </div>
            )}
            {!hydrated ? (
              <p style={{ fontSize: 12, color: C.subtle }}>Chargement…</p>
            ) : scenarios.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun scénario enregistré.</p>
            ) : scenarios.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => load(s.id)} title="Charger" style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>{s.horizon} ans · {s.croissance}%/an</p>
                </button>
                <Button size="sm" onClick={() => load(s.id)}>Charger</Button>
                {canManage && (
                  <button onClick={() => { if (confirm(`Supprimer le scénario « ${s.nom} » ?`)) deleteScenario(s.id) }}
                    title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 16 }}>×</button>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* ─── Résultats ─── */}
        <div className="split__main" style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Impact immédiat (an 1) vs situation actuelle
          </p>
          <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="CAF brute" value={fmtMontant(impact.cafBrute)}
              sub={<>vs {fmtMontant(baseRatios.cafBrute)}{delta(impact.cafBrute, baseRatios.cafBrute)}</>}
              color={impact.cafBrute >= baseRatios.cafBrute ? C.success : C.danger} />
            <KpiCard label="Encours dette" value={fmtMontant(impact.encoursDette)}
              sub={`vs ${fmtMontant(baseRatios.encoursDette)}`}
              color={impact.encoursDette > baseRatios.encoursDette ? C.warning : C.success} />
            <KpiCard label="Taux d'épargne" value={`${impTauxEpargne} %`}
              sub={`vs ${baseRatios.tauxEpargneBrute} %`}
              color={impTauxEpargne >= baseRatios.tauxEpargneBrute ? C.success : C.danger} />
            <KpiCard label="Désendettement" value={impact.cafBrute > 0 ? `${impDesend} ans` : '∞'}
              sub={`vs ${baseRatios.capaciteDesendettement} ans`}
              color={impDesend > 0 && impDesend <= 8 ? C.success : C.warning} />
          </div>

          <div className="grid-reflow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Card padding={14}>
              <SectionHeader title="CAF brute — référence vs scénario" />
              <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>En milliers d&apos;euros</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
                  <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="cafRef" name="Référence" stroke={C.slate} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cafScn" name="Scénario" stroke={C.green} strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card padding={14}>
              <SectionHeader title="Encours de dette — référence vs scénario" />
              <p style={{ fontSize: 12, color: C.subtle, marginBottom: 8 }}>En milliers d&apos;euros</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="annee" fontSize={11} stroke={C.subtle} />
                  <YAxis fontSize={11} stroke={C.subtle} unit=" k€" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="detteRef" name="Référence" fill={C.slate} fillOpacity={0.4} />
                  <Bar dataKey="detteScn" name="Scénario" fill={C.terra} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {lastScn && lastRef && (
            <Card padding={14} style={{ marginBottom: 'var(--gap)', background: `${C.green}06`, borderColor: `${C.green}30` }}>
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 700, marginBottom: 6 }}>
                À l&apos;horizon {horizon} ans (en {lastScn.annee})
              </p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                <span>CAF brute : <b>{fmtMontant(lastScn.cafBrute)}</b>{delta(lastScn.cafBrute, lastRef.cafBrute)}</span>
                <span>Encours dette : <b>{fmtMontant(lastScn.encoursDette)}</b>{delta(lastScn.encoursDette, lastRef.encoursDette)}</span>
                <span>Désendettement : <b>{lastScn.cafBrute > 0 ? `${lastScn.capaciteDesendettement} ans` : '∞'}</b></span>
              </div>
            </Card>
          )}

          {/* Tableau détaillé du scénario */}
          <SectionHeader title="Trajectoire du scénario — année par année" />
          <Card padding={0}>
            <div className="table-stack--head" style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr 90px', gap: 8, padding: '8px 12px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['Année', 'RRF', 'DRF', 'CAF brute', 'Encours dette', 'Désendet.'].map(h => (
                <p key={h} style={{ fontSize: 11, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</p>
              ))}
            </div>
            {scnProj.map((p, i) => (
              <div key={p.annee} className="table-stack" style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr 90px', gap: 8, padding: '8px 12px', borderBottom: i < scnProj.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: C.fg, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.annee}</span>
                <span style={{ color: C.fg }}>{fmtMontant(p.rrf)}</span>
                <span style={{ color: C.fg }}>{fmtMontant(p.drf)}</span>
                <span style={{ color: p.cafBrute >= 0 ? C.success : C.danger, fontWeight: 600 }}>{fmtMontant(p.cafBrute)}</span>
                <span style={{ color: C.fg }}>{fmtMontant(p.encoursDette)}</span>
                <Badge
                  label={p.cafBrute > 0 ? `${p.capaciteDesendettement} ans` : '∞'}
                  variant={p.capaciteDesendettement > 0 && p.capaciteDesendettement < 8 ? 'success' : p.capaciteDesendettement <= 12 ? 'warning' : 'danger'}
                />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Levier ± % ─────────────────────────────────────────────────────

function LeverPct({ label, base, value, onChange, invert }: {
  label: string
  base: number
  value?: number
  onChange: (v: number | undefined) => void
  invert?: boolean   // une hausse est défavorable (charges) → couleur inversée
}) {
  const pct = value ?? 0
  const euro = Math.round((pct / 100) * base)
  const favorable = invert ? euro <= 0 : euro >= 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: C.subtle }}>base {fmtMontant(base)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range" min={-20} max={20} step={0.5} value={pct}
          onChange={e => onChange(parseFloat(e.target.value) || undefined)}
          style={{ flex: 1, accentColor: C.green }}
        />
        <input
          type="number" step={0.5} value={value ?? ''} placeholder="0"
          onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          style={{ ...inputStyle, width: 64, height: 28 }}
        />
        <span style={{ fontSize: 12, color: C.subtle, width: 14 }}>%</span>
      </div>
      {pct !== 0 && (
        <p style={{ fontSize: 11, color: favorable ? C.success : C.danger, marginTop: 2 }}>
          {euro >= 0 ? '+' : ''}{fmtMontant(euro)} {invert ? 'sur les charges' : 'de recettes'}
        </p>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { useFactures } from '@/hooks/useFactures'
import { useFournisseurs } from '@/hooks/useFournisseurs'
import { useBudget, type CompteWithConsumption } from '@/hooks/useBudget'
import { useEcritures, isBalanced } from '@/hooks/useEcritures'
import { useTeam } from '@/hooks/useTeam'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { CHAPITRES_M14, COMPTE_LABEL, COMPTES_TIERS } from '@/lib/m14-plan'
import { computeRatios, ratioStatus } from '@/lib/ratios'
import { exportPlanComptable, exportGrandLivre, exportRapportBudgetaire } from '@/lib/excel-export'
import type { Section, Sens, Ecriture, JournalCode, LigneEcriture } from '@/lib/types'
import { HistoriqueView } from './HistoriqueView'
import { ProjectionView } from './ProjectionView'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtMontantDec = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

const JOURNAUX: Array<{ code: JournalCode; label: string }> = [
  { code: 'AC', label: 'Achats' },
  { code: 'BQ', label: 'Banque' },
  { code: 'OD', label: 'Opérations diverses' },
  { code: 'AN', label: 'Reports à nouveau' },
  { code: 'CA', label: 'Caisse' },
]

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

type BudgetTab = 'plan' | 'ecritures' | 'ratios' | 'historique' | 'projection'

export function BudgetM14View() {
  const { factures } = useFactures()
  const { fournisseurs } = useFournisseurs()
  const { postes, hydrated, computePosteWithConsumption, updatePoste, postesByChapitre } = useBudget()
  const { ecritures, addEcriture, deleteEcriture, ecrituresParCompte } = useEcritures()

  const [tab, setTab] = useState<BudgetTab>('plan')
  const [section, setSection] = useState<Section>('fonctionnement')
  const [drillCode, setDrillCode] = useState<string | null>(null)
  const [showEcritureForm, setShowEcritureForm] = useState(false)
  const [showRatiosConfig, setShowRatiosConfig] = useState(false)

  // Population & encours dette saisis par la commune (persistés en localStorage)
  const [population, setPopulation] = useState<number>(900)
  const [encoursDette, setEncoursDette] = useState<number>(0)

  // Charger les paramètres de ratios persistés (population, encours dette)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('ent-mairie:ratios-cfg:v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.population === 'number') setPopulation(parsed.population)
        if (typeof parsed.encoursDette === 'number') setEncoursDette(parsed.encoursDette)
      }
    } catch {}
  }, [])

  const saveRatiosCfg = (pop: number, enc: number) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('ent-mairie:ratios-cfg:v1', JSON.stringify({ population: pop, encoursDette: enc }))
    } catch {}
  }

  const enriched = useMemo(
    () => postes.map(p => computePosteWithConsumption(p, factures, ecritures)),
    [postes, factures, ecritures, computePosteWithConsumption],
  )

  const ratios = useMemo(
    () => computeRatios(enriched, population, encoursDette || undefined),
    [enriched, population, encoursDette],
  )

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      {/* KPI bar globale */}
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Recettes réelles fonct." value={fmtMontant(ratios.rrf)} sub="RRF cumulées" color={C.success} />
        <KpiCard label="Dépenses réelles fonct." value={fmtMontant(ratios.drf)} sub="DRF cumulées" color={C.warning} />
        <KpiCard
          label="CAF brute"
          value={fmtMontant(ratios.cafBrute)}
          sub={`Taux d'épargne ${ratios.tauxEpargneBrute}%`}
          color={ratios.cafBrute >= 0 ? C.success : C.danger}
        />
        <KpiCard
          label="Capacité désendettement"
          value={ratios.capaciteDesendettement === Infinity || ratios.cafBrute <= 0 ? '∞' : `${ratios.capaciteDesendettement} ans`}
          sub={ratios.capaciteDesendettement < 8 ? 'sain' : ratios.capaciteDesendettement <= 12 ? 'à surveiller' : 'critique'}
          color={ratios.capaciteDesendettement < 8 ? C.success : ratios.capaciteDesendettement <= 12 ? C.warning : C.danger}
        />
      </div>

      {/* Onglets sous-vue */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 10, padding: 4 }}>
          {([
            ['plan', '📋 Plan comptable'],
            ['ecritures', `📒 Écritures (${ecritures.length})`],
            ['ratios', '📊 Indicateurs'],
            ['historique', '📈 Historique'],
            ['projection', '🎯 Projection'],
          ] as [BudgetTab, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                background: v === tab ? '#fff' : 'transparent',
                border: 'none',
                color: v === tab ? C.fg : C.muted,
                fontSize: 14,
                fontWeight: v === tab ? 600 : 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: v === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button size="sm" onClick={() => exportPlanComptable(enriched)}>📊 Plan comptable .xlsx</Button>
        <Button size="sm" onClick={() => exportGrandLivre(ecritures)}>📒 Grand livre .xlsx</Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => exportRapportBudgetaire({ postes: enriched, ecritures, factures, fournisseurs, ratios })}
        >
          📑 Rapport complet .xlsx
        </Button>
      </div>

      {/* Contenu selon onglet */}
      {tab === 'plan' && (
        <PlanComptableView
          section={section}
          setSection={setSection}
          enriched={enriched}
          drillCode={drillCode}
          setDrillCode={setDrillCode}
          factures={factures}
          ecritures={ecritures}
          ecrituresParCompte={ecrituresParCompte}
          updatePoste={updatePoste}
          postesByChapitre={postesByChapitre}
        />
      )}

      {tab === 'ecritures' && (
        <EcrituresView
          ecritures={ecritures}
          showForm={showEcritureForm}
          setShowForm={setShowEcritureForm}
          onAdd={addEcriture}
          onDelete={deleteEcriture}
        />
      )}

      {tab === 'ratios' && (
        <RatiosView
          ratios={ratios}
          population={population}
          encoursDette={encoursDette}
          showConfig={showRatiosConfig}
          setShowConfig={setShowRatiosConfig}
          onSaveConfig={(pop, enc) => {
            setPopulation(pop)
            setEncoursDette(enc)
            saveRatiosCfg(pop, enc)
          }}
          enriched={enriched}
        />
      )}

      {tab === 'historique' && (
        <HistoriqueView currentRatios={ratios} />
      )}

      {tab === 'projection' && (
        <ProjectionView baseRatios={ratios} />
      )}
    </div>
  )
}

// ─── Onglet Plan comptable : sections / chapitres / articles + drill-down ─

function PlanComptableView({
  section, setSection, enriched, drillCode, setDrillCode,
  factures, ecritures, ecrituresParCompte, updatePoste, postesByChapitre,
}: {
  section: Section
  setSection: (s: Section) => void
  enriched: CompteWithConsumption[]
  drillCode: string | null
  setDrillCode: (c: string | null) => void
  factures: ReturnType<typeof useFactures>['factures']
  ecritures: Ecriture[]
  ecrituresParCompte: (code: string) => Ecriture[]
  updatePoste: ReturnType<typeof useBudget>['updatePoste']
  postesByChapitre: ReturnType<typeof useBudget>['postesByChapitre']
}) {
  const { fournisseurs } = useFournisseurs()

  const filtered = enriched.filter(p => p.section === section)

  // Totaux par section
  const totaux = useMemo(() => {
    const dep = filtered.filter(p => p.sens === 'D')
    const rec = filtered.filter(p => p.sens === 'R')
    return {
      depBudget: dep.reduce((acc, p) => acc + p.budgetAlloue, 0),
      depReal: dep.reduce((acc, p) => acc + p.consommationTotale, 0),
      recBudget: rec.reduce((acc, p) => acc + p.budgetAlloue, 0),
      recReal: rec.reduce((acc, p) => acc + p.consommationTotale, 0),
    }
  }, [filtered])

  const equilibre = totaux.recBudget - totaux.depBudget

  const drillCompte = drillCode ? enriched.find(p => p.code === drillCode) ?? null : null

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: drillCompte ? 2 : 3 }} padding={14}>
        {/* Sélecteur section */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 6, padding: 2 }}>
            {(['fonctionnement', 'investissement'] as Section[]).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: s === section ? '#fff' : 'transparent',
                  border: 'none',
                  color: s === section ? C.fg : C.muted,
                  fontSize: 12,
                  fontWeight: s === section ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'capitalize',
                }}
              >
                {s === 'fonctionnement' ? 'Section fonctionnement' : 'Section investissement'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', marginLeft: 6 }}>
            💡 Cliquez sur un article pour ouvrir son détail et modifier son budget alloué.
          </p>
        </div>

        {/* Récap section */}
        <div style={{ display: 'flex', gap: 12, padding: 10, background: C.bg, borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>Total dépenses</p>
            <p style={{ color: C.fg, fontWeight: 600 }}>{fmtMontant(totaux.depBudget)}</p>
            <p style={{ color: C.subtle, fontSize: 12 }}>Réalisé : {fmtMontant(totaux.depReal)}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>Total recettes</p>
            <p style={{ color: C.fg, fontWeight: 600 }}>{fmtMontant(totaux.recBudget)}</p>
            <p style={{ color: C.subtle, fontSize: 12 }}>Réalisé : {fmtMontant(totaux.recReal)}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>Équilibre budget</p>
            <p style={{ color: equilibre >= 0 ? C.success : C.danger, fontWeight: 700 }}>
              {equilibre >= 0 ? '+' : ''}{fmtMontant(equilibre)}
            </p>
            <p style={{ color: C.subtle, fontSize: 12 }}>{equilibre >= 0 ? 'excédentaire' : 'déficitaire'}</p>
          </div>
        </div>

        {/* Liste chapitres → articles */}
        {(['D', 'R'] as Sens[]).map(sens => {
          const chapitresOfThisSection = CHAPITRES_M14.filter(ch => ch.section === section && ch.sens === sens)
          if (chapitresOfThisSection.length === 0) return null
          return (
            <div key={sens} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: sens === 'D' ? C.warning : C.success, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sens === 'D' ? '↓ Dépenses' : '↑ Recettes'}
              </p>
              {chapitresOfThisSection.map(ch => {
                const articles = postesByChapitre.get(ch.code) ?? []
                const enrichedArticles = articles.map(a => enriched.find(p => p.code === a.code)).filter((p): p is CompteWithConsumption => !!p)
                if (enrichedArticles.length === 0) return null
                return (
                  <ChapitreSection
                    key={ch.code}
                    chapitre={ch}
                    articles={enrichedArticles}
                    drillCode={drillCode}
                    onSelect={setDrillCode}
                  />
                )
              })}
            </div>
          )
        })}
      </Card>

      {/* Panneau drill-down */}
      {drillCompte && (
        <Card style={{ flex: 1.5 }} padding={14}>
          <DrillDownPanel
            compte={drillCompte}
            factures={factures.filter(f => f.posteCode === drillCompte.code)}
            ecritures={ecrituresParCompte(drillCompte.code)}
            fournisseurs={fournisseurs}
            onClose={() => setDrillCode(null)}
            onUpdateBudget={(budget) => updatePoste(drillCompte.code, { budgetAlloue: budget })}
          />
        </Card>
      )}
    </div>
  )
}

// ─── Chapitre repliable affichant ses articles ────────────────────────

function ChapitreSection({
  chapitre, articles, drillCode, onSelect,
}: {
  chapitre: typeof CHAPITRES_M14[number]
  articles: CompteWithConsumption[]
  drillCode: string | null
  onSelect: (code: string) => void
}) {
  const [open, setOpen] = useState(true)
  const totalBudget = articles.reduce((acc, a) => acc + a.budgetAlloue, 0)
  const totalReal = articles.reduce((acc, a) => acc + a.consommationTotale, 0)
  const pct = totalBudget > 0 ? Math.round((totalReal / totalBudget) * 100) : 0

  return (
    <div style={{ marginBottom: 8, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '24px 50px 1fr 110px 110px 70px',
          gap: 8,
          alignItems: 'center',
          padding: '8px 10px',
          background: C.bg,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: 12, color: C.subtle }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 12, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Ch. {chapitre.code}</span>
        <span style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{chapitre.label}</span>
        <span style={{ fontSize: 12, color: C.subtle, textAlign: 'right' }}>{fmtMontant(totalBudget)}</span>
        <span style={{ fontSize: 12, color: C.fg, fontWeight: 600, textAlign: 'right' }}>{fmtMontant(totalReal)}</span>
        <span style={{ fontSize: 12, color: pct > 85 ? C.danger : pct > 65 ? C.warning : C.success, fontWeight: 600, textAlign: 'right' }}>{pct}%</span>
      </button>
      {open && (
        <div style={{ padding: '4px 0' }}>
          {articles.map(a => (
            <button
              key={a.code}
              onClick={() => onSelect(a.code)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '24px 80px 1fr 110px 110px 70px',
                gap: 8,
                alignItems: 'center',
                padding: '6px 10px',
                background: drillCode === a.code ? `${C.green}10` : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <span />
              <span style={{ fontSize: 12, color: C.subtle, fontFamily: "'JetBrains Mono', monospace" }}>{a.code}</span>
              <span style={{ fontSize: 12, color: C.fg }}>{a.label}</span>
              <span style={{ fontSize: 12, color: C.subtle, textAlign: 'right' }}>{fmtMontant(a.budgetAlloue)}</span>
              <span style={{ fontSize: 12, color: C.fg, fontWeight: 500, textAlign: 'right' }}>{fmtMontant(a.consommationTotale)}</span>
              <span style={{ fontSize: 12, color: a.pctConsomme > 85 ? C.danger : a.pctConsomme > 65 ? C.warning : C.success, fontWeight: 600, textAlign: 'right' }}>
                {a.pctConsomme}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Panneau drill-down d'un article comptable ─────────────────────────

function DrillDownPanel({
  compte, factures, ecritures, fournisseurs, onClose, onUpdateBudget,
}: {
  compte: CompteWithConsumption
  factures: ReturnType<typeof useFactures>['factures']
  ecritures: Ecriture[]
  fournisseurs: ReturnType<typeof useFournisseurs>['fournisseurs']
  onClose: () => void
  onUpdateBudget: (budget: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [budgetVal, setBudgetVal] = useState(String(compte.budgetAlloue))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {compte.section} · {compte.sens === 'D' ? 'Dépense' : 'Recette'} · Chap. {compte.chapitreCode}
          </p>
          <p style={{ fontSize: 12, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{compte.code}</p>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 700 }}>{compte.label}</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.subtle, fontSize: 18, padding: 0 }}>×</button>
      </div>
      <Separator my={10} />

      {/* KPI compte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ padding: 8, background: editing ? `${C.green}10` : C.bg, borderRadius: 6, border: `1px solid ${editing ? C.green : 'transparent'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>Budget alloué</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                title="Modifier le budget alloué"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.green, fontSize: 12, padding: 0 }}
              >✎</button>
            )}
          </div>
          {editing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="number"
                value={budgetVal}
                onChange={e => setBudgetVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateBudget(parseFloat(budgetVal) || 0); setEditing(false) }
                  if (e.key === 'Escape') { setBudgetVal(String(compte.budgetAlloue)); setEditing(false) }
                }}
                style={{ ...inputStyle, height: 24, fontSize: 12 }}
                autoFocus
              />
              <button
                onClick={() => { onUpdateBudget(parseFloat(budgetVal) || 0); setEditing(false) }}
                title="Valider (Entrée)"
                style={{ padding: '0 6px', fontSize: 12, background: C.success, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
              >✓</button>
              <button
                onClick={() => { setBudgetVal(String(compte.budgetAlloue)); setEditing(false) }}
                title="Annuler (Échap)"
                style={{ padding: '0 6px', fontSize: 12, background: C.bg, color: C.subtle, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer' }}
              >×</button>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: C.fg, fontWeight: 700, cursor: 'pointer' }} onClick={() => setEditing(true)} title="Cliquer pour modifier">
              {fmtMontant(compte.budgetAlloue)}
            </p>
          )}
        </div>
        <div style={{ padding: 8, background: C.bg, borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>Réalisé</p>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 700 }}>{fmtMontant(compte.consommationTotale)}</p>
        </div>
        <div style={{ padding: 8, background: C.bg, borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>Reste à engager</p>
          <p style={{ fontSize: 14, color: compte.reste >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtMontant(compte.reste)}</p>
        </div>
        <div style={{ padding: 8, background: C.bg, borderRadius: 6 }}>
          <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>% consommé</p>
          <p style={{ fontSize: 14, color: compte.pctConsomme > 85 ? C.danger : compte.pctConsomme > 65 ? C.warning : C.success, fontWeight: 700 }}>{compte.pctConsomme}%</p>
        </div>
      </div>
      <Progress pct={compte.pctConsomme} />

      <Separator my={10} />

      {/* Décomposition */}
      <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Décomposition du réalisé
      </p>
      <div style={{ fontSize: 12, color: C.fg, lineHeight: 1.6, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: C.subtle }}>Conso. initiale (avant app)</span>
          <span>{fmtMontantDec(compte.consoInitiale)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: C.subtle }}>Factures validées</span>
          <span>{fmtMontantDec(compte.consoFactures)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: C.subtle }}>Écritures comptables</span>
          <span>{fmtMontantDec(compte.consoEcritures)}</span>
        </div>
      </div>

      {/* Factures imputées */}
      <SectionHeader title={`Factures imputées (${factures.length})`} />
      {factures.length === 0 ? (
        <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '6px 0' }}>Aucune facture sur ce compte.</p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {factures.map(f => {
            const four = fournisseurs.find(x => x.id === f.fournisseurId)
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle, minWidth: 90 }}>{f.numero}</span>
                <span style={{ flex: 1, color: C.fg }}>{four?.nom ?? '—'}</span>
                <span style={{ color: C.subtle, minWidth: 50 }}>{fmtDate(f.dateFacture)}</span>
                <span style={{ color: C.fg, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>{fmtMontant(f.montantTTC)}</span>
                <Badge label={f.statut === 'En attente validation' ? 'En attente' : f.statut} variant={f.statut === 'Validée' ? 'success' : f.statut === 'Rejetée' ? 'danger' : 'warning'} />
              </div>
            )
          })}
        </div>
      )}

      {/* Écritures */}
      <SectionHeader title={`Écritures comptables (${ecritures.length})`} />
      {ecritures.length === 0 ? (
        <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '6px 0' }}>Aucune écriture sur ce compte.</p>
      ) : (
        <div>
          {ecritures.map(e => {
            const ligne = e.lignes.find(l => l.compteCode === compte.code)
            const isDebit = (ligne?.debit ?? 0) > 0
            const montant = isDebit ? ligne!.debit : ligne!.credit
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle, minWidth: 50 }}>#{e.numero}</span>
                <Tag label={e.journal} color={C.slate} />
                <span style={{ flex: 1, color: C.fg }}>{e.libelle}</span>
                <span style={{ color: C.subtle, minWidth: 50 }}>{fmtDate(e.date)}</span>
                <span style={{ color: isDebit ? C.warning : C.success, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                  {isDebit ? '-' : '+'}{fmtMontant(montant)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Onglet Écritures comptables ──────────────────────────────────────

function EcrituresView({
  ecritures, showForm, setShowForm, onAdd, onDelete,
}: {
  ecritures: Ecriture[]
  showForm: boolean
  setShowForm: (b: boolean) => void
  onAdd: ReturnType<typeof useEcritures>['addEcriture']
  onDelete: (id: string) => void
}) {
  const { currentUserId } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [journalFilter, setJournalFilter] = useState<JournalCode | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ecritures.filter(e => {
      if (journalFilter !== 'all' && e.journal !== journalFilter) return false
      if (!q) return true
      return (
        e.libelle.toLowerCase().includes(q) ||
        (e.pieceRef ?? '').toLowerCase().includes(q) ||
        e.lignes.some(l => l.compteCode.toLowerCase().includes(q) || (l.libelle ?? '').toLowerCase().includes(q))
      )
    })
  }, [ecritures, search, journalFilter])

  return (
    <div>
      {/* Barre filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher (libellé, compte, pièce…)"
          style={{ ...inputStyle, width: 280 }}
        />
        <select value={journalFilter} onChange={e => setJournalFilter(e.target.value as JournalCode | 'all')} style={{ ...inputStyle, width: 180 }}>
          <option value="all">Tous les journaux</option>
          {JOURNAUX.map(j => (
            <option key={j.code} value={j.code}>{j.code} — {j.label}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>+ Nouvelle écriture</Button>
      </div>

      {showForm && (
        <NewEcritureForm
          onSubmit={(data) => {
            const e = onAdd({ ...data, createdBy: currentUserId })
            if (e) setShowForm(false)
            else alert('Écriture non équilibrée — la somme des débits doit égaler la somme des crédits.')
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Liste écritures */}
      {filtered.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.subtle }}>
            {ecritures.length === 0
              ? 'Aucune écriture pour le moment. Validez une facture ou créez-en une manuellement.'
              : 'Aucune écriture ne correspond à votre recherche.'}
          </p>
        </Card>
      ) : (
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 70px 60px 1fr 100px 100px 100px 60px', padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['N°', 'Date', 'Journal', 'Libellé / Pièce', 'Comptes', 'Débit', 'Crédit', ''].map(h => (
              <p key={h} style={{ fontSize: 12, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {filtered.map((e, i) => {
            const totalD = e.lignes.reduce((acc, l) => acc + l.debit, 0)
            const totalC = e.lignes.reduce((acc, l) => acc + l.credit, 0)
            const balanced = isBalanced(e.lignes)
            return (
              <div key={e.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 70px 60px 1fr 100px 100px 100px 60px', padding: '8px 14px', alignItems: 'center', fontSize: 12 }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle }}>#{e.numero}</p>
                  <p style={{ color: C.subtle }}>{fmtDate(e.date)}</p>
                  <Tag label={e.journal} color={C.slate} />
                  <div>
                    <p style={{ color: C.fg, fontWeight: 500 }}>{e.libelle}</p>
                    {e.pieceRef && <p style={{ fontSize: 11, color: C.subtle }}>Pièce: {e.pieceRef}</p>}
                  </div>
                  <p style={{ color: C.subtle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {e.lignes.map(l => l.compteCode).join(' · ')}
                  </p>
                  <p style={{ color: C.fg, fontWeight: 600, textAlign: 'right' }}>{fmtMontantDec(totalD)}</p>
                  <p style={{ color: C.fg, fontWeight: 600, textAlign: 'right' }}>{fmtMontantDec(totalC)}</p>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 14, color: balanced ? C.success : C.danger }} title={balanced ? 'Équilibrée' : 'Non équilibrée'}>
                      {balanced ? '✓' : '⚠'}
                    </span>
                    <button
                      onClick={() => { if (confirm('Supprimer cette écriture ?')) onDelete(e.id) }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 12 }}
                      title="Supprimer"
                    >×</button>
                  </div>
                </div>
                {/* Détail des lignes */}
                <div style={{ paddingLeft: 28, paddingRight: 14, paddingBottom: 8, fontSize: 12, color: C.subtle }}>
                  {e.lignes.map(l => (
                    <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 100px 60px', gap: 6, padding: '2px 0' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{l.compteCode}</span>
                      <span>{COMPTE_LABEL[l.compteCode] ?? l.libelle ?? ''}</span>
                      <span style={{ textAlign: 'right' }}>{l.debit > 0 ? fmtMontantDec(l.debit) : '—'}</span>
                      <span style={{ textAlign: 'right' }}>{l.credit > 0 ? fmtMontantDec(l.credit) : '—'}</span>
                      <span />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── Formulaire de saisie d'écriture (multi-lignes) ───────────────────

function NewEcritureForm({ onSubmit, onCancel }: {
  onSubmit: (data: {
    date: string
    journal: JournalCode
    libelle: string
    pieceRef?: string
    lignes: Array<Omit<LigneEcriture, 'id'>>
  }) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [journal, setJournal] = useState<JournalCode>('OD')
  const [libelle, setLibelle] = useState('')
  const [pieceRef, setPieceRef] = useState('')
  const [lignes, setLignes] = useState<Array<{ compteCode: string; libelle: string; debit: string; credit: string }>>([
    { compteCode: '', libelle: '', debit: '', credit: '' },
    { compteCode: '', libelle: '', debit: '', credit: '' },
  ])

  const totalD = lignes.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0)
  const totalC = lignes.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0)
  const equilibre = Math.abs(totalD - totalC) < 0.01 && totalD > 0
  const valid = libelle.trim() && date && lignes.every(l => l.compteCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)) && equilibre

  const updateLigne = (i: number, patch: Partial<typeof lignes[0]>) => {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }
  const addLigne = () => setLignes(prev => [...prev, { compteCode: '', libelle: '', debit: '', credit: '' }])
  const removeLigne = (i: number) => {
    if (lignes.length <= 2) return
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title="Nouvelle écriture comptable" />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 160px 1fr 160px', gap: 10, marginBottom: 12 }}>
        <Field label="Date *">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Journal *">
          <select value={journal} onChange={e => setJournal(e.target.value as JournalCode)} style={inputStyle}>
            {JOURNAUX.map(j => <option key={j.code} value={j.code}>{j.code} — {j.label}</option>)}
          </select>
        </Field>
        <Field label="Libellé *">
          <input type="text" value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="ex: Facture EDF avril" style={inputStyle} />
        </Field>
        <Field label="Pièce / mandat">
          <input type="text" value={pieceRef} onChange={e => setPieceRef(e.target.value)} placeholder="ex: M-2026-128" style={inputStyle} />
        </Field>
      </div>

      {/* Lignes */}
      <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lignes d'écriture</p>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px 110px 30px', gap: 6, marginBottom: 6, fontSize: 11, color: C.subtle, fontWeight: 600 }}>
        <span>COMPTE</span>
        <span>LIBELLÉ</span>
        <span style={{ textAlign: 'right' }}>DÉBIT</span>
        <span style={{ textAlign: 'right' }}>CRÉDIT</span>
        <span />
      </div>
      {lignes.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px 110px 30px', gap: 6, marginBottom: 4 }}>
          <input
            type="text"
            value={l.compteCode}
            onChange={e => updateLigne(i, { compteCode: e.target.value })}
            placeholder="ex: 60611"
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            list="compte-suggestions"
          />
          <input
            type="text"
            value={l.libelle}
            onChange={e => updateLigne(i, { libelle: e.target.value })}
            placeholder={l.compteCode && COMPTE_LABEL[l.compteCode] ? COMPTE_LABEL[l.compteCode] : 'précision libre'}
            style={inputStyle}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={l.debit}
            onChange={e => updateLigne(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })}
            placeholder="0,00"
            style={{ ...inputStyle, textAlign: 'right' }}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={l.credit}
            onChange={e => updateLigne(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })}
            placeholder="0,00"
            style={{ ...inputStyle, textAlign: 'right' }}
          />
          <button
            onClick={() => removeLigne(i)}
            disabled={lignes.length <= 2}
            style={{ background: 'transparent', border: 'none', cursor: lignes.length > 2 ? 'pointer' : 'not-allowed', color: lignes.length > 2 ? C.danger : C.subtle, fontSize: 14 }}
            title="Retirer la ligne"
          >×</button>
        </div>
      ))}

      <datalist id="compte-suggestions">
        {Object.entries(COMPTE_LABEL).slice(0, 200).map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </datalist>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Button size="sm" onClick={addLigne}>+ Ligne</Button>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.subtle }}>Totaux :</span>
          <span style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>D {fmtMontantDec(totalD)}</span>
          <span style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>C {fmtMontantDec(totalC)}</span>
          <span style={{ fontSize: 12, color: equilibre ? C.success : C.danger, fontWeight: 700 }}>
            {equilibre ? '✓ Équilibrée' : `⚠ Écart ${fmtMontantDec(Math.abs(totalD - totalC))}`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            date,
            journal,
            libelle: libelle.trim(),
            pieceRef: pieceRef.trim() || undefined,
            lignes: lignes.map(l => ({
              compteCode: l.compteCode.trim(),
              libelle: l.libelle.trim() || undefined,
              debit: parseFloat(l.debit) || 0,
              credit: parseFloat(l.credit) || 0,
            })),
          })}
        >
          Enregistrer l'écriture
        </Button>
      </div>
    </Card>
  )
}

// ─── Onglet Ratios & analyse financière ─────────────────────────────

function RatiosView({
  ratios, population, encoursDette, showConfig, setShowConfig, onSaveConfig, enriched,
}: {
  ratios: ReturnType<typeof computeRatios>
  population: number
  encoursDette: number
  showConfig: boolean
  setShowConfig: (b: boolean) => void
  onSaveConfig: (pop: number, enc: number) => void
  enriched: CompteWithConsumption[]
}) {
  const [popVal, setPopVal] = useState(String(population))
  const [encVal, setEncVal] = useState(String(encoursDette))

  const ratioCards: Array<{ key: keyof typeof ratios; label: string; value: string; sub?: string }> = [
    { key: 'ratio1_drfParHab', label: 'DRF / habitant', value: `${ratios.ratio1_drfParHab} €`, sub: 'Ratio R. 2313-1 n°1' },
    { key: 'ratio2_produitImpotsDirectsParHab', label: 'Impôts directs / hab.', value: `${ratios.ratio2_produitImpotsDirectsParHab} €`, sub: 'Ratio n°2' },
    { key: 'ratio3_rrfParHab', label: 'RRF / habitant', value: `${ratios.ratio3_rrfParHab} €`, sub: 'Ratio n°3' },
    { key: 'ratio4_equipementParHab', label: 'Équipement brut / hab.', value: `${ratios.ratio4_equipementParHab} €`, sub: 'Ratio n°4' },
    { key: 'ratio5_encoursDetteParHab', label: 'Encours dette / hab.', value: `${ratios.ratio5_encoursDetteParHab} €`, sub: 'Ratio n°5' },
    { key: 'ratio6_dgfParHab', label: 'DGF / habitant', value: `${ratios.ratio6_dgfParHab} €`, sub: 'Ratio n°6' },
    { key: 'ratio7_personnelSurDrf', label: 'Personnel / DRF', value: `${ratios.ratio7_personnelSurDrf}%`, sub: 'Ratio n°7' },
    { key: 'ratio9_rigidite', label: 'Coefficient de rigidité', value: `${ratios.ratio9_rigidite}%`, sub: '(DRF + remb. dette) / RRF' },
    { key: 'ratio10_equipementSurRrf', label: 'Équipement / RRF', value: `${ratios.ratio10_equipementSurRrf}%`, sub: 'Ratio n°10' },
    { key: 'ratio11_detteSurRrf', label: 'Encours dette / RRF', value: `${ratios.ratio11_detteSurRrf}%`, sub: 'Ratio n°11' },
  ]

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <div style={{ flex: 3 }}>
        {/* Indicateurs d'analyse financière */}
        <Card padding={14} style={{ marginBottom: 'var(--gap)' }}>
          <SectionHeader title="Indicateurs d'analyse financière" actions={<Button size="sm" onClick={() => setShowConfig(!showConfig)}>⚙ Configurer</Button>} />
          {showConfig && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12, padding: 10, background: C.bg, borderRadius: 6 }}>
              <Field label="Population (hab.)">
                <input type="number" value={popVal} onChange={e => setPopVal(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Encours dette (€) — laisser 0 pour estimer">
                <input type="number" value={encVal} onChange={e => setEncVal(e.target.value)} placeholder={`Auto: ${fmtMontant(ratios.encoursDette)}`} style={inputStyle} />
              </Field>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onSaveConfig(parseInt(popVal, 10) || 900, parseFloat(encVal) || 0)
                  setShowConfig(false)
                }}
              >Enregistrer</Button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <RatioBlock helpKey="epargneGestion" label="Épargne de gestion" value={fmtMontant(ratios.epargneGestion)} sub="RRF (hors except.) − DRF (hors except. & int.)" color={ratios.epargneGestion >= 0 ? C.success : C.danger} />
            <RatioBlock helpKey="cafBrute" label="CAF brute" value={fmtMontant(ratios.cafBrute)} sub="RRF − DRF" color={ratios.cafBrute >= 0 ? C.success : C.danger} />
            <RatioBlock helpKey="cafNette" label="CAF nette" value={fmtMontant(ratios.cafNette)} sub="CAF brute − remb. capital" color={ratios.cafNette >= 0 ? C.success : C.warning} />
            <RatioBlock
              helpKey="tauxEpargneBrute"
              label="Taux d'épargne brute"
              value={`${ratios.tauxEpargneBrute}%`}
              sub={ratios.tauxEpargneBrute > 12 ? 'sain (> 12%)' : ratios.tauxEpargneBrute >= 8 ? 'à surveiller' : 'faible (< 8%)'}
              color={ratioStatus('tauxEpargneBrute', ratios.tauxEpargneBrute) === 'good' ? C.success : ratioStatus('tauxEpargneBrute', ratios.tauxEpargneBrute) === 'warning' ? C.warning : C.danger}
            />
            <RatioBlock
              helpKey="capaciteDesendettement"
              label="Capacité de désendettement"
              value={ratios.capaciteDesendettement === 0 && ratios.cafBrute <= 0 ? '∞' : `${ratios.capaciteDesendettement} ans`}
              sub={ratios.capaciteDesendettement < 8 ? 'sain' : ratios.capaciteDesendettement <= 12 ? 'surveillance' : 'critique'}
              color={ratioStatus('capaciteDesendettement', ratios.capaciteDesendettement) === 'good' ? C.success : ratioStatus('capaciteDesendettement', ratios.capaciteDesendettement) === 'warning' ? C.warning : C.danger}
            />
            <RatioBlock helpKey="encoursDette" label="Encours de dette" value={fmtMontant(ratios.encoursDette)} sub={encoursDette > 0 ? 'saisi' : 'estimé (10 × remb. annuel)'} color={C.slate} />
          </div>
        </Card>

        {/* Ratios obligatoires R. 2313-1 */}
        <Card padding={14}>
          <SectionHeader title="Ratios obligatoires (article R. 2313-1 CGCT)" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 12 }}>
            Ratios à publier en annexe au compte administratif et au budget primitif. Population : {ratios.population} hab.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ratioCards.map(r => {
              const status = ratioStatus(r.key, ratios[r.key] as number)
              const color = status === 'good' ? C.success : status === 'warning' ? C.warning : C.danger
              return (
                <div key={String(r.key)} style={{ padding: 10, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 6, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</p>
                    <InfoTooltip indicatorKey={String(r.key)} />
                  </div>
                  <p style={{ fontSize: 16, color: C.fg, fontWeight: 700 }}>{r.value}</p>
                  {r.sub && <p style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>{r.sub}</p>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Panneau résumé */}
      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 700, marginBottom: 10 }}>Ventilation des recettes</p>
          <VentilationBar parts={[
            { label: 'Impôts & taxes', value: ratios.produits73, color: C.green },
            { label: 'Dotations', value: ratios.produits74, color: C.info },
            { label: 'Autres', value: Math.max(0, ratios.rrf - ratios.produits73 - ratios.produits74), color: C.slate },
          ]} />
        </Card>

        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 700, marginBottom: 10 }}>Ventilation des dépenses</p>
          <VentilationBar parts={[
            { label: 'Personnel (chap. 012)', value: ratios.charges012, color: C.slate },
            { label: 'Charges générales (011)', value: ratios.charges011, color: C.green },
            { label: 'Intérêts (66)', value: ratios.charges66, color: C.warning },
            { label: 'Autres', value: Math.max(0, ratios.drf - ratios.charges011 - ratios.charges012 - ratios.charges66), color: C.terra },
          ]} />
        </Card>

        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 700, marginBottom: 10 }}>Postes budgétaires en alerte</p>
          {(() => {
            const alertes = enriched.filter(p => p.enAlerte).sort((a, b) => b.pctConsomme - a.pctConsomme).slice(0, 6)
            if (alertes.length === 0) return <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun poste en alerte 👌</p>
            return alertes.map(p => (
              <div key={p.code} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p.code} {p.label}</p>
                  <p style={{ fontSize: 12, color: p.pctConsomme > 95 ? C.danger : C.warning, fontWeight: 700 }}>{p.pctConsomme}%</p>
                </div>
                <Progress pct={p.pctConsomme} />
              </div>
            ))
          })()}
        </Card>
      </div>
    </div>
  )
}

function RatioBlock({ label, value, sub, color, helpKey }: { label: string; value: string; sub?: string; color: string; helpKey?: string }) {
  return (
    <div style={{ padding: 12, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        {helpKey && <InfoTooltip indicatorKey={helpKey} />}
      </div>
      <p style={{ fontSize: 18, color, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function VentilationBar({ parts }: { parts: Array<{ label: string; value: number; color: string }> }) {
  const total = parts.reduce((acc, p) => acc + p.value, 0)
  if (total === 0) {
    return <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucune donnée.</p>
  }
  return (
    <>
      <div style={{ height: 8, background: C.ph, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
        {parts.map((p, i) => (
          <div key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label} : ${fmtMontant(p.value)}`} />
        ))}
      </div>
      {parts.map((p, i) => {
        const pct = Math.round((p.value / total) * 100)
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{p.label}</p>
            <p style={{ fontSize: 12, color: C.subtle }}>{fmtMontant(p.value)}</p>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{pct}%</p>
          </div>
        )
      })}
    </>
  )
}

// ─── Helper UI ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

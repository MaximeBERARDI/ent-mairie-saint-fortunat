'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { FACTURES } from '@/lib/data'

type FinView = 'factures' | 'budget' | 'fournisseurs'

export default function FinancesPage() {
  const [view, setView] = useState<FinView>('factures')

  return (
    <Shell title="Finances">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['factures', 'Factures'], ['budget', 'Budget'], ['fournisseurs', 'Fournisseurs']] as [FinView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, background: v === view ? '#fff' : 'transparent', border: 'none', color: v === view ? C.fg : C.muted, fontSize: 12, fontWeight: v === view ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'factures' && <FacturesView />}
      {view === 'budget' && <BudgetView />}
      {view === 'fournisseurs' && <FournisseursView />}
    </Shell>
  )
}

function FacturesView() {
  const [selected, setSelected] = useState(FACTURES[0])
  const [filter, setFilter] = useState<'toutes' | 'attente' | 'validees' | 'rejetees'>('toutes')

  const filtered = FACTURES.filter(f => {
    if (filter === 'attente') return f.statut === 'En attente'
    if (filter === 'validees') return f.statut === 'Validée'
    if (filter === 'rejetees') return f.statut === 'Rejetée'
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="En attente validation" value="2" sub="1 627 € à valider" color={C.warning} />
        <KpiCard label="Validées ce mois" value="8" sub="12 340 € imputés" color={C.success} />
        <KpiCard label="Rejetées" value="1" sub="commentaire requis" color={C.danger} />
        <KpiCard label="Total dépensé / mois" value="13 967 €" sub="sur budget engagé" color={C.slate} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <div style={{ flex: 3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            {([['toutes', 'Toutes'], ['attente', 'En attente (2)'], ['validees', 'Validées'], ['rejetees', 'Rejetées']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 20, background: v === filter ? C.green : '#fff', border: `1px solid ${v === filter ? C.green : C.border}`, color: v === filter ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filter ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="sm">+ Soumettre une facture</Button>
          </div>

          <Card padding={0}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1.2fr 0.7fr 0.9fr 0.8fr', padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['N°', 'Fournisseur', 'Montant', 'Poste comptable', 'Date', 'Statut', 'Action'].map(h => (
                <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
              ))}
            </div>
            {filtered.map((f, i) => (
              <div key={i} onClick={() => setSelected(f)} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1.2fr 0.7fr 0.9fr 0.8fr', padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: selected.id === f.id ? `${C.green}06` : (f.statut === 'En attente' ? `${C.warning}06` : '#fff'), alignItems: 'center', cursor: 'pointer' }}>
                <p style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace" }}>{f.id}</p>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{f.fournisseur}</p>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{f.montant}</p>
                <Tag label={f.poste} color={C.slate} />
                <p style={{ fontSize: 11, color: C.subtle }}>{f.date}</p>
                <Badge label={f.statut} variant={f.statut === 'En attente' ? 'warning' : f.statut === 'Validée' ? 'success' : 'danger'} />
                {f.statut === 'En attente'
                  ? <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.success}`, background: C.successLight, color: C.success, cursor: 'pointer', fontSize: 12 }}>✓</button>
                      <button style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  : <Button size="sm">Voir</Button>
                }
              </div>
            ))}
          </Card>
        </div>

        {/* Detail */}
        <Card style={{ flex: 1.8 }} padding={14}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 6 }}>{selected.id} — {selected.fournisseur.split(' ')[0]}</p>
          <Badge label={selected.statut} variant={selected.statut === 'En attente' ? 'warning' : selected.statut === 'Validée' ? 'success' : 'danger'} />
          <Separator my={12} />
          {[['Fournisseur', selected.fournisseur], ['Montant TTC', selected.montant], ['Poste', selected.poste], ['Date', selected.date], ['Soumis par', 'Pierre Roche']].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
              <p style={{ fontSize: 10, color: C.subtle, width: 90, flexShrink: 0 }}>{k}</p>
              <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
            </div>
          ))}
          <Separator my={12} />
          <div style={{ height: 80, background: C.ph, borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Aperçu de la facture</span>
          </div>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Commentaire (obligatoire si rejet)</p>
          <textarea
            placeholder="Votre commentaire…"
            style={{ width: '100%', height: 56, border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, fontSize: 12, resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: C.fg, marginBottom: 10 }}
          />
          {selected.statut === 'En attente' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="primary" style={{ flex: 1, justifyContent: 'center' }}>Valider</Button>
              <Button variant="danger" style={{ flex: 1, justifyContent: 'center' }}>Rejeter</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function BudgetView() {
  const cats = [
    { cat: 'Dépenses de personnel', postes: [
      { code: '6411', label: 'Salaires titulaires', budget: 130000, conso: 60800, pct: 46 },
      { code: '6413', label: 'Salaires contractuels', budget: 32000, conso: 14800, pct: 46 },
      { code: '6451', label: 'Cotisations URSSAF', budget: 28000, conso: 13000, pct: 46 },
    ]},
    { cat: 'Dépenses de fonctionnement', postes: [
      { code: '60611', label: 'Énergie — électricité', budget: 18000, conso: 6240, pct: 34 },
      { code: '60612', label: 'Eau & assainissement', budget: 5000, conso: 1548, pct: 31 },
    ]},
    { cat: "Dépenses d'équipement & travaux", postes: [
      { code: '2315', label: 'Voirie — travaux', budget: 95000, conso: 68400, pct: 72 },
      { code: '2313', label: 'Bâtiments communaux', budget: 42000, conso: 37380, pct: 89 },
      { code: '2188', label: 'Matériels divers', budget: 12000, conso: 3600, pct: 30 },
    ]},
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Budget total 2026" value="380 000 €" color={C.slate} />
        <KpiCard label="Consommé" value="159 600 €" sub="42% du budget" color={C.green} />
        <KpiCard label="Reste à engager" value="220 400 €" color={C.muted} />
        <KpiCard label="Postes en alerte" value="2" sub="> 80% consommés" color={C.danger} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 3 }} padding={16}>
          <SectionHeader title="Plan comptable — Suivi par poste budgétaire" actions={<><Button size="sm">Rapport</Button><Button size="sm">Exporter</Button></>} />
          {cats.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: C.slate, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.cat}</p>
              {cat.postes.map((p, pi) => (
                <div key={pi} style={{ display: 'grid', gridTemplateColumns: '0.6fr 2fr 1fr 1.5fr 0.8fr', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 10, color: C.subtle, fontFamily: "'JetBrains Mono', monospace" }}>{p.code}</p>
                  <p style={{ fontSize: 12, color: C.fg }}>{p.label}</p>
                  <p style={{ fontSize: 11, color: C.subtle }}>{p.budget.toLocaleString()} €</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}><Progress pct={p.pct} /></div>
                    <p style={{ fontSize: 11, color: p.pct > 85 ? C.danger : p.pct > 65 ? C.warning : C.success, fontWeight: 600, minWidth: 34 }}>{p.pct}%</p>
                  </div>
                  <p style={{ fontSize: 11, color: C.fg, fontWeight: 600 }}>{p.conso.toLocaleString()} €</p>
                </div>
              ))}
            </div>
          ))}
        </Card>

        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <p style={{ fontSize: 12, color: C.fg, fontWeight: 700, marginBottom: 10 }}>Synthèse globale</p>
            <div style={{ height: 100, background: C.ph, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: C.subtle }}>Graphique : 42% consommé</span>
            </div>
            {[['Personnel', '50%', C.slate], ['Fonct.', '10%', C.green], ['Équipement', '40%', C.terra]].map(([l, p, c], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: String(c) }} />
                <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{l}</p>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{p}</p>
              </div>
            ))}
          </Card>
          <Card padding={14}>
            <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 10 }}>⚠ Postes en alerte</p>
            {[{ label: 'Bâtiments communaux', pct: 89, budget: '42 000 €' }, { label: 'Voirie — travaux', pct: 72, budget: '95 000 €' }].map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{p.label}</p>
                  <p style={{ fontSize: 11, color: p.pct > 85 ? C.danger : C.warning, fontWeight: 700 }}>{p.pct}%</p>
                </div>
                <Progress pct={p.pct} />
                <p style={{ fontSize: 9, color: C.subtle, marginTop: 2 }}>{p.budget} alloués</p>
              </div>
            ))}
          </Card>
          <Button style={{ width: '100%', justifyContent: 'center' }}>Générer rapport budgétaire</Button>
        </div>
      </div>
    </div>
  )
}

function FournisseursView() {
  const suppliers = [
    { name: 'EDF Collectivités', total: '14 880 €', cat: 'Énergie', active: true },
    { name: 'SAUR — Eau potable', total: '4 644 €', cat: 'Eau', active: false },
    { name: 'Matériaux du Vivarais', total: '68 400 €', cat: 'Travaux', active: false },
    { name: 'Signaux Girod', total: '3 680 €', cat: 'Voirie', active: false },
    { name: 'La Poste Pro', total: '1 740 €', cat: 'Courrier', active: false },
    { name: 'OVHcloud', total: '960 €', cat: 'Informatique', active: false },
    { name: 'Communauté de Communes', total: '8 200 €', cat: 'Partenariat', active: false },
  ]

  const [selected, setSelected] = useState(suppliers[0])

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: 'calc(100vh - 160px)' }}>
      {/* Supplier list */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ width: '100%', height: 34, border: `1px solid ${C.border}`, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Rechercher un fournisseur…</span>
          </div>
          <Button size="sm" style={{ width: '100%', justifyContent: 'center' }}>+ Nouveau fournisseur</Button>
        </div>
        {suppliers.map((s, i) => (
          <div key={i} onClick={() => setSelected(s)} style={{ padding: '9px 10px', borderRadius: 6, cursor: 'pointer', background: selected.name === s.name ? 'var(--accent-light)' : 'transparent', border: `1px solid ${selected.name === s.name ? 'var(--accent)' : C.border}`, marginBottom: 4 }}>
            <p style={{ fontSize: 12, color: selected.name === s.name ? 'var(--accent)' : C.fg, fontWeight: selected.name === s.name ? 600 : 400 }}>{s.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Tag label={s.cat} color={selected.name === s.name ? C.green : C.slate} />
              <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600 }}>{s.total}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Avatar initials={selected.name.slice(0, 3).toUpperCase()} size={36} color={C.warning} />
              <div>
                <p style={{ fontSize: 17, color: C.fg, fontWeight: 700 }}>{selected.name}</p>
                <p style={{ fontSize: 11, color: C.subtle }}>Fournisseur · {selected.cat} — Compte 60611</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm">Modifier</Button>
            <Button variant="primary" size="sm">+ Facture</Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--gap)' }}>
          <KpiCard label="Total facturé 2026" value="14 880 €" />
          <KpiCard label="En attente" value="1 240 €" color={C.warning} />
          <KpiCard label="Dernière facture" value="28 avr." color={C.slate} />
        </div>

        <Card padding={14}>
          <SectionHeader title="Historique des factures" />
          {[
            { id: 'FAC-2026-042', montant: '1 240 €', date: '28 avr.', statut: 'En attente' as const },
            { id: 'FAC-2026-035', montant: '1 240 €', date: '31 mars', statut: 'Validée' as const },
            { id: 'FAC-2026-021', montant: '1 240 €', date: '28 fév.', statut: 'Validée' as const },
            { id: 'FAC-2026-008', montant: '1 240 €', date: '31 jan.', statut: 'Validée' as const },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <p style={{ fontSize: 11, color: C.subtle, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{f.id}</p>
              <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{f.montant}</p>
              <p style={{ fontSize: 11, color: C.subtle }}>{f.date}</p>
              <Badge label={f.statut} variant={f.statut === 'En attente' ? 'warning' : 'success'} />
              <Button size="sm">Voir</Button>
            </div>
          ))}
        </Card>

        <Card padding={14}>
          <SectionHeader title="Coordonnées & infos contrat" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['SIRET', '552 081 317 04116'], ['N° client', 'COL-SFE-2019-004'], ['Contact', 'edf-collectivites.fr'], ['Délai paiement', '30 jours']].map(([k, v]) => (
              <div key={k} style={{ padding: '6px 8px', background: 'var(--page-bg)', borderRadius: 6 }}>
                <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 2 }}>{k}</p>
                <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

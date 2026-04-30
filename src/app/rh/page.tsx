'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { EMPLOYES } from '@/lib/data'

type RHView = 'calendrier' | 'tableau' | 'kpis'

export default function RHPage() {
  const [view, setView] = useState<RHView>('calendrier')
  const [selectedEmployee, setSelectedEmployee] = useState(EMPLOYES[0])

  return (
    <Shell title="Ressources humaines">
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['calendrier', 'Calendrier absences'], ['tableau', 'Tableau agents'], ['kpis', 'Dashboard KPIs']] as [RHView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 12px', borderRadius: 6, background: v === view ? '#fff' : 'transparent', border: 'none', color: v === view ? C.fg : C.muted, fontSize: 12, fontWeight: v === view ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'calendrier' && <CalendrierView />}
      {view === 'tableau' && <TableauView selected={selectedEmployee} onSelect={setSelectedEmployee} />}
      {view === 'kpis' && <KpisView selected={selectedEmployee} onSelect={setSelectedEmployee} />}
    </Shell>
  )
}

function CalendrierView() {
  const weeks = ['Sem. 18 (1-5)', 'Sem. 19 (8-12)', 'Sem. 20 (15-19)', 'Sem. 21 (22-26)', 'Sem. 22 (29-31)']
  const absences: Record<string, Record<number, 'conge' | 'rtt' | null>> = {
    '2': { 1: 'conge' },
    '5': { 2: 'conge', 3: 'conge' },
    '4': { 2: 'rtt' },
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 3 }} padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, flex: 1 }}>Calendrier des absences — Mai 2026</p>
          <Button size="sm">← Avr.</Button>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, margin: '0 8px' }}>Mai</p>
          <Button size="sm">Juin →</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '130px repeat(5, 1fr)', gap: 0, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '6px 8px', background: C.bg, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600 }}>Agent</p>
          </div>
          {weeks.map((w, i) => (
            <div key={i} style={{ padding: '6px 8px', background: C.bg, borderRight: i < 4 ? `1px solid ${C.border}` : 'none', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600 }}>{w}</p>
            </div>
          ))}
          {/* Rows */}
          {EMPLOYES.map((e, ri) => (
            <>
              <div key={`name-${ri}`} style={{ padding: 8, borderRight: `1px solid ${C.border}`, borderBottom: ri < EMPLOYES.length - 1 ? `1px solid ${C.border}` : 'none', background: '#fff' }}>
                <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{e.nom.split(' ')[0]} {e.nom.split(' ')[1][0]}.</p>
              </div>
              {weeks.map((_, wi) => {
                const abs = absences[e.id]?.[wi]
                return (
                  <div key={`cell-${ri}-${wi}`} style={{ padding: 4, borderRight: wi < 4 ? `1px solid ${C.border}` : 'none', borderBottom: ri < EMPLOYES.length - 1 ? `1px solid ${C.border}` : 'none', background: '#fff' }}>
                    {abs === 'conge' && (
                      <div style={{ height: 24, borderRadius: 4, background: `${C.terra}30`, border: `1px solid ${C.terra}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: 9, color: C.terra, fontWeight: 600 }}>Congé</p>
                      </div>
                    )}
                    {abs === 'rtt' && (
                      <div style={{ height: 24, borderRadius: 4, background: `${C.warning}25`, border: `1px solid ${C.warning}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: 9, color: C.warning, fontWeight: 600 }}>RTT</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {[['Congé annuel', C.terra], ['RTT', C.warning], ['Absence maladie', C.danger]].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: `${c}30`, border: `1px solid ${c}40` }} />
              <p style={{ fontSize: 10, color: C.subtle }}>{l}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Right: masse salariale + congés */}
      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 14 }}>Masse salariale</p>
          <p style={{ fontSize: 26, color: C.slate, fontWeight: 700, marginBottom: 2 }}>21 400 €</p>
          <p style={{ fontSize: 10, color: C.subtle, marginBottom: 14 }}>brut chargé / mois</p>
          {[{ label: 'Titulaires (5)', val: 16800, pct: 78, color: C.slate }, { label: 'Contractuels (2)', val: 4600, pct: 22, color: C.terra }].map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontSize: 11, color: C.fg }}>{item.label}</p>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{item.val.toLocaleString()} €</p>
              </div>
              <Progress pct={item.pct} color={item.color} />
            </div>
          ))}
          <Separator />
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Générer fiches de paie — mai</Button>
        </Card>

        <Card padding={14}>
          <SectionHeader title="Demandes en attente" />
          <Row label="Marc Faure — Congé 20-28 mai" sub="Posé le 28 avr." badge="À valider" badgeVariant="warning" dot={C.warning} />
          <Row label="Lucie Bernard — RTT 15 mai" sub="Posé le 30 avr." badge="À valider" badgeVariant="warning" dot={C.warning} last />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Button variant="primary" size="sm">Valider</Button>
            <Button variant="danger" size="sm">Refuser</Button>
          </div>
        </Card>

        <Card padding={14}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Soldes de congés</p>
          {EMPLOYES.slice(0, 5).map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{e.nom.split(' ')[0]}</p>
              <p style={{ fontSize: 11, color: e.conges < 8 ? C.warning : C.fg, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{e.conges}j</p>
              <div style={{ width: 60 }}>
                <Progress pct={e.conges / 25 * 100} color={e.conges < 8 ? C.warning : C.green} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function TableauView({ selected, onSelect }: { selected: typeof EMPLOYES[0]; onSelect: (e: typeof EMPLOYES[0]) => void }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      <Card style={{ flex: 3 }} padding={0}>
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg, display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 0.6fr', gap: 8, alignItems: 'center' }}>
          {['Nom / Poste', 'Statut', 'Congés rest.', 'RTT rest.', 'Contrat', 'Actions'].map(h => (
            <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {EMPLOYES.map((e, i) => (
          <div key={i} onClick={() => onSelect(e)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 0.6fr', gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: i < EMPLOYES.length - 1 ? `1px solid ${C.border}` : 'none', background: e.id === selected.id ? `${C.green}06` : (e.statut !== 'Présent' ? `${C.terra}06` : '#fff'), cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar initials={e.nom.split(' ').map(x => x[0]).join('')} size={26} color={e.statut === 'Présent' ? C.green : e.statut === 'Congé' ? C.terra : C.danger} />
              <div>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{e.nom}</p>
                <p style={{ fontSize: 10, color: C.subtle }}>{e.poste}</p>
              </div>
            </div>
            <Badge label={e.statut} variant={e.statut === 'Présent' ? 'success' : e.statut === 'Congé' ? 'terra' : 'danger'} />
            <p style={{ fontSize: 12, color: e.conges < 8 ? C.warning : C.fg, fontWeight: e.conges < 8 ? 600 : 400 }}>{e.conges}j</p>
            <p style={{ fontSize: 12, color: e.rtt > 5 ? C.warning : C.fg, fontWeight: e.rtt > 5 ? 600 : 400 }}>{e.rtt}j{e.rtt > 5 ? ' ⚠' : ''}</p>
            <Badge label={e.contrat} />
            <Button size="sm">Fiche</Button>
          </div>
        ))}
      </Card>

      <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <Card padding={14}>
          <SectionHeader title="Demandes en attente" />
          <Row label="Marc Faure — Congé 20-28 mai" sub="Posé le 28 avr." badge="À valider" badgeVariant="warning" dot={C.warning} />
          <Row label="Lucie Bernard — RTT 15 mai" sub="Posé le 30 avr." badge="À valider" badgeVariant="warning" dot={C.warning} last />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <Button variant="primary" size="sm">Valider</Button>
            <Button variant="danger" size="sm">Refuser</Button>
          </div>
        </Card>
        <Card padding={14}>
          <SectionHeader title="Actions rapides" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Button style={{ width: '100%', justifyContent: 'center' }}>Générer les fiches de paie</Button>
            <Button style={{ width: '100%', justifyContent: 'center' }}>Exporter rapport RH</Button>
            <Button style={{ width: '100%', justifyContent: 'center' }}>+ Nouveau salarié</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpisView({ selected, onSelect }: { selected: typeof EMPLOYES[0]; onSelect: (e: typeof EMPLOYES[0]) => void }) {
  return (
    <div>
      <div style={{ background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: C.warning, fontWeight: 600, flex: 1 }}>Marc Faure et Thomas Girard ont un solde RTT supérieur à 5 jours — à régulariser avant juin</p>
        <Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Voir les soldes</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Effectif total" value="7" sub="5 titulaires · 2 contractuels" />
        <KpiCard label="Présents aujourd'hui" value="6 / 7" sub="1 congé — Isabelle Morel" color={C.green} />
        <KpiCard label="Demandes à traiter" value="2" sub="congés en attente de validation" color={C.warning} />
        <KpiCard label="Masse salariale" value="21 400 €" sub="brut chargé · mai 2026" color={C.slate} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 2 }} padding={16}>
          <SectionHeader
            title={`Fiche agent — ${selected.nom}`}
            actions={<div style={{ display: 'flex', gap: 6 }}>
              <Button size="sm">← Précédent</Button>
              <Button size="sm">Suivant →</Button>
            </div>}
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 80, flexShrink: 0 }}>
              <Avatar initials={selected.nom.split(' ').map(x => x[0]).join('')} size={56} color={C.slate} />
              <Badge label={selected.statut} variant={selected.statut === 'Présent' ? 'success' : selected.statut === 'Congé' ? 'terra' : 'danger'} />
            </div>
            <div style={{ flex: 1 }}>
              {[
                ['Poste', selected.poste],
                ['Contrat', `${selected.contrat} catégorie C`],
                ['Salaire brut', `${selected.salaire.toLocaleString()} € / mois`],
                ['Congés restants', `${selected.conges} jours`],
                ['RTT restants', `${selected.rtt} jours`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                  <p style={{ fontSize: 11, color: C.subtle, width: 120, flexShrink: 0 }}>{k}</p>
                  <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Absences 2026</p>
          <div style={{ height: 60, background: C.ph, borderRadius: 6, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Calendrier annuel simplifié</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm">Voir la fiche complète</Button>
            <Button size="sm">Télécharger fiche de paie</Button>
            <Button variant="primary" size="sm">Poser un congé</Button>
          </div>
        </Card>

        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="Alertes RH" />
            {[
              { text: 'RTT à régulariser', who: 'Marc Faure (7j) et Thomas Girard (5j)', type: 'warning' as const },
              { text: 'Congé à valider', who: 'Marc Faure · 20-28 mai', type: 'warning' as const },
              { text: 'Contrat à renouveler', who: 'Anne Dupont · expire le 30 juin', type: 'danger' as const },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.type === 'warning' ? C.warning : C.danger, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{a.text}</p>
                  <p style={{ fontSize: 10, color: C.subtle }}>{a.who}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card padding={14}>
            <SectionHeader title="Agents" />
            {EMPLOYES.map((e, i) => (
              <div key={i} onClick={() => onSelect(e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < EMPLOYES.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: e.id === selected.id ? `${C.green}06` : 'transparent', borderRadius: 4, paddingLeft: 4 }}>
                <Avatar initials={e.nom.split(' ').map(x => x[0]).join('')} size={22} color={e.statut === 'Présent' ? C.green : e.statut === 'Congé' ? C.terra : C.danger} />
                <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{e.nom}</p>
                <Badge label={e.statut} variant={e.statut === 'Présent' ? 'success' : e.statut === 'Congé' ? 'terra' : 'danger'} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

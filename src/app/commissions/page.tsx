'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { COMMISSIONS } from '@/lib/data'

type CommView = 'grille' | 'timeline'

export default function CommissionsPage() {
  const [view, setView] = useState<CommView>('grille')
  const [selected, setSelected] = useState<typeof COMMISSIONS[0] | null>(null)

  return (
    <Shell title="Commissions">
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['grille', 'Grille'], ['timeline', 'Timeline']] as [CommView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null) }}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: v === view ? '#fff' : 'transparent',
                border: 'none',
                color: v === view ? C.fg : C.muted,
                fontSize: 12, fontWeight: v === view ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button size="sm">Voir toutes les commissions</Button>
      </div>

      {view === 'grille' && !selected && <GrilleView onSelect={setSelected} />}
      {view === 'grille' && selected && <DetailView commission={selected} onBack={() => setSelected(null)} />}
      {view === 'timeline' && <TimelineView />}
    </Shell>
  )
}

function GrilleView({ onSelect }: { onSelect: (c: typeof COMMISSIONS[0]) => void }) {
  return (
    <div>
      <SectionHeader title="Mes commissions" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {COMMISSIONS.map((com, i) => (
          <Card
            key={i}
            padding={16}
            hover
            style={{ cursor: 'pointer', borderTop: `3px solid ${com.color}` }}
            onClick={() => onSelect(com)}
          >
            <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 12 }}>{com.name}</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.tasks}</p>
                <p style={{ fontSize: 9, color: C.subtle }}>Tâches</p>
              </div>
              <div>
                <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.members}</p>
                <p style={{ fontSize: 9, color: C.subtle }}>Membres</p>
              </div>
              <div>
                <p style={{ fontSize: 20, color: com.color, fontWeight: 700, lineHeight: 1 }}>{com.docs}</p>
                <p style={{ fontSize: 9, color: C.subtle }}>Documents</p>
              </div>
            </div>
            <Separator my={10} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: C.subtle }}>Prochaine réunion</p>
              <Badge label={com.nextMeeting} variant={com.tasks > 8 ? 'danger' : 'default'} />
            </div>
          </Card>
        ))}
        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, cursor: 'pointer' }}>
          <p style={{ fontSize: 12, color: C.subtle }}>+ Nouvelle commission</p>
        </div>
      </div>

      <Card padding={16}>
        <SectionHeader title="Activité récente des commissions" />
        <Row label="CR Commission Travaux uploadé" sub="3 tâches extraites par l'IA — à valider" badge="IA" badgeVariant="primary" right="Aujourd'hui" dot={C.green} />
        <Row label="Délibération 2026-015 soumise" sub="Commission Admin Générale" badge="À valider" badgeVariant="warning" right="Hier" dot={C.warning} />
        <Row label="Réunion Enfance & Jeunesse — CR publié" sub="Synthèse disponible" badge="Publié" badgeVariant="success" right="28 avr." dot={C.success} last />
      </Card>
    </div>
  )
}

function DetailView({ commission, onBack }: { commission: typeof COMMISSIONS[0]; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'taches' | 'cr' | 'membres' | 'ged'>('taches')

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', height: '100%' }}>
      {/* Left: list */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: C.subtle, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commissions</p>
        {COMMISSIONS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: c.id === commission.id ? 'var(--accent-light)' : 'transparent', marginBottom: 2, cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: c.id === commission.id ? 'var(--accent)' : C.fg, fontWeight: c.id === commission.id ? 600 : 400, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
            {c.tasks > 5 && <Badge label={c.tasks} variant={c.tasks > 10 ? 'danger' : 'warning'} />}
          </div>
        ))}
      </div>

      {/* Right: detail */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <button onClick={onBack} style={{ fontSize: 12, color: C.subtle, cursor: 'pointer', background: 'none', border: 'none', padding: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>← Toutes les commissions</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, color: C.fg, fontWeight: 700 }}>{commission.name}</h2>
              <Badge label={`${commission.tasks} tâches`} variant={commission.tasks > 8 ? 'danger' : 'default'} />
            </div>
            <p style={{ fontSize: 12, color: C.subtle }}>Prochaine réunion : {commission.nextMeeting} · 14h00</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/comptes-rendus"><Button size="sm">Comptes rendus</Button></Link>
            <Button variant="primary" size="sm">+ Tâche</Button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 16 }}>
          <KpiCard label="Tâches actives" value={commission.tasks} color={commission.color} />
          <KpiCard label="Documents" value={commission.docs} color={C.slate} />
          <KpiCard label="Membres" value={commission.members} color={C.green} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
          {(['taches', 'cr', 'membres', 'ged'] as const).map((tab, i) => {
            const labels = { taches: 'Tâches', cr: 'Comptes rendus', membres: 'Membres', ged: 'GED' }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', border: 'none', background: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${commission.color}` : '2px solid transparent',
                  color: activeTab === tab ? commission.color : C.muted,
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: -1,
                }}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 'var(--gap)' }}>
          <div style={{ flex: 2 }}>
            {activeTab === 'taches' && (
              <Card padding={14}>
                <SectionHeader title="Tâches en cours" />
                <Row label="Répondre demande PLU secteur Nord" badge="Urgent" badgeVariant="danger" sub="Jean Martin · 2 mai" dot={C.danger} />
                <Row label="Suivi chantier route des Combes" badge="En cours" badgeVariant="warning" sub="Laurent Fabre · 15 mai" dot={C.warning} />
                <Row label="Dossier permis de construire B-204" badge="À faire" sub="Marie Durand · 30 mai" dot={C.subtle} last />
              </Card>
            )}
            {activeTab === 'cr' && (
              <Card padding={14}>
                <SectionHeader title="Comptes rendus" actions={<Link href="/comptes-rendus"><Button variant="primary" size="sm">+ Importer</Button></Link>} />
                <Row label="CR — Réunion du 12 avril 2026" sub="Uploadé · 3 tâches extraites" badge="IA" badgeVariant="primary" right="12 avr." />
                <Row label="CR — Réunion du 5 mars 2026" sub="Archivé" badge="Archivé" right="5 mars" last />
              </Card>
            )}
            {activeTab === 'membres' && (
              <Card padding={14}>
                <SectionHeader title="Membres" />
                {[['Jean Martin', 'Référent', C.slate], ['Marie Durand', 'Adjointe', C.green], ['Laurent Fabre', 'Élu', C.terra], ['Pierre Roche', 'Agent', C.subtle], ['S. Bonnet', 'Élue', C.info]].map(([n, r, color], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                    <Avatar initials={String(n).split(' ').map(x => x[0]).join('')} size={24} color={String(color)} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{n}</p>
                      <p style={{ fontSize: 10, color: C.subtle }}>{r}</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
            {activeTab === 'ged' && (
              <Card padding={14}>
                <SectionHeader title="Gestion Électronique de Documents" actions={<Button variant="primary" size="sm">+ Ajouter</Button>} />
                {[
                  { name: 'CR Réunion 12 avril 2026.pdf', size: '245 Ko', date: '12 avr.', type: 'CR' },
                  { name: 'PLU Secteur Nord — Dossier.pdf', size: '1.2 Mo', date: '5 avr.', type: 'Dossier' },
                  { name: 'Délibération 2026-015.pdf', size: '89 Ko', date: '1 avr.', type: 'Délib.' },
                  { name: 'Devis éclairage route des Combes.pdf', size: '156 Ko', date: '28 mars', type: 'Devis' },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 32, height: 32, background: C.infoLight, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: C.info, fontWeight: 700 }}>PDF</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                      <p style={{ fontSize: 10, color: C.subtle }}>{doc.size} · {doc.date}</p>
                    </div>
                    <Badge label={doc.type} variant="info" />
                    <Button size="sm">Voir</Button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineView() {
  const months = ['1', '5', '10', '15', '20', '25', '30']
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {COMMISSIONS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: `1px solid ${c.color}40`, background: `${c.color}12`, cursor: 'pointer' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              <span style={{ fontSize: 10, color: c.color, fontWeight: 600 }}>{c.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm">← Avr.</Button>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, padding: '4px 8px' }}>Mai 2026</p>
          <Button size="sm">Juin →</Button>
        </div>
      </div>

      <Card padding={16}>
        <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 180 }}>
          {months.map(d => (
            <p key={d} style={{ flex: 1, fontSize: 10, color: C.subtle, textAlign: 'center' }}>{d} mai</p>
          ))}
        </div>
        {COMMISSIONS.map((com, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
            <div style={{ width: 180, flexShrink: 0, paddingRight: 12 }}>
              <p style={{ fontSize: 11, color: C.fg, fontWeight: 600 }}>{com.name.split(' ').slice(0, 2).join(' ')}</p>
              <p style={{ fontSize: 9, color: C.subtle }}>{com.tasks} tâches · {com.members} membres</p>
            </div>
            <div style={{ flex: 1, height: 28, background: `${com.color}12`, borderRadius: 6, position: 'relative', border: `1px solid ${com.color}25` }}>
              <div style={{ position: 'absolute', left: `${[15, 35, 55, 70, 15][i]}%`, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: com.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>R</span>
              </div>
              <div style={{ position: 'absolute', left: `${[5, 20, 40, 60, 5][i]}%`, width: `${[40, 30, 25, 20, 55][i]}%`, top: 8, height: 12, background: `${com.color}40`, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, color: '#fff' }}>R</span>
            </div>
            <p style={{ fontSize: 10, color: C.subtle }}>Réunion</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 30, height: 10, borderRadius: 4, background: `${C.slate}40` }} />
            <p style={{ fontSize: 10, color: C.subtle }}>Période de tâches actives</p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 'var(--gap)', marginTop: 'var(--gap)' }}>
        <Card padding={14} style={{ flex: 1 }}>
          <SectionHeader title="Prochaines réunions" />
          {[
            { d: '5 mai', com: 'Travaux & Urbanisme', h: '14h00', color: C.danger },
            { d: '5 mai', com: 'Admin & Finance', h: '18h30', color: C.slate },
            { d: '12 mai', com: 'Développement', h: '14h00', color: C.green },
            { d: '19 mai', com: 'Enfance & Jeunesse', h: '18h00', color: C.terra },
          ].map((m, i) => (
            <Row key={i} label={`${m.d} — ${m.com}`} sub={m.h} dot={m.color} last={i === 3} />
          ))}
        </Card>
        <Card padding={14} style={{ flex: 1 }}>
          <SectionHeader title="Tâches échéances proches" />
          <Row label="Répondre PLU secteur Nord" sub="2 mai — Travaux" badge="Urgent" badgeVariant="danger" dot={C.danger} />
          <Row label="Devis éclairage public" sub="5 mai — Finance" badge="Normal" dot={C.warning} />
          <Row label="OJ Conseil du 8 mai" sub="8 mai — Admin" badge="Normal" dot={C.subtle} last />
        </Card>
      </div>
    </div>
  )
}

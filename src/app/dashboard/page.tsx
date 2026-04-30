'use client'

import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Row } from '@/components/ui/Row'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tag } from '@/components/ui/Tag'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import Link from 'next/link'

type DashView = 'conseiller' | 'agent' | 'maire'

const VIEW_LABELS: Record<DashView, string> = {
  conseiller: 'Élu / Conseiller',
  agent: 'Agent',
  maire: 'Maire / Pilotage',
}

export default function DashboardPage() {
  const [view, setView] = useState<DashView>('conseiller')

  return (
    <Shell title="Tableau de bord" notif={3}>
      {/* View selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(Object.entries(VIEW_LABELS) as [DashView, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: `1px solid ${v === view ? C.green : C.border}`,
              background: v === view ? C.green : '#fff',
              color: v === view ? '#fff' : C.muted,
              fontSize: 12,
              fontWeight: v === view ? 600 : 400,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'conseiller' && <DashConseiller />}
      {view === 'agent' && <DashAgent />}
      {view === 'maire' && <DashMaire />}
    </Shell>
  )
}

function DashConseiller() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Mes tâches en cours" value="12" sub="dont 3 urgentes" />
        <KpiCard label="Factures en attente" value="3" sub="à valider" color={C.warning} />
        <KpiCard label="Prochaine réunion" value="5 mai" sub="Commission Travaux" color={C.slate} />
        <KpiCard label="Notifications" value="2" sub="non lues" color={C.terra} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 2 }} padding={16}>
          <SectionHeader
            title="Mes tâches urgentes"
            actions={<><Badge label="Voir toutes" /><Link href="/taches"><Button size="sm">+ Ajouter</Button></Link></>}
          />
          <Row label="Répondre à la demande PLU — secteur Nord" sub="Commission Travaux · Échéance : 2 mai" badge="Urgent" badgeVariant="danger" right="Moi" dot={C.danger} />
          <Row label="Valider devis éclairage public" sub="Finances · Échéance : 5 mai" badge="En cours" badgeVariant="warning" right="Moi" dot={C.warning} />
          <Row label="Préparer ordre du jour — Conseil" sub="Admin Générale · Échéance : 8 mai" badge="À faire" right="Moi" dot={C.subtle} />
          <Row label="Signer convention CC Pays de Vernoux" sub="Partenariat · Échéance : 10 mai" badge="À faire" right="Moi" dot={C.subtle} last />
        </Card>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="Agenda — Mai 2026" />
            <div style={{ height: 110, background: C.ph, borderRadius: 6, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: C.subtle }}>Mini calendrier</span>
            </div>
            <Row label="5 mai — Réunion Commission Travaux" sub="14h00 · Salle du Conseil" dot={C.green} />
            <Row label="8 mai — Conseil Municipal" sub="19h00 · Mairie" dot={C.slate} />
            <Row label="12 mai — Point budget S1" sub="10h00 · Visioconférence" dot={C.terra} last />
          </Card>
          <Card padding={14}>
            <SectionHeader title="Activité récente" />
            <Row label="Marie D. a créé 3 tâches" sub="Suite CR Commission Urbanisme" right="10h42" />
            <Row label="Facture EDF soumise" sub="Validation en attente" right="09:15" />
            <Row label="Nouvelle délibération publiée" sub="Délib. 2026-014" right="Hier" last />
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashAgent() {
  const tasks = [
    { label: 'Valider devis éclairage public', done: true, tag: 'Finances' },
    { label: 'Répondre demande PLU — secteur Nord', done: false, tag: 'Travaux' },
    { label: 'Préparer OJ Conseil du 8 mai', done: false, tag: 'Admin' },
    { label: 'Signer convention CC Pays de Vernoux', done: false, tag: 'Partenariat' },
  ]
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 4 }}>Bonjour, Jean — mercredi 30 avril</h2>
        <p style={{ fontSize: 13, color: C.subtle }}>Vous avez 4 tâches à traiter aujourd'hui et une réunion à 14h.</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={16}>
            <SectionHeader title="À faire aujourd'hui" actions={<Badge label="4 tâches" variant="primary" />} />
            {tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 3 ? `1px solid ${C.border}` : 'none', opacity: t.done ? 0.5 : 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${t.done ? C.success : C.border}`, background: t.done ? C.success : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.done && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>}
                </div>
                <p style={{ fontSize: 13, color: t.done ? C.subtle : C.fg, fontWeight: t.done ? 400 : 500, flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</p>
                <Tag label={t.tag} />
              </div>
            ))}
          </Card>
          <Card padding={16}>
            <SectionHeader title="Cette semaine" />
            <Row label="5 mai — Réunion Commission Travaux" sub="14h · Salle du Conseil" badge="Réunion" badgeVariant="info" dot={C.info} />
            <Row label="Délibération PLU à soumettre avant le 7 mai" sub="Documents à préparer" badge="Urgent" badgeVariant="danger" dot={C.danger} />
            <Row label="8 mai — Conseil Municipal" sub="19h · Mairie" badge="Réunion" badgeVariant="info" dot={C.info} last />
          </Card>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="Notifications" />
            {[
              { text: "CR Commission Urbanisme uploadé", sub: "3 tâches extraites par l'IA", type: 'primary' as const },
              { text: 'Facture EDF en attente de validation', sub: 'Montant : 1 240 €', type: 'warning' as const },
              { text: 'Marie D. vous a assigné une tâche', sub: 'il y a 15 min', type: 'default' as const },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.type === 'primary' ? C.green : n.type === 'warning' ? C.warning : C.subtle, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{n.text}</p>
                  <p style={{ fontSize: 10, color: C.subtle }}>{n.sub}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card padding={14}>
            <SectionHeader title="Actions rapides" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link href="/taches"><Button style={{ width: '100%' }}>+ Créer une tâche</Button></Link>
              <Link href="/comptes-rendus"><Button style={{ width: '100%' }}>Uploader un compte rendu</Button></Link>
              <Link href="/finances"><Button style={{ width: '100%' }}>Soumettre une facture</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashMaire() {
  const budgets = [
    { label: 'Voirie & travaux publics', pct: 72, budget: '95 000 €' },
    { label: 'Personnel & charges sociales', pct: 46, budget: '120 000 €' },
    { label: 'Fonctionnement général', pct: 38, budget: '60 000 €' },
    { label: 'Enfance & jeunesse', pct: 89, budget: '42 000 €' },
    { label: 'Culture & animations', pct: 24, budget: '18 000 €' },
  ]
  const commissions = [
    { label: 'Admin & Finance', tasks: 8, next: '5 mai', ok: true },
    { label: 'Développement', tasks: 5, next: '12 mai', ok: true },
    { label: 'Enfance & Jeunesse', tasks: 3, next: '19 mai', ok: true },
    { label: 'Animation', tasks: 1, next: '26 mai', ok: true },
    { label: 'Travaux & Urbanisme', tasks: 12, next: '5 mai', ok: false },
  ]

  return (
    <div>
      <div style={{ background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: C.warning, fontWeight: 600, flex: 1 }}>3 factures en attente de validation — dont 1 depuis plus de 5 jours</p>
        <Link href="/finances"><Button size="sm" style={{ borderColor: C.warning, color: C.warning }}>Traiter</Button></Link>
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Tâches actives (total équipe)" value="34" sub="12 en retard" />
        <KpiCard label="Budget consommé 2026" value="42%" sub="sur 380 000 €" color={C.slate} />
        <KpiCard label="Agents en congé cette semaine" value="1" sub="sur 7" color={C.terra} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <Card style={{ flex: 3 }} padding={16}>
          <SectionHeader title="Suivi budgétaire par poste" actions={<Link href="/finances"><Button size="sm">Rapport complet</Button></Link>} />
          {budgets.map((b, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{b.label}</p>
                <p style={{ fontSize: 11, color: b.pct > 80 ? C.danger : b.pct > 60 ? C.warning : C.success, fontWeight: 600 }}>{b.pct}% — {b.budget}</p>
              </div>
              <Progress pct={b.pct} />
            </div>
          ))}
        </Card>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <Card padding={14}>
            <SectionHeader title="État des commissions" />
            {commissions.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.ok ? C.success : C.danger, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: C.fg, flex: 1 }}>{c.label}</p>
                <p style={{ fontSize: 10, color: C.subtle }}>{c.tasks} tâches</p>
                <Badge label={c.next} variant={c.ok ? 'default' : 'warning'} />
              </div>
            ))}
          </Card>
          <Card padding={14}>
            <SectionHeader title="Charge par élu" />
            {[['Jean M.', 12, C.slate], ['Marie D.', 9, C.green], ['Laurent F.', 7, C.terra], ['Pierre R.', 6, C.info]].map(([n, v, color], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar initials={String(n).split(' ').map(x => x[0]).join('')} size={22} color={String(color)} />
                <p style={{ fontSize: 11, color: C.fg, flex: 1 }}>{n}</p>
                <p style={{ fontSize: 11, color: C.subtle, fontWeight: 600 }}>{v} tâches</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

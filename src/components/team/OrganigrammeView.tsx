'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { ROLE_LABELS } from '@/lib/people'
import type { Person } from '@/lib/people'
import { sortPeople, isDGS, isAdjointDelegue } from '@/lib/team-order'

// L'organigramme distingue deux branches qui partent toutes deux du maire :
//  - la branche ÉLUE (conseil municipal : adjoints + conseillers)
//  - la branche ADMINISTRATIVE (DGS → pôles de services)
// La hiérarchie est dérivée du rôle et du poste (pas de table dédiée).
// L'ordre (adjoints par rang, conseillers délégués d'abord, DGS en tête) vient
// de comparePeople/sortPeople (cf. src/lib/team-order).

type Pole = 'admin' | 'technique' | 'scolaire' | 'autre'

function getPole(p: Person): Pole {
  const poste = p.poste.toLowerCase()
  if (poste.includes('école') || poste.includes('atsem') || poste.includes('périscol') || poste.includes('scolaire')) return 'scolaire'
  if (poste.includes('technique') || poste.includes('voirie') || poste.includes('général') || poste.includes('espaces verts')) return 'technique'
  if (poste.includes('admin') || poste.includes('secrétar') || poste.includes('accueil') || poste.includes('compt')) return 'admin'
  return 'autre'
}

const POLE_LABELS: Record<Pole, string> = {
  admin: 'Pôle administratif',
  technique: 'Pôle technique',
  scolaire: 'Pôle scolaire & périscolaire',
  autre: 'Autres affectations',
}

const POLE_COLORS: Record<Pole, string> = {
  admin: C.terra,
  technique: C.warning,
  scolaire: C.info,
  autre: C.slate,
}

interface OrganigrammeViewProps {
  people: Person[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function OrganigrammeView({ people, selectedId, onSelect }: OrganigrammeViewProps) {
  const tree = useMemo(() => {
    const active = sortPeople(people.filter(p => p.active))
    const maire = active.find(p => p.role === 'maire')
    const adjoints = active.filter(p => p.role === 'adjoint')
    const adjointsDelegues = active.filter(isAdjointDelegue)
    const conseillers = active.filter(p => p.role === 'elu' && !isAdjointDelegue(p))
    const agents = active.filter(p => p.role === 'agent')
    const dgs = agents.filter(isDGS)
    const autres = agents.filter(a => !isDGS(a))

    const polesByKey: Record<Pole, Person[]> = { admin: [], technique: [], scolaire: [], autre: [] }
    autres.forEach(a => { polesByKey[getPole(a)].push(a) })

    const poles = (['admin', 'technique', 'scolaire', 'autre'] as Pole[])
      .map(key => ({ key, agents: polesByKey[key] }))
      .filter(p => p.agents.length > 0)

    const agentsCount = agents.length
    const elusCount = (maire ? 1 : 0) + adjoints.length + adjointsDelegues.length + conseillers.length

    return { maire, adjoints, adjointsDelegues, conseillers, dgs, poles, agentsCount, elusCount }
  }, [people])

  if (!tree.maire) {
    return (
      <Card padding={32} style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.subtle }}>
          Aucune personne avec le rôle « maire » trouvée. L&apos;organigramme nécessite un maire.
        </p>
      </Card>
    )
  }

  return (
    <div className="orgchart">
      <style>{`
        .orgchart .org-card{transition:box-shadow .2s ease,border-color .2s ease,background-color .2s ease;}
        .orgchart .org-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.10);border-color:${C.green};}
        .orgchart .org-card:focus-visible{outline:2px solid ${C.green};outline-offset:2px;}
        .orgchart .org-branches{display:grid;grid-template-columns:1.25fr 1fr;gap:18px;align-items:start;width:100%;}
        @media(max-width:860px){.orgchart .org-branches{grid-template-columns:1fr;}}
        @media(prefers-reduced-motion:reduce){.orgchart .org-card{transition:none;}}
      `}</style>

      <Card padding={22}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: C.subtle }}>
            Cliquez sur une personne pour ouvrir sa fiche détaillée.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <LegendDot color={C.green} label={`${tree.elusCount} élus`} />
            <LegendDot color={C.terra} label={`${tree.agentsCount} agents`} />
          </div>
        </div>

        {/* Niveau 1 — Maire (sommet commun aux deux branches) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <OrgPerson
            person={tree.maire}
            variant="lead"
            subtitle="Premier magistrat"
            accent={tree.maire.color}
            selected={selectedId === tree.maire.id}
            onSelect={() => onSelect(tree.maire!.id)}
          />
          {/* Connecteur vertical + ligne de séparation des deux branches */}
          <div style={{ width: 2, height: 22, background: C.border }} />
          <div style={{ width: '100%', height: 1, background: C.border, marginBottom: 18 }} />
        </div>

        {/* Niveau 2 — deux branches */}
        <div className="org-branches">
          {/* ── Branche élue ───────────────────────────────── */}
          <BranchPanel
            icon={<IconUsers />}
            title="Conseil municipal"
            subtitle="Branche élue"
            color={C.green}
          >
            {tree.adjoints.length > 0 && (
              <SubGroup label="Adjoints au maire" count={tree.adjoints.length}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {tree.adjoints.map(p => (
                    <OrgPerson key={p.id} person={p} variant="chip" accent={C.green}
                      selected={selectedId === p.id} onSelect={() => onSelect(p.id)} />
                  ))}
                </div>
              </SubGroup>
            )}
            {tree.adjointsDelegues.length > 0 && (
              <SubGroup label="Adjoints délégués" count={tree.adjointsDelegues.length}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {tree.adjointsDelegues.map(p => (
                    <OrgPerson key={p.id} person={p} variant="chip" accent={C.green}
                      selected={selectedId === p.id} onSelect={() => onSelect(p.id)} />
                  ))}
                </div>
              </SubGroup>
            )}
            {tree.conseillers.length > 0 && (
              <SubGroup label="Conseillers municipaux" count={tree.conseillers.length}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {tree.conseillers.map(p => (
                    <OrgPerson key={p.id} person={p} variant="chip" accent={C.green}
                      selected={selectedId === p.id} onSelect={() => onSelect(p.id)} />
                  ))}
                </div>
              </SubGroup>
            )}
          </BranchPanel>

          {/* ── Branche administrative ──────────────────────── */}
          <BranchPanel
            icon={<IconBuilding />}
            title="Administration & Services"
            subtitle="Branche administrative"
            color={C.terra}
          >
            {tree.dgs.length > 0 ? (
              <SubGroup label="Direction générale">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tree.dgs.map(d => (
                    <OrgPerson key={d.id} person={d} variant="chip" accent={C.terra} subtitle="DGS"
                      selected={selectedId === d.id} onSelect={() => onSelect(d.id)} />
                  ))}
                </div>
              </SubGroup>
            ) : null}

            {tree.poles.map(({ key, agents }) => (
              <SubGroup key={key} label={POLE_LABELS[key]} count={agents.length} dotColor={POLE_COLORS[key]}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {agents.map(a => (
                    <OrgPerson key={a.id} person={a} variant="chip" accent={POLE_COLORS[key]}
                      selected={selectedId === a.id} onSelect={() => onSelect(a.id)} />
                  ))}
                </div>
              </SubGroup>
            ))}

            {tree.dgs.length === 0 && tree.poles.length === 0 && (
              <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '4px 0' }}>
                Aucun agent rattaché.
              </p>
            )}
          </BranchPanel>
        </div>
      </Card>
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────

function BranchPanel({ icon, title, subtitle, color, children }: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  children: React.ReactNode
}) {
  return (
    <section style={{
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      background: '#fff',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${color}14`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.fg, lineHeight: 1.2 }}>{title}</p>
          <p style={{ fontSize: 11, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function SubGroup({ label, count, dotColor, children }: {
  label: string
  count?: number
  dotColor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {dotColor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />}
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {count != null && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: C.subtle,
            background: C.bg, padding: '1px 7px', borderRadius: 9, border: `1px solid ${C.border}`,
          }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function OrgPerson({ person, variant, subtitle, accent, selected, onSelect }: {
  person: Person
  variant: 'lead' | 'chip'
  subtitle?: string
  accent: string
  selected: boolean
  onSelect: () => void
}) {
  if (variant === 'lead') {
    return (
      <button
        className="org-card"
        onClick={onSelect}
        aria-pressed={selected}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '16px 22px', minWidth: 210,
          borderRadius: 12, cursor: 'pointer', textAlign: 'center',
          border: `2px solid ${selected ? C.green : accent}`,
          background: selected ? `${C.green}10` : `${accent}0c`,
          boxShadow: `0 4px 14px ${accent}26`,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Avatar initials={person.initials} size={52} color={person.color} photo={person.photoUrl} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <p style={{ fontSize: 15, color: C.fg, fontWeight: 700, lineHeight: 1.2 }}>{person.fullName}</p>
            {person.canSign && <SignataireMark />}
          </div>
          <p style={{ fontSize: 11, color: C.subtle, marginTop: 3 }}>{person.poste}</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.04em',
          textTransform: 'uppercase', background: `${accent}16`, padding: '2px 10px', borderRadius: 9999,
        }}>{subtitle ?? ROLE_LABELS[person.role]}</span>
      </button>
    )
  }

  // variant chip — compact, horizontal, pensé pour les grilles
  return (
    <button
      className="org-card"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', width: '100%',
        borderRadius: 9, cursor: 'pointer', textAlign: 'left',
        border: `1px solid ${selected ? C.green : C.border}`,
        borderLeft: `3px solid ${selected ? C.green : accent}`,
        background: selected ? `${C.green}0e` : '#fff',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <Avatar initials={person.initials} size={30} color={person.color} photo={person.photoUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <p style={{ fontSize: 12.5, color: C.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {person.fullName}
          </p>
          {person.canSign && <SignataireMark />}
        </div>
        <p style={{ fontSize: 10.5, color: C.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subtitle ?? person.poste}
        </p>
      </div>
    </button>
  )
}

function SignataireMark() {
  return (
    <span title="Signataire" aria-label="Signataire" style={{ color: C.terra, display: 'inline-flex', flexShrink: 0 }}>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </span>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted, fontWeight: 600 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
      {label}
    </span>
  )
}

function IconUsers() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  )
}

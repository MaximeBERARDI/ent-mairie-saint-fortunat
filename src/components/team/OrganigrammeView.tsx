'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { ROLE_LABELS } from '@/lib/people'
import type { Person } from '@/lib/people'

// Détecte si un agent est DGS / Secrétaire de mairie (= sommet de la
// hiérarchie administrative, niveau 2).
function isDGS(p: Person): boolean {
  const poste = p.poste.toLowerCase()
  return poste.includes('dgs') || poste.includes('secrétaire de mairie')
}

// Catégorise un agent (non-DGS) dans un pôle métier.
type Pole = 'admin' | 'technique' | 'scolaire' | 'autre'

function getPole(p: Person): Pole {
  const poste = p.poste.toLowerCase()
  if (poste.includes('école') || poste.includes('atsem') || poste.includes('périscol')) return 'scolaire'
  if (poste.includes('technique') || poste.includes('voirie') || poste.includes('général')) return 'technique'
  if (poste.includes('admin') || poste.includes('secrétar')) return 'admin'
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
    const active = people.filter(p => p.active)
    const maire = active.find(p => p.role === 'maire')
    const adjoints = active.filter(p => p.role === 'adjoint')
    const elus = active.filter(p => p.role === 'elu')
    const agents = active.filter(p => p.role === 'agent')
    const dgs = agents.filter(isDGS)
    const autres = agents.filter(a => !isDGS(a))

    const polesByKey: Record<Pole, Person[]> = {
      admin: [], technique: [], scolaire: [], autre: [],
    }
    autres.forEach(a => {
      polesByKey[getPole(a)].push(a)
    })

    // Liste des pôles non vides (pour ne pas afficher des sections inutiles)
    const poles = (['admin', 'technique', 'scolaire', 'autre'] as Pole[])
      .map(key => ({ key, agents: polesByKey[key] }))
      .filter(p => p.agents.length > 0)

    return { maire, adjoints, elus, dgs, poles }
  }, [people])

  if (!tree.maire) {
    return (
      <Card padding={32} style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.subtle }}>
          Aucune personne avec le rôle « maire » trouvée. L'organigramme nécessite un maire.
        </p>
      </Card>
    )
  }

  return (
    <Card padding={20} style={{ overflow: 'auto' }}>
      <p style={{ fontSize: 11, color: C.subtle, marginBottom: 18, fontStyle: 'italic' }}>
        Cliquez sur une personne pour voir sa fiche détaillée.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 'min-content' }}>
        {/* Niveau 1 — Maire */}
        <PersonNode
          person={tree.maire}
          subtitle="Premier magistrat"
          highlighted
          selected={selectedId === tree.maire.id}
          onClick={() => onSelect(tree.maire!.id)}
        />

        {/* Connecteur vertical */}
        <Connector />

        {/* Ligne horizontale + branches niveau 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, position: 'relative' }}>
          {/* Barre horizontale qui relie tout le niveau 2 */}
          <HorizontalBar count={
            (tree.adjoints.length > 0 ? 1 : 0) +
            (tree.elus.length > 0 ? 1 : 0) +
            (tree.dgs.length > 0 ? 1 : 0)
          } />

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Colonne Adjoints */}
            {tree.adjoints.length > 0 && (
              <Column title="Adjoints au maire" count={tree.adjoints.length}>
                {tree.adjoints.map(p => (
                  <PersonNode
                    key={p.id}
                    person={p}
                    selected={selectedId === p.id}
                    onClick={() => onSelect(p.id)}
                  />
                ))}
              </Column>
            )}

            {/* Colonne Conseillers */}
            {tree.elus.length > 0 && (
              <Column title="Conseillers municipaux" count={tree.elus.length}>
                {tree.elus.map(p => (
                  <PersonNode
                    key={p.id}
                    person={p}
                    selected={selectedId === p.id}
                    onClick={() => onSelect(p.id)}
                  />
                ))}
              </Column>
            )}

            {/* Colonne DGS + agents */}
            {tree.dgs.length > 0 && (
              <Column title="Direction Générale des Services" count={tree.dgs.length}>
                {tree.dgs.map(d => (
                  <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <PersonNode
                      person={d}
                      subtitle="DGS"
                      selected={selectedId === d.id}
                      onClick={() => onSelect(d.id)}
                    />
                    {tree.poles.length > 0 && <Connector />}
                  </div>
                ))}

                {tree.poles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', position: 'relative' }}>
                    <HorizontalBar count={tree.poles.length} />
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                      {tree.poles.map(({ key, agents }) => (
                        <PoleColumn
                          key={key}
                          poleKey={key}
                          agents={agents}
                          selectedId={selectedId}
                          onSelect={onSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Column>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function PersonNode({
  person, subtitle, highlighted, selected, onClick,
}: {
  person: Person
  subtitle?: string
  highlighted?: boolean
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px',
        minWidth: 180,
        maxWidth: 220,
        borderRadius: 10,
        border: `2px solid ${selected ? C.green : highlighted ? person.color : C.border}`,
        background: selected ? `${C.green}10` : highlighted ? `${person.color}10` : '#fff',
        cursor: 'pointer',
        boxShadow: highlighted ? `0 4px 14px ${person.color}30` : '0 2px 6px rgba(0,0,0,0.04)',
        fontFamily: "'DM Sans', sans-serif",
        textAlign: 'center',
        transition: 'all 0.15s',
      }}
    >
      <Avatar
        initials={person.initials}
        size={highlighted ? 48 : 38}
        color={person.color}
      />
      <div>
        <p style={{ fontSize: highlighted ? 13 : 12, color: C.fg, fontWeight: 700, lineHeight: 1.2 }}>
          {person.fullName}
        </p>
        <p style={{ fontSize: 10, color: C.subtle, marginTop: 2, lineHeight: 1.3 }}>
          {person.poste}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {subtitle && <Tag label={subtitle} color={person.color} />}
        {person.canSign && <Badge label="✎ Signataire" variant="success" />}
      </div>
    </button>
  )
}

function Column({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      padding: '14px 12px 12px',
      border: `1px dashed ${C.border}`,
      borderRadius: 10,
      background: `${C.bg}80`,
      minWidth: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <p style={{ fontSize: 9, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </p>
        <span style={{
          fontSize: 9, fontWeight: 700, color: C.subtle,
          background: '#fff', padding: '1px 6px', borderRadius: 8,
          border: `1px solid ${C.border}`,
        }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
        {children}
      </div>
    </div>
  )
}

function PoleColumn({
  poleKey, agents, selectedId, onSelect,
}: {
  poleKey: Pole
  agents: Person[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const color = POLE_COLORS[poleKey]
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      padding: '12px 10px',
      border: `2px solid ${color}40`,
      borderRadius: 10,
      background: `${color}06`,
      minWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <p style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {POLE_LABELS[poleKey]}
        </p>
        <span style={{
          fontSize: 9, fontWeight: 700, color,
          background: '#fff', padding: '1px 6px', borderRadius: 8,
          border: `1px solid ${color}40`,
        }}>{agents.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'center' }}>
        {agents.map(a => (
          <PersonNode
            key={a.id}
            person={a}
            selected={selectedId === a.id}
            onClick={() => onSelect(a.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Trait vertical entre niveaux
function Connector() {
  return (
    <div style={{
      width: 2,
      height: 24,
      background: C.border,
      flexShrink: 0,
    }} />
  )
}

// Barre horizontale qui relie un parent à plusieurs enfants
function HorizontalBar({ count }: { count: number }) {
  if (count <= 1) return null
  return (
    <div style={{
      height: 20,
      width: '100%',
      position: 'relative',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: '12%',
        right: '12%',
        height: 2,
        background: C.border,
      }} />
    </div>
  )
}

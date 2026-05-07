'use client'

import { useMemo, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { COMMISSIONS } from '@/lib/data'
import { ROLE_LABELS, ROLE_COLORS, type Person, type PersonRole } from '@/lib/people'
import { OrganigrammeView } from '@/components/team/OrganigrammeView'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  AUTH_LEVEL_LABELS, PERMISSION_LABELS, SIGNATURE_LABELS,
  ROLE_PERMISSIONS, ALL_PERMISSIONS,
  type AuthLevel, type Permission,
} from '@/lib/permissions'
import { useTeam } from '@/hooks/useTeam'
import { useTasks } from '@/hooks/useTasks'
import { PersonForm } from '@/components/team/PersonForm'
import { formatLongFR } from '@/lib/dateUtils'

const AUTH_BADGE_VARIANTS: Record<AuthLevel, 'success' | 'primary' | 'info' | 'warning' | 'default'> = {
  'super-admin': 'success',
  'admin': 'primary',
  'gestionnaire': 'info',
  'contributeur': 'warning',
  'lecteur': 'default',
}

type TeamFilter = 'tous' | 'elus' | 'agents' | 'signataires' | 'inactifs'
type TeamView = 'liste' | 'organigramme'

export default function EquipePage() {
  const { people, hydrated, updatePerson, createPerson, deletePerson } = useTeam()
  const { tasks } = useTasks()
  const { currentUserId, can } = useCurrentUser()
  const [view, setView] = useState<TeamView>('liste')
  const [filter, setFilter] = useState<TeamFilter>('tous')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)

  // Permissions équipe : seuls les administrateurs peuvent éditer les rôles,
  // inviter ou désactiver. Les autres peuvent uniquement consulter.
  const canManage = can('team.edit-roles') || can('team.invite') || can('team.deactivate')

  const filtered = useMemo(() => {
    return people.filter(p => {
      if (filter === 'elus' && p.role === 'agent') return false
      if (filter === 'agents' && p.role !== 'agent') return false
      if (filter === 'signataires' && !p.canSign) return false
      if (filter === 'inactifs' && p.active) return false
      if (filter !== 'inactifs' && !p.active) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.fullName.toLowerCase().includes(q) && !p.poste.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [people, filter, search])

  const counts = useMemo(() => ({
    tous: people.filter(p => p.active).length,
    elus: people.filter(p => p.role !== 'agent' && p.active).length,
    agents: people.filter(p => p.role === 'agent' && p.active).length,
    signataires: people.filter(p => p.canSign && p.active).length,
    inactifs: people.filter(p => !p.active).length,
  }), [people])

  const selected = selectedId ? people.find(p => p.id === selectedId) ?? null : null

  const openCreate = () => { setEditingPerson(null); setFormOpen(true) }
  const openEdit = (person: Person) => { setEditingPerson(person); setFormOpen(true) }
  const handleSubmit = (data: Omit<Person, 'id' | 'fullName' | 'initials'>) => {
    if (editingPerson) {
      updatePerson(editingPerson.id, data)
    } else {
      const created = createPerson(data)
      setSelectedId(created.id)
    }
  }
  const handleDelete = () => {
    if (!editingPerson) return
    if (editingPerson.id === currentUserId) {
      alert('Impossible de supprimer votre propre compte.')
      return
    }
    deletePerson(editingPerson.id)
    if (selectedId === editingPerson.id) setSelectedId(null)
    setFormOpen(false)
  }

  if (!hydrated) {
    return (
      <Shell title="Équipe">
        <div style={{ padding: 40, textAlign: 'center', color: C.subtle, fontSize: 13 }}>Chargement…</div>
      </Shell>
    )
  }

  // Groupes pour la liste de gauche
  const elus = filtered.filter(p => p.role !== 'agent')
  const agents = filtered.filter(p => p.role === 'agent')

  return (
    <Shell title="Équipe">
      {/* Bascule vue Liste / Organigramme */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([['liste', '📋 Liste'], ['organigramme', '🌳 Organigramme']] as [TeamView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: v === view ? '#fff' : 'transparent',
                border: 'none',
                color: v === view ? C.fg : C.muted,
                fontSize: 12, fontWeight: v === view ? 600 : 400,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: v === view ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.subtle, marginLeft: 4 }}>
          {view === 'liste'
            ? `${counts.tous} membre${counts.tous > 1 ? 's' : ''} actif${counts.tous > 1 ? 's' : ''}`
            : 'Organisation hiérarchique de la commune'}
        </p>
      </div>

      {view === 'organigramme' && (
        <OrganigrammeView
          people={people}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      )}

      {view === 'liste' && (
      <>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          ['tous', `Tous (${counts.tous})`],
          ['elus', `Élus (${counts.elus})`],
          ['agents', `Agents (${counts.agents})`],
          ['signataires', `Signataires (${counts.signataires})`],
          ['inactifs', `Désactivés (${counts.inactifs})`],
        ] as [TeamFilter, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: v === filter ? C.green : '#fff',
              border: `1px solid ${v === filter ? C.green : C.border}`,
              color: v === filter ? '#fff' : C.muted,
              fontSize: 12, fontWeight: v === filter ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{
            flex: 1, minWidth: 200, maxWidth: 280,
            border: `1px solid ${C.border}`, borderRadius: 20,
            padding: '6px 14px', fontSize: 12, color: C.fg,
            outline: 'none', fontFamily: "'DM Sans', sans-serif",
            background: '#fff',
          }}
        />
        <div style={{ flex: 1 }} />
        {canManage && <Button variant="primary" size="sm" onClick={openCreate}>+ Nouveau membre</Button>}
      </div>

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        {/* Liste */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          {elus.length > 0 && (
            <Card padding={0}>
              <div style={{ padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Élus ({elus.length})
                </p>
              </div>
              {elus.map(p => (
                <PersonListRow key={p.id} person={p} selected={selected?.id === p.id} onSelect={() => setSelectedId(p.id)} currentUserId={currentUserId} />
              ))}
            </Card>
          )}
          {agents.length > 0 && (
            <Card padding={0}>
              <div style={{ padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Agents ({agents.length})
                </p>
              </div>
              {agents.map(p => (
                <PersonListRow key={p.id} person={p} selected={selected?.id === p.id} onSelect={() => setSelectedId(p.id)} currentUserId={currentUserId} />
              ))}
            </Card>
          )}
          {filtered.length === 0 && (
            <Card padding={20}>
              <p style={{ fontSize: 12, color: C.subtle, textAlign: 'center' }}>Aucun résultat.</p>
            </Card>
          )}
        </div>

        {/* Fiche détail */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <PersonDetail
              person={selected}
              tasks={tasks}
              canManage={canManage}
              currentUserId={currentUserId}
              onEdit={() => openEdit(selected)}
              onToggleActive={() => updatePerson(selected.id, { active: !selected.active })}
            />
          ) : (
            <Card padding={40} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
              <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, marginBottom: 6 }}>
                Sélectionnez un membre
              </p>
              <p style={{ fontSize: 12, color: C.subtle }}>
                Cliquez sur une personne dans la liste pour voir sa fiche complète, ses autorisations et ses délégations.
              </p>
            </Card>
          )}
        </div>
      </div>
      </>
      )}

      {/* Détail sur clic depuis l'organigramme */}
      {view === 'organigramme' && selected && (
        <div style={{ marginTop: 'var(--gap)' }}>
          <PersonDetail
            person={selected}
            tasks={tasks}
            canManage={canManage}
            currentUserId={currentUserId}
            onEdit={() => openEdit(selected)}
            onToggleActive={() => updatePerson(selected.id, { active: !selected.active })}
          />
        </div>
      )}

      <PersonForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingPerson?.id ? handleDelete : undefined}
        initial={editingPerson ?? undefined}
      />
    </Shell>
  )
}

// ── Item de la liste ─────────────────────────────────────────────────────────

function PersonListRow({ person, selected, onSelect, currentUserId }: {
  person: Person
  selected: boolean
  onSelect: () => void
  currentUserId: string
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', width: '100%',
        background: selected ? `${C.green}08` : '#fff',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer', textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        opacity: person.active ? 1 : 0.55,
      }}
    >
      <Avatar initials={person.initials} color={person.color} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {person.fullName}
          </p>
          {person.id === currentUserId && <Badge label="Vous" variant="primary" />}
        </div>
        <p style={{ fontSize: 10, color: C.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {person.poste}
        </p>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge label={AUTH_LEVEL_LABELS[person.authLevel]} variant={AUTH_BADGE_VARIANTS[person.authLevel]} />
          {person.canSign && <Badge label="✍ Signataire" variant="terra" />}
          {!person.active && <Badge label="Désactivé" variant="default" />}
        </div>
      </div>
    </button>
  )
}

// ── Fiche détaillée ──────────────────────────────────────────────────────────

function PersonDetail({ person, tasks, canManage, currentUserId, onEdit, onToggleActive }: {
  person: Person
  tasks: ReturnType<typeof useTasks>['tasks']
  canManage: boolean
  currentUserId: string
  onEdit: () => void
  onToggleActive: () => void
}) {
  // Permissions effectives
  const fromRole = new Set(ROLE_PERMISSIONS[person.authLevel])
  const custom = new Set(person.customPermissions ?? [])
  const allEffective = new Set<Permission>([...Array.from(fromRole), ...Array.from(custom)])

  // Activité de cette personne
  const myTasks = tasks.filter(t => t.assigneeId === person.id && t.status !== 'Terminé')
  const myValidations = tasks.filter(t => t.validatorId === person.id && t.status === 'En attente validation')

  // Commissions où la personne est référente
  const responsibleFor = COMMISSIONS.filter(c => person.responsibleCommissions.includes(c.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {/* En-tête */}
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar initials={person.initials} color={person.color} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, color: C.fg, fontWeight: 700 }}>{person.fullName}</h2>
              <Badge label={ROLE_LABELS[person.role]} variant="primary" />
              {person.id === currentUserId && <Badge label="Vous" variant="success" />}
              {!person.active && <Badge label="Désactivé" variant="danger" />}
            </div>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{person.poste}</p>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
              <a href={`mailto:${person.email}`} style={{ fontSize: 12, color: C.info, textDecoration: 'none' }}>
                ✉ {person.email}
              </a>
              {person.phone && (
                <a href={`tel:${person.phone.replace(/\s/g, '')}`} style={{ fontSize: 12, color: C.info, textDecoration: 'none' }}>
                  ☎ {person.phone}
                </a>
              )}
              {person.startDate && (
                <span style={{ fontSize: 12, color: C.subtle }}>
                  En poste depuis le {formatLongFR(person.startDate)}
                </span>
              )}
            </div>
          </div>
          {canManage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button variant="primary" size="sm" onClick={onEdit}>✎ Modifier</Button>
              {person.id !== currentUserId && (
                <Button size="sm" onClick={onToggleActive}>
                  {person.active ? '⊘ Désactiver' : '✓ Réactiver'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        {/* Autorisations */}
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ flex: 1, fontSize: 14, color: C.fg, fontWeight: 700 }}>Niveau d&apos;autorisation</p>
            <Badge label={AUTH_LEVEL_LABELS[person.authLevel]} variant={AUTH_BADGE_VARIANTS[person.authLevel]} />
          </div>
          <p style={{ fontSize: 11, color: C.subtle, marginBottom: 12 }}>
            {allEffective.size} permission{allEffective.size > 1 ? 's' : ''} sur {ALL_PERMISSIONS.length} —
            {' '}{custom.size > 0 && `dont ${custom.size} spécifique${custom.size > 1 ? 's' : ''}`}
          </p>
          <PermissionsList effective={allEffective} fromRole={fromRole} custom={custom} />
        </Card>

        {/* Signature */}
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ flex: 1, fontSize: 14, color: C.fg, fontWeight: 700 }}>Pouvoir de signature</p>
            {person.canSign
              ? <Badge label="✍ Signataire" variant="terra" />
              : <Badge label="Sans signature" variant="default" />}
          </div>
          {person.canSign ? (
            person.signatureDomains.length === 0 ? (
              <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0', fontStyle: 'italic' }}>
                Pouvoir de signature activé mais aucun domaine défini.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {person.signatureDomains.map(dom => (
                  <div key={dom} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    background: `${C.terra}10`,
                    border: `1px solid ${C.terra}40`,
                    borderRadius: 6,
                  }}>
                    <span style={{ fontSize: 14 }}>✍</span>
                    <span style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>
                      {SIGNATURE_LABELS[dom]}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0' }}>
              Cette personne ne peut pas signer d&apos;actes officiels.
            </p>
          )}
        </Card>
      </div>

      {/* Délégations */}
      <Card padding={16}>
        <p style={{ fontSize: 14, color: C.fg, fontWeight: 700, marginBottom: 12 }}>
          Délégations & responsabilités
        </p>
        {responsibleFor.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle }}>
            Aucune commission sous sa responsabilité directe.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {responsibleFor.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: `${c.color}10`,
                border: `1px solid ${c.color}40`,
                borderRadius: 6,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </p>
                  <p style={{ fontSize: 10, color: c.color, fontWeight: 500 }}>Référent(e)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activité */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <Card padding={16}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 10 }}>
            Tâches assignées ({myTasks.length})
          </p>
          {myTasks.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune tâche en cours.</p>
          ) : (
            myTasks.slice(0, 5).map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 0',
                borderBottom: i < Math.min(myTasks.length, 5) - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <p style={{ flex: 1, fontSize: 12, color: C.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.label}
                </p>
                <Badge label={t.priority} variant={t.priority === 'Urgent' ? 'danger' : 'default'} />
              </div>
            ))
          )}
        </Card>

        <Card padding={16}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 10 }}>
            En attente de sa validation ({myValidations.length})
          </p>
          {myValidations.length === 0 ? (
            <p style={{ fontSize: 12, color: C.subtle, padding: '8px 0' }}>Aucune validation en attente.</p>
          ) : (
            myValidations.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 0',
                borderBottom: i < myValidations.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <p style={{ flex: 1, fontSize: 12, color: C.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.label}
                </p>
                <Badge label="À valider" variant="warning" />
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

// ── Liste des permissions effectives ─────────────────────────────────────────

function PermissionsList({ effective, fromRole, custom }: {
  effective: Set<Permission>
  fromRole: Set<Permission>
  custom: Set<Permission>
}) {
  const groups: Array<{ title: string; perms: Permission[] }> = [
    { title: 'Tâches', perms: ['tasks.create', 'tasks.edit-any', 'tasks.delete-any', 'tasks.validate'] },
    { title: 'Commissions', perms: ['commissions.view-all', 'commissions.manage', 'commissions.add-members'] },
    { title: 'Comptes rendus', perms: ['cr.upload', 'cr.validate', 'cr.publish'] },
    { title: 'RH', perms: ['hr.view-all', 'hr.manage', 'hr.validate-leaves', 'hr.generate-payslips'] },
    { title: 'Finances', perms: ['finance.view-all', 'finance.validate-invoices', 'finance.manage-budget'] },
    { title: 'GED', perms: ['documents.view-all', 'documents.upload', 'documents.delete'] },
    { title: 'Équipe', perms: ['team.view', 'team.invite', 'team.edit-roles', 'team.deactivate'] },
    { title: 'Système', perms: ['system.settings'] },
  ]

  const visibleGroups = groups.filter(g => g.perms.some(p => effective.has(p)))

  if (visibleGroups.length === 0) {
    return (
      <p style={{ fontSize: 12, color: C.subtle, padding: '12px 0', fontStyle: 'italic' }}>
        Aucune permission effective.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflow: 'auto' }}>
      {visibleGroups.map(group => (
        <div key={group.title}>
          <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {group.title}
          </p>
          {group.perms.filter(p => effective.has(p)).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 11 }}>
              <span style={{ color: custom.has(p) ? C.info : C.success, flexShrink: 0 }}>✓</span>
              <span style={{ flex: 1, color: C.fg }}>{PERMISSION_LABELS[p]}</span>
              {custom.has(p) && !fromRole.has(p) && <Badge label="Spécifique" variant="info" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { COLORS as C } from '@/lib/theme'
import { useTeam } from '@/hooks/useTeam'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useEmployees } from '@/hooks/useEmployees'
import { useLeaveRequests, applyLeaveOnEmployee, countOuvres } from '@/hooks/useLeaveRequests'
import { useMissions } from '@/hooks/useMissions'
import { hasPermission } from '@/lib/permissions'
import { PointageView } from '@/components/rh/PointageView'
import type {
  EmployeeRecord, LeaveRequest, LeaveType, LeaveStatut,
  TypeContrat, CadreFP, TaskDocument, Mission,
} from '@/lib/types'
import type { Person } from '@/lib/people'

type RHTab = 'agents' | 'demandes' | 'calendrier' | 'pointage' | 'paies' | 'missions'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })

const fmtDateLong = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

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

const MAX_FILE_SIZE = 1024 * 1024
const MAX_TOTAL_SIZE = 4 * 1024 * 1024

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`
  return `${(b / 1024 / 1024).toFixed(1)} Mo`
}

export default function RHPage() {
  const { currentUser, currentUserId, can } = useCurrentUser()

  // Permissions RH :
  // - hr.view-all : voit tous les agents (sinon, voit uniquement sa fiche)
  // - hr.manage : peut éditer les fiches agents
  // - hr.validate-leaves : peut valider les demandes de congés
  // - hr.generate-payslips : accède à l'onglet Paies
  const canViewAll = can('hr.view-all') || can('hr.manage')
  const canSeeFinances = can('hr.generate-payslips') || can('hr.manage')
  const canManage = can('hr.manage')
  const canValidate = can('hr.validate-leaves')

  // Onglets accessibles selon les permissions
  // Validation pointage : maire OU responsable commission Admin Générale & Finances
  // OU permission hr.validate-leaves (admin/super-admin)
  const canValidatePointage =
    currentUser?.role === 'maire'
    || (currentUser?.responsibleCommissions ?? []).includes('admin-finance')
    || can('hr.validate-leaves')

  const visibleTabs: [RHTab, string][] = [
    ['agents', canViewAll ? 'Agents' : 'Mon profil'],
    ['demandes', 'Congés & RTT'],
    ['calendrier', 'Calendrier'],
    ['pointage', 'Pointage'],
    canSeeFinances ? (['paies', 'Paies'] as [RHTab, string]) : null,
    canManage ? (['missions', 'Missions'] as [RHTab, string]) : null,
  ].filter((x): x is [RHTab, string] => x !== null)

  const [tab, setTab] = useState<RHTab>('agents')

  // Reset l'onglet si l'utilisateur n'a plus accès
  useEffect(() => {
    if (!visibleTabs.some(([v]) => v === tab)) setTab(visibleTabs[0]?.[0] ?? 'agents')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  return (
    <Shell title="Ressources humaines">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {visibleTabs.map(([v, label]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '5px 12px', borderRadius: 6, background: v === tab ? '#fff' : 'transparent', border: 'none', color: v === tab ? C.fg : C.muted, fontSize: 12, fontWeight: v === tab ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: v === tab ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'agents' && <AgentsView currentUserId={currentUserId} canViewAll={canViewAll} canManage={canManage} />}
      {tab === 'demandes' && <DemandesView currentUserId={currentUserId} canValidate={canValidate} canViewAll={canViewAll} />}
      {tab === 'calendrier' && <CalendrierView />}
      {tab === 'pointage' && (
        <PointageView
          currentUserId={currentUserId}
          currentUser={currentUser}
          canViewAll={canViewAll}
          canValidate={canValidatePointage}
        />
      )}
      {tab === 'paies' && canSeeFinances && <PaiesView />}
      {tab === 'missions' && canManage && <MissionsView />}
    </Shell>
  )
}

// ─── KPI bar partagée ─────────────────────────────────────────────────

function HRKpis({ records, leaves, people }: { records: EmployeeRecord[]; leaves: LeaveRequest[]; people: Person[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const pending = leaves.filter(l => l.statut === 'En attente')
  const absentToday = leaves.filter(l => l.statut === 'Approuvée' && today >= l.dateDebut && today <= l.dateFin)
  const masseSal = records.reduce((acc, r) => {
    const ratio = r.tempsTravailHeures / 35
    return acc + (r.salaireBrut + (r.primes ?? 0) + (r.ifse ?? 0)) * ratio
  }, 0)
  // Charges patronales estimées ~50% (cotisations FP + ASSEDIC + retraite)
  const masseSalChargee = masseSal * 1.50
  // Contrats à renouveler dans les 90 j
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 90)
  const horizonIso = horizon.toISOString().slice(0, 10)
  const contratsAReno = records.filter(r => r.dateFinContrat && r.dateFinContrat <= horizonIso)

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
      <KpiCard label="Effectif agents" value={String(records.length)} sub={`${records.filter(r => r.contrat === 'Titulaire').length} titulaires · ${records.filter(r => r.contrat.startsWith('Contractuel')).length} contractuels`} />
      <KpiCard label="Présents aujourd'hui" value={`${records.length - absentToday.length} / ${records.length}`} sub={absentToday.length === 0 ? 'tous présents' : `${absentToday.length} en absence`} color={C.green} />
      <KpiCard label="Demandes à traiter" value={String(pending.length)} sub={pending.length > 0 ? 'à valider' : '—'} color={pending.length > 0 ? C.warning : C.subtle} />
      <KpiCard label="Masse salariale chargée" value={fmtMontant(masseSalChargee)} sub="brut + ~50% charges / mois" color={C.slate} />
      <KpiCard label="Contrats à renouveler" value={String(contratsAReno.length)} sub="dans les 90 jours" color={contratsAReno.length > 0 ? C.danger : C.subtle} />
    </div>
  )
}

// ─── Onglet Agents : liste + fiche détaillée ──────────────────────────

function AgentsView({ currentUserId, canViewAll, canManage }: { currentUserId: string; canViewAll: boolean; canManage: boolean }) {
  const { people } = useTeam()
  const { records, hydrated, updateEmployee, upsertEmployee } = useEmployees()
  const { leaves } = useLeaveRequests()
  const { missions } = useMissions()

  // Si l'utilisateur n'a pas le droit de voir tous les agents, on ne montre
  // que sa propre fiche (mode "Mon profil").
  const agents = useMemo(() => {
    const all = people.filter(p => p.role === 'agent' && p.active)
    if (canViewAll) return all
    return all.filter(p => p.id === currentUserId)
  }, [people, canViewAll, currentUserId])

  const [selectedId, setSelectedId] = useState<string | null>(agents[0]?.id ?? null)
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')

  // Si l'utilisateur change et n'a pas accès, on cible son profil par défaut
  useEffect(() => {
    if (!canViewAll) setSelectedId(currentUserId)
    else if (!selectedId && agents[0]) setSelectedId(agents[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, canViewAll])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return agents
    return agents.filter(a => a.fullName.toLowerCase().includes(q) || a.poste.toLowerCase().includes(q))
  }, [agents, search])

  const selected = agents.find(a => a.id === selectedId) ?? null
  const selectedRecord = selected ? records.find(r => r.personId === selected.id) ?? null : null

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  // Si pas un agent, on lui dit qu'il n'a pas de fiche RH (les élus n'en ont pas)
  if (!canViewAll && agents.length === 0) {
    return (
      <Card padding={32} style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.fg, fontWeight: 600, marginBottom: 6 }}>
          Aucune fiche RH associée à votre profil
        </p>
        <p style={{ fontSize: 11, color: C.subtle }}>
          Les fiches RH ne concernent que les agents. Vous restez disponible
          dans le référentiel Équipe.
        </p>
      </Card>
    )
  }

  return (
    <div>
      {canViewAll && <HRKpis records={records} leaves={leaves} people={people} />}

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        {/* Liste agents */}
        {canViewAll && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un agent…"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <Card padding={0}>
              {filtered.map((a, i) => {
                const r = records.find(x => x.personId === a.id)
                const isAbsent = leaves.some(l => l.personId === a.id && l.statut === 'Approuvée' && new Date().toISOString().slice(0, 10) >= l.dateDebut && new Date().toISOString().slice(0, 10) <= l.dateFin)
                return (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedId(a.id); setEditing(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      background: selectedId === a.id ? `${C.green}10` : 'transparent',
                      border: 'none',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <Avatar initials={a.initials} size={28} color={isAbsent ? C.terra : C.green} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fullName}</p>
                      <p style={{ fontSize: 10, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.poste}</p>
                    </div>
                    {r && (
                      <Tag label={r.contrat === 'Titulaire' ? 'Tit.' : r.contrat.startsWith('Contractuel') ? 'CDD' : r.contrat[0]} color={r.contrat === 'Titulaire' ? C.slate : C.terra} />
                    )}
                    {isAbsent && <Badge label="Absent" variant="terra" />}
                  </button>
                )
              })}
              {filtered.length === 0 && <p style={{ fontSize: 11, color: C.subtle, padding: 12, fontStyle: 'italic' }}>Aucun résultat</p>}
            </Card>
          </div>
        )}

        {/* Détail agent */}
        <div style={{ flex: 1 }}>
          {selected ? (
            <EmployeeDetail
              person={selected}
              record={selectedRecord}
              missions={missions.filter(m => m.personId === selected.id)}
              leaves={leaves.filter(l => l.personId === selected.id)}
              editing={editing && canManage}
              canManage={canManage}
              onToggleEdit={() => setEditing(e => !e)}
              onSaveRecord={(data) => {
                upsertEmployee(data)
                setEditing(false)
              }}
              onUpdateField={(patch) => {
                if (selectedRecord) updateEmployee(selectedRecord.personId, patch)
              }}
            />
          ) : (
            <Card padding={32} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.subtle }}>Sélectionnez un agent pour voir sa fiche.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Fiche employé détaillée ──────────────────────────────────────────

function EmployeeDetail({
  person, record, missions, leaves, editing, onToggleEdit, onSaveRecord, onUpdateField, canManage,
}: {
  person: Person
  record: EmployeeRecord | null
  missions: Mission[]
  leaves: LeaveRequest[]
  editing: boolean
  onToggleEdit: () => void
  onSaveRecord: (data: Omit<EmployeeRecord, 'createdAt'>) => void
  onUpdateField: (patch: Partial<EmployeeRecord>) => void
  canManage: boolean
}) {
  if (!record) {
    return (
      <Card padding={20}>
        <p style={{ fontSize: 13, color: C.fg, fontWeight: 600, marginBottom: 8 }}>Aucune fiche RH pour {person.fullName}</p>
        <p style={{ fontSize: 11, color: C.subtle, marginBottom: 12 }}>
          Cette personne est dans le référentiel Équipe mais n'a pas encore de données RH.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSaveRecord({
            personId: person.id,
            numAgent: `AG-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
            contrat: 'Contractuel CDD',
            tempsTravailHeures: 35,
            dateEmbauche: new Date().toISOString().slice(0, 10),
            salaireBrut: 1800,
            congesAnnuelsAcquis: 25,
            congesAnnuelsPris: 0,
            rttAcquis: 0,
            rttPris: 0,
            joursMaladie: 0,
          })}
        >
          + Créer la fiche RH
        </Button>
      </Card>
    )
  }

  if (editing) {
    return <EmployeeEditForm person={person} record={record} onSave={onSaveRecord} onCancel={onToggleEdit} />
  }

  const congesSolde = record.congesAnnuelsAcquis - record.congesAnnuelsPris
  const rttSolde = record.rttAcquis - record.rttPris
  const congesPctPris = record.congesAnnuelsAcquis > 0 ? Math.round((record.congesAnnuelsPris / record.congesAnnuelsAcquis) * 100) : 0
  const rttPctPris = record.rttAcquis > 0 ? Math.round((record.rttPris / record.rttAcquis) * 100) : 0

  const today = new Date().toISOString().slice(0, 10)
  const isAbsent = leaves.some(l => l.statut === 'Approuvée' && today >= l.dateDebut && today <= l.dateFin)
  const currentLeave = leaves.find(l => l.statut === 'Approuvée' && today >= l.dateDebut && today <= l.dateFin)

  // Anniversaire d'embauche
  const ancienneteAns = Math.floor((Date.now() - new Date(record.dateEmbauche).getTime()) / (365.25 * 24 * 3600 * 1000))

  // Renouvellement contrat
  const finContratProche = record.dateFinContrat && new Date(record.dateFinContrat) < new Date(Date.now() + 90 * 24 * 3600 * 1000)

  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <Avatar initials={person.initials} size={56} color={isAbsent ? C.terra : C.green} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, color: C.fg, fontWeight: 700 }}>{person.fullName}</p>
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 4 }}>{person.poste}</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag label={record.numAgent} color={C.slate} />
            <Badge label={record.contrat} variant={record.contrat === 'Titulaire' ? 'primary' : 'terra'} />
            {record.cadre && <Tag label={`Cat. ${record.cadre}`} color={C.green} />}
            {isAbsent && currentLeave && (
              <Badge label={`En ${currentLeave.type.toLowerCase()} jusqu'au ${fmtDate(currentLeave.dateFin)}`} variant="warning" />
            )}
            {finContratProche && <Badge label={`⚠ Contrat fin ${fmtDate(record.dateFinContrat!)}`} variant="danger" />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canManage && <Button size="sm" onClick={onToggleEdit}>✎ Modifier</Button>}
        </div>
      </div>

      {/* Soldes congés / RTT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <SoldeCard label="Congés annuels" solde={congesSolde} acquis={record.congesAnnuelsAcquis} pris={record.congesAnnuelsPris} pct={congesPctPris} color={congesSolde < 8 ? C.warning : C.green} />
        <SoldeCard label="RTT" solde={rttSolde} acquis={record.rttAcquis} pris={record.rttPris} pct={rttPctPris} color={rttSolde > 5 ? C.warning : C.green} />
        <div style={{ padding: 10, background: C.bg, borderRadius: 6 }}>
          <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maladie (cumul exercice)</p>
          <p style={{ fontSize: 18, color: record.joursMaladie > 5 ? C.warning : C.fg, fontWeight: 700 }}>{record.joursMaladie} j</p>
        </div>
        <div style={{ padding: 10, background: C.bg, borderRadius: 6 }}>
          <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ancienneté</p>
          <p style={{ fontSize: 18, color: C.fg, fontWeight: 700 }}>{ancienneteAns} an{ancienneteAns > 1 ? 's' : ''}</p>
          <p style={{ fontSize: 9, color: C.subtle, marginTop: 2 }}>depuis {fmtDateLong(record.dateEmbauche)}</p>
        </div>
      </div>

      {/* Détails contrat */}
      <SectionHeader title="Contrat & rémunération" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <DetailLine label="Type de contrat" value={record.contrat} />
        <DetailLine label="Temps de travail" value={`${record.tempsTravailHeures}h hebdo${record.tempsTravailHeures < 35 ? ` (${Math.round((record.tempsTravailHeures / 35) * 100)}%)` : ''}`} />
        <DetailLine label="Date d'embauche" value={fmtDateLong(record.dateEmbauche)} />
        {record.dateFinContrat && <DetailLine label="Fin de contrat" value={fmtDateLong(record.dateFinContrat)} highlight={!!finContratProche} />}
        {record.cadre && <DetailLine label="Catégorie" value={`Catégorie ${record.cadre}`} />}
        {record.grade && <DetailLine label="Grade" value={record.grade} />}
        {record.echelon != null && <DetailLine label="Échelon" value={String(record.echelon)} />}
        <DetailLine label="Salaire brut mensuel" value={fmtMontant(record.salaireBrut)} />
        {(record.primes ?? 0) > 0 && <DetailLine label="Primes" value={fmtMontant(record.primes!)} />}
        {(record.ifse ?? 0) > 0 && <DetailLine label="IFSE" value={fmtMontant(record.ifse!)} />}
        <DetailLine label="Brut total mensuel" value={fmtMontant(record.salaireBrut + (record.primes ?? 0) + (record.ifse ?? 0))} highlight />
      </div>

      {/* Identité (depuis Person) */}
      <SectionHeader title="Identité & contact (référentiel Équipe)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <DetailLine label="Email pro" value={person.email} />
        <DetailLine label="Téléphone" value={person.phone ?? '—'} />
        <DetailLine label="Niveau d'autorisation" value={person.authLevel} />
        <DetailLine label="Peut signer" value={person.canSign ? 'Oui' : 'Non'} />
      </div>

      {/* Missions en cours */}
      <SectionHeader title={`Missions (${missions.length})`} />
      {missions.length === 0 ? (
        <p style={{ fontSize: 11, color: C.subtle, fontStyle: 'italic', padding: '6px 0', marginBottom: 14 }}>Aucune mission affectée.</p>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {missions.map(m => {
            const enCours = !m.dateFin || m.dateFin >= today
            return (
              <div key={m.id} style={{ padding: '8px 10px', background: enCours ? `${C.green}08` : C.bg, borderRadius: 6, marginBottom: 6, borderLeft: `3px solid ${enCours ? C.green : C.subtle}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{m.label}</p>
                  <Tag label={enCours ? 'En cours' : 'Terminée'} color={enCours ? C.green : C.subtle} />
                </div>
                <p style={{ fontSize: 10, color: C.subtle, marginTop: 2 }}>
                  Du {fmtDate(m.dateDebut)} {m.dateFin ? `au ${fmtDate(m.dateFin)}` : '— en cours'}{m.lieu && ` · ${m.lieu}`}
                </p>
                {m.description && <p style={{ fontSize: 11, color: C.fg, marginTop: 4 }}>{m.description}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Documents */}
      <SectionHeader title={`Documents (${record.documents?.length ?? 0})`} />
      <DocumentsManager
        documents={record.documents ?? []}
        onChange={(docs) => onUpdateField({ documents: docs })}
      />

      {record.notes && (
        <>
          <SectionHeader title="Notes RH" />
          <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic', whiteSpace: 'pre-wrap', padding: '4px 0' }}>{record.notes}</p>
        </>
      )}
    </Card>
  )
}

function SoldeCard({ label, solde, acquis, pris, pct, color }: { label: string; solde: number; acquis: number; pris: number; pct: number; color: string }) {
  return (
    <div style={{ padding: 10, background: C.bg, borderRadius: 6 }}>
      <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 18, color, fontWeight: 700 }}>{solde} j</p>
      <p style={{ fontSize: 9, color: C.subtle, marginTop: 2 }}>{pris} pris / {acquis} acquis</p>
      <div style={{ marginTop: 4 }}><Progress pct={pct} color={color} /></div>
    </div>
  )
}

function DetailLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 10, color: C.subtle, width: 140, flexShrink: 0 }}>{label}</p>
      <p style={{ fontSize: 12, color: highlight ? C.danger : C.fg, fontWeight: highlight ? 700 : 500 }}>{value}</p>
    </div>
  )
}

// ─── Manager de documents (réutilisable) ──────────────────────────────

function DocumentsManager({ documents, onChange }: { documents: TaskDocument[]; onChange: (docs: TaskDocument[]) => void }) {
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    const currentTotal = documents.reduce((s, d) => s + d.size, 0)
    let total = currentTotal
    const newDocs: TaskDocument[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" dépasse 1 Mo.`)
        continue
      }
      if (total + file.size > MAX_TOTAL_SIZE) {
        setError(`Total > 4 Mo.`)
        break
      }
      try {
        const dataUrl = await readFileAsDataURL(file)
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        })
        total += file.size
      } catch {
        setError(`Impossible de lire "${file.name}".`)
      }
    }
    if (newDocs.length > 0) onChange([...documents, ...newDocs])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ border: `1px dashed ${C.border}`, borderRadius: 6, padding: 10, background: C.bg, marginBottom: 10 }}>
      {documents.length === 0 && (
        <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
          Aucun document — joignez contrat, fiches de paie, certificats…
        </p>
      )}
      {documents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px' }}>
              <span style={{ fontSize: 14 }}>📎</span>
              <a href={doc.dataUrl} download={doc.name} style={{ flex: 1, fontSize: 11, color: C.fg, textDecoration: 'none', fontWeight: 500 }}>{doc.name}</a>
              <span style={{ fontSize: 9, color: C.subtle }}>{fmtBytes(doc.size)}</span>
              <button
                onClick={() => onChange(documents.filter(d => d.id !== doc.id))}
                aria-label="Retirer"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.danger, fontSize: 14 }}
              >×</button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={e => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <Button size="sm" onClick={() => fileInputRef.current?.click()}>+ Ajouter un document</Button>
      {error && <p style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>{error}</p>}
    </div>
  )
}

// ─── Formulaire d'édition de la fiche employé ─────────────────────────

function EmployeeEditForm({ person, record, onSave, onCancel }: {
  person: Person
  record: EmployeeRecord
  onSave: (data: Omit<EmployeeRecord, 'createdAt'>) => void
  onCancel: () => void
}) {
  const [contrat, setContrat] = useState<TypeContrat>(record.contrat)
  const [cadre, setCadre] = useState<CadreFP | ''>(record.cadre ?? '')
  const [grade, setGrade] = useState(record.grade ?? '')
  const [echelon, setEchelon] = useState(String(record.echelon ?? ''))
  const [tempsTravail, setTempsTravail] = useState(String(record.tempsTravailHeures))
  const [dateEmbauche, setDateEmbauche] = useState(record.dateEmbauche)
  const [dateFinContrat, setDateFinContrat] = useState(record.dateFinContrat ?? '')
  const [salaireBrut, setSalaireBrut] = useState(String(record.salaireBrut))
  const [primes, setPrimes] = useState(String(record.primes ?? 0))
  const [ifse, setIfse] = useState(String(record.ifse ?? 0))
  const [congesAcquis, setCongesAcquis] = useState(String(record.congesAnnuelsAcquis))
  const [congesPris, setCongesPris] = useState(String(record.congesAnnuelsPris))
  const [rttAcquis, setRttAcquis] = useState(String(record.rttAcquis))
  const [rttPris, setRttPris] = useState(String(record.rttPris))
  const [maladie, setMaladie] = useState(String(record.joursMaladie))
  const [notes, setNotes] = useState(record.notes ?? '')

  const num = (s: string) => Number.isNaN(parseFloat(s)) ? 0 : parseFloat(s)

  return (
    <Card padding={16} style={{ background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={`Modifier la fiche RH — ${person.fullName}`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Type de contrat *">
          <select value={contrat} onChange={e => setContrat(e.target.value as TypeContrat)} style={inputStyle}>
            {(['Titulaire', 'Contractuel CDI', 'Contractuel CDD', 'Stagiaire', 'Apprenti'] as TypeContrat[]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Catégorie FP">
          <select value={cadre} onChange={e => setCadre((e.target.value as CadreFP) || '')} style={inputStyle}>
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </Field>
        <Field label="Échelon">
          <input type="number" value={echelon} onChange={e => setEchelon(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Grade">
          <input type="text" value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle} placeholder="ex: Adjoint administratif principal de 2ᵉ classe" />
        </Field>
        <Field label="Temps de travail (h/sem)">
          <input type="number" min="0" max="40" step="0.5" value={tempsTravail} onChange={e => setTempsTravail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date d'embauche *">
          <input type="date" value={dateEmbauche} onChange={e => setDateEmbauche(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Fin de contrat (si CDD)">
          <input type="date" value={dateFinContrat} onChange={e => setDateFinContrat(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rémunération mensuelle</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Salaire brut (€) *">
          <input type="number" value={salaireBrut} onChange={e => setSalaireBrut(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Primes (€)">
          <input type="number" value={primes} onChange={e => setPrimes(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="IFSE (€)">
          <input type="number" value={ifse} onChange={e => setIfse(e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compteurs (en jours)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Congés acquis"><input type="number" value={congesAcquis} onChange={e => setCongesAcquis(e.target.value)} style={inputStyle} /></Field>
        <Field label="Congés pris"><input type="number" value={congesPris} onChange={e => setCongesPris(e.target.value)} style={inputStyle} /></Field>
        <Field label="RTT acquis"><input type="number" value={rttAcquis} onChange={e => setRttAcquis(e.target.value)} style={inputStyle} /></Field>
        <Field label="RTT pris"><input type="number" value={rttPris} onChange={e => setRttPris(e.target.value)} style={inputStyle} /></Field>
        <Field label="Jours maladie"><input type="number" value={maladie} onChange={e => setMaladie(e.target.value)} style={inputStyle} /></Field>
      </div>

      <Field label="Notes RH">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          onClick={() => onSave({
            personId: record.personId,
            numAgent: record.numAgent,
            contrat,
            cadre: cadre || undefined,
            grade: grade.trim() || undefined,
            echelon: echelon ? parseInt(echelon, 10) : undefined,
            tempsTravailHeures: num(tempsTravail) || 35,
            dateEmbauche,
            dateFinContrat: dateFinContrat || undefined,
            salaireBrut: num(salaireBrut),
            primes: num(primes) || undefined,
            ifse: num(ifse) || undefined,
            congesAnnuelsAcquis: num(congesAcquis),
            congesAnnuelsPris: num(congesPris),
            rttAcquis: num(rttAcquis),
            rttPris: num(rttPris),
            joursMaladie: num(maladie),
            documents: record.documents,
            notes: notes.trim() || undefined,
          })}
        >
          Enregistrer
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

// ─── Onglet Demandes : workflow congés / RTT ──────────────────────────

function DemandesView({ currentUserId, canValidate, canViewAll }: { currentUserId: string; canValidate: boolean; canViewAll: boolean }) {
  const { people } = useTeam()
  const { records, updateEmployee } = useEmployees()

  // On crée le hook avec callbacks pour décrémenter les compteurs employé.
  const { leaves: allLeaves, hydrated, submitLeave, approveLeave, rejectLeave, reopenLeave, deleteLeave } = useLeaveRequests({
    onApprove: (leave) => {
      const emp = records.find(r => r.personId === leave.personId)
      if (emp) {
        const updated = applyLeaveOnEmployee(emp, leave, +1)
        updateEmployee(emp.personId, updated)
      }
    },
    onUnapprove: (leave) => {
      const emp = records.find(r => r.personId === leave.personId)
      if (emp) {
        const updated = applyLeaveOnEmployee(emp, leave, -1)
        updateEmployee(emp.personId, updated)
      }
    },
  })

  // Si l'utilisateur n'a pas hr.view-all, on ne lui montre que ses propres demandes
  const leaves = useMemo(() => canViewAll ? allLeaves : allLeaves.filter(l => l.personId === currentUserId), [allLeaves, canViewAll, currentUserId])

  const [filter, setFilter] = useState<LeaveStatut | 'toutes'>('En attente')
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const agents = people.filter(p => p.role === 'agent' && p.active)

  const filtered = useMemo(() => {
    return leaves
      .filter(l => filter === 'toutes' || l.statut === filter)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [leaves, filter])

  const counts = {
    'En attente': leaves.filter(l => l.statut === 'En attente').length,
    'Approuvée': leaves.filter(l => l.statut === 'Approuvée').length,
    'Refusée': leaves.filter(l => l.statut === 'Refusée').length,
    'Annulée': leaves.filter(l => l.statut === 'Annulée').length,
  }

  const selected = leaves.find(l => l.id === selectedId) ?? null

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      <HRKpis records={records} leaves={leaves} people={people} />

      <div style={{ display: 'flex', gap: 'var(--gap)' }}>
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {([
              ['En attente', `En attente (${counts['En attente']})`],
              ['Approuvée', `Approuvées (${counts['Approuvée']})`],
              ['Refusée', `Refusées (${counts['Refusée']})`],
              ['toutes', `Toutes (${leaves.length})`],
            ] as [typeof filter, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                style={{ padding: '5px 12px', borderRadius: 20, background: v === filter ? C.green : '#fff', border: `1px solid ${v === filter ? C.green : C.border}`, color: v === filter ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filter ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="sm" onClick={() => setShowForm(s => !s)}>
              {showForm ? 'Annuler' : '+ Saisir une demande'}
            </Button>
          </div>

          {showForm && (
            <LeaveRequestForm
              agents={agents}
              records={records}
              defaultPersonId={currentUserId}
              onSubmit={(data) => {
                const created = submitLeave(data)
                setSelectedId(created.id)
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {filtered.length === 0 ? (
            <Card padding={24} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.subtle }}>Aucune demande pour ce filtre.</p>
            </Card>
          ) : (
            <Card padding={0}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.4fr 0.6fr 0.9fr 0.8fr', padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Agent', 'Type', 'Période', 'Jours', 'Statut', 'Action'].map(h => (
                  <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
                ))}
              </div>
              {filtered.map((l, i) => {
                const p = people.find(x => x.id === l.personId)
                const isSel = selectedId === l.id
                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.4fr 0.6fr 0.9fr 0.8fr', padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: isSel ? `${C.green}06` : (l.statut === 'En attente' ? `${C.warning}06` : '#fff'), alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p && <Avatar initials={p.initials} size={22} color={p.color} />}
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p?.fullName ?? '—'}</p>
                    </div>
                    <Tag label={l.type} color={l.type === 'Maladie' ? C.danger : l.type === 'RTT' ? C.warning : C.green} />
                    <p style={{ fontSize: 11, color: C.fg }}>{fmtDate(l.dateDebut)} → {fmtDate(l.dateFin)}</p>
                    <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{l.nbJoursOuvres}</p>
                    <Badge label={l.statut} variant={l.statut === 'Approuvée' ? 'success' : l.statut === 'Refusée' ? 'danger' : l.statut === 'En attente' ? 'warning' : 'default'} />
                    {l.statut === 'En attente' && canValidate ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); approveLeave(l.id, currentUserId) }}
                          style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.success}`, background: C.successLight, color: C.success, cursor: 'pointer', fontSize: 12 }}
                          title="Approuver"
                        >✓</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(l.id) }}
                          style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 12 }}
                          title="Voir / refuser"
                        >✕</button>
                      </div>
                    ) : (
                      <Button size="sm">Voir</Button>
                    )}
                  </div>
                )
              })}
            </Card>
          )}
        </div>

        {/* Détail demande sélectionnée */}
        <Card style={{ flex: 1.3 }} padding={14}>
          {selected ? (
            <LeaveDetailPanel
              leave={selected}
              people={people}
              canValidate={canValidate}
              comment={comment}
              setComment={setComment}
              onApprove={() => { approveLeave(selected.id, currentUserId); setComment('') }}
              onReject={() => {
                if (!comment.trim()) { alert('Le motif du refus est obligatoire.'); return }
                rejectLeave(selected.id, currentUserId, comment.trim())
                setComment('')
              }}
              onReopen={() => reopenLeave(selected.id)}
              onDelete={() => { if (confirm('Supprimer définitivement cette demande ?')) { deleteLeave(selected.id); setSelectedId(null) } }}
            />
          ) : (
            <p style={{ fontSize: 12, color: C.subtle, textAlign: 'center', padding: 20 }}>
              Sélectionnez une demande pour voir le détail.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

function LeaveDetailPanel({
  leave, people, canValidate, comment, setComment, onApprove, onReject, onReopen, onDelete,
}: {
  leave: LeaveRequest
  people: Person[]
  canValidate: boolean
  comment: string
  setComment: (s: string) => void
  onApprove: () => void
  onReject: () => void
  onReopen: () => void
  onDelete: () => void
}) {
  const submitter = people.find(p => p.id === leave.personId)
  const decider = leave.decidedById ? people.find(p => p.id === leave.decidedById) : null

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        {submitter && <Avatar initials={submitter.initials} size={32} color={submitter.color} />}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 700 }}>{submitter?.fullName ?? '—'}</p>
          <p style={{ fontSize: 10, color: C.subtle }}>{submitter?.poste ?? ''}</p>
        </div>
        <Badge label={leave.statut} variant={leave.statut === 'Approuvée' ? 'success' : leave.statut === 'Refusée' ? 'danger' : leave.statut === 'En attente' ? 'warning' : 'default'} />
      </div>
      <Separator my={10} />

      {[
        ['Type', leave.type],
        ['Début', fmtDateLong(leave.dateDebut)],
        ['Fin', fmtDateLong(leave.dateFin)],
        ['Jours ouvrés', `${leave.nbJoursOuvres} jour${leave.nbJoursOuvres > 1 ? 's' : ''}`],
        ['Soumise le', fmtDate(leave.submittedAt)],
      ].map(([k, v], i, arr) => (
        <div key={k} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <p style={{ fontSize: 10, color: C.subtle, width: 110, flexShrink: 0 }}>{k}</p>
          <p style={{ fontSize: 11, color: C.fg, fontWeight: 500 }}>{v}</p>
        </div>
      ))}

      {leave.motif && (
        <>
          <Separator my={10} />
          <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motif</p>
          <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic' }}>« {leave.motif} »</p>
        </>
      )}

      {decider && leave.decidedAt && (
        <>
          <Separator my={10} />
          <div style={{ padding: 8, background: leave.statut === 'Approuvée' ? C.successLight : C.dangerLight, borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Avatar initials={decider.initials} size={20} color={decider.color} />
              <p style={{ fontSize: 11, color: leave.statut === 'Approuvée' ? C.success : C.danger, fontWeight: 600 }}>
                {leave.statut === 'Approuvée' ? 'Approuvée' : 'Refusée'} par {decider.fullName}
              </p>
            </div>
            <p style={{ fontSize: 10, color: C.muted, paddingLeft: 26 }}>{fmtDate(leave.decidedAt)}</p>
            {leave.decisionMotif && (
              <p style={{ fontSize: 11, color: C.fg, fontStyle: 'italic', paddingLeft: 26, marginTop: 4 }}>« {leave.decisionMotif} »</p>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      {leave.statut === 'En attente' && canValidate && (
        <>
          <Separator my={10} />
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Commentaire (obligatoire si refus)</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Motif…"
            style={{ width: '100%', height: 56, border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, fontSize: 12, resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: C.fg, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onApprove}>Approuver</Button>
            <Button variant="danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onReject}>Refuser</Button>
          </div>
        </>
      )}

      {(leave.statut === 'Approuvée' || leave.statut === 'Refusée') && canValidate && (
        <>
          <Separator my={10} />
          <div style={{ display: 'flex', gap: 6 }}>
            <Button style={{ flex: 1, justifyContent: 'center' }} onClick={onReopen}>↺ Rouvrir</Button>
            <Button variant="danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onDelete}>Supprimer</Button>
          </div>
        </>
      )}
    </>
  )
}

// ─── Formulaire de demande ────────────────────────────────────────────

function LeaveRequestForm({ agents, records, defaultPersonId, onSubmit, onCancel }: {
  agents: Person[]
  records: EmployeeRecord[]
  defaultPersonId: string
  onSubmit: (data: { personId: string; type: LeaveType; dateDebut: string; dateFin: string; motif?: string }) => void
  onCancel: () => void
}) {
  const [personId, setPersonId] = useState(defaultPersonId)
  const [type, setType] = useState<LeaveType>('Congés annuels')
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10))
  const [motif, setMotif] = useState('')

  const nbOuvres = countOuvres(dateDebut, dateFin)
  const valid = personId && dateDebut && dateFin && dateFin >= dateDebut && nbOuvres > 0

  // Vérifier le solde restant pour informer l'utilisateur
  const record = records.find(r => r.personId === personId)
  let warning: string | null = null
  if (record) {
    if (type === 'Congés annuels') {
      const solde = record.congesAnnuelsAcquis - record.congesAnnuelsPris
      if (nbOuvres > solde) warning = `⚠ Solde de congés insuffisant : ${solde} jours restants.`
    } else if (type === 'RTT') {
      const solde = record.rttAcquis - record.rttPris
      if (nbOuvres > solde) warning = `⚠ Solde RTT insuffisant : ${solde} jours restants.`
    }
  }

  // Si l'utilisateur sélectionné n'est pas un agent (record null), on prévient
  const personIsAgent = !!record && agents.some(a => a.id === personId)

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title="Nouvelle demande d'absence" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Field label="Agent *">
          <select value={personId} onChange={e => setPersonId(e.target.value)} style={inputStyle}>
            {agents.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
        </Field>
        <Field label="Type *">
          <select value={type} onChange={e => setType(e.target.value as LeaveType)} style={inputStyle}>
            {(['Congés annuels', 'RTT', 'Maladie', 'Sans solde', 'Formation', 'Évènement familial', 'Maternité / Paternité'] as LeaveType[]).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Date de début *">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date de fin *">
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <Field label="Motif / précisions (facultatif)">
        <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
        <Tag label={`${nbOuvres} jour${nbOuvres > 1 ? 's' : ''} ouvré${nbOuvres > 1 ? 's' : ''}`} color={C.slate} />
        {!personIsAgent && <span style={{ fontSize: 11, color: C.warning }}>⚠ Cette personne n'est pas un agent.</span>}
        {warning && <span style={{ fontSize: 11, color: C.warning }}>{warning}</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button variant="primary" disabled={!valid} onClick={() => valid && onSubmit({ personId, type, dateDebut, dateFin, motif: motif.trim() || undefined })}>
          Soumettre la demande
        </Button>
      </div>
    </Card>
  )
}

// ─── Onglet Calendrier des absences ───────────────────────────────────

function CalendrierView() {
  const { people } = useTeam()
  const { records } = useEmployees()
  const { leaves } = useLeaveRequests()

  const agents = useMemo(() => people.filter(p => p.role === 'agent' && p.active), [people])

  const [monthOffset, setMonthOffset] = useState(0)  // 0 = mois courant
  const today = new Date()
  const ref = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const monthLabel = ref.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Couleurs par type d'absence
  const typeColor = (t: LeaveType): string => {
    switch (t) {
      case 'Congés annuels': return C.terra
      case 'RTT': return C.warning
      case 'Maladie': return C.danger
      case 'Formation': return C.info
      case 'Maternité / Paternité': return C.green
      case 'Évènement familial': return C.slate
      case 'Sans solde': return C.muted
    }
  }

  // Pour chaque agent, calcule les jours du mois où il/elle est en absence approuvée
  const cellState = (agentId: string, day: number): LeaveRequest | null => {
    const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return leaves.find(l => l.personId === agentId && l.statut === 'Approuvée' && dateIso >= l.dateDebut && dateIso <= l.dateFin) ?? null
  }

  const isWeekend = (day: number) => {
    const d = new Date(year, month, day).getDay()
    return d === 0 || d === 6
  }

  return (
    <div>
      <HRKpis records={records} leaves={leaves} people={people} />

      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, flex: 1, textTransform: 'capitalize' }}>Calendrier des absences — {monthLabel}</p>
          <Button size="sm" onClick={() => setMonthOffset(o => o - 1)}>← Mois précédent</Button>
          <Button size="sm" onClick={() => setMonthOffset(0)} style={{ margin: '0 6px' }}>Aujourd'hui</Button>
          <Button size="sm" onClick={() => setMonthOffset(o => o + 1)}>Mois suivant →</Button>
        </div>

        {/* En-tête jours */}
        <div style={{ display: 'grid', gridTemplateColumns: `160px repeat(${daysInMonth}, 1fr)`, gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: C.bg, padding: '6px 8px' }}>
            <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600 }}>Agent</p>
          </div>
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const we = isWeekend(day)
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            return (
              <div key={day} style={{ background: isToday ? `${C.green}25` : we ? C.ph : C.bg, padding: '4px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: isToday ? C.green : we ? C.subtle : C.fg, fontWeight: isToday ? 700 : 500 }}>{day}</p>
              </div>
            )
          })}

          {/* Lignes agents */}
          {agents.map(a => (
            <FragmentRow key={a.id}>
              <div style={{ background: '#fff', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar initials={a.initials} size={22} color={a.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.fullName}</p>
                </div>
              </div>
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const we = isWeekend(day)
                const leave = cellState(a.id, day)
                return (
                  <div
                    key={day}
                    style={{
                      background: leave ? typeColor(leave.type) : we ? C.ph : '#fff',
                      padding: 0,
                      minHeight: 22,
                    }}
                    title={leave ? `${leave.type} — ${fmtDate(leave.dateDebut)} → ${fmtDate(leave.dateFin)}${leave.motif ? ` · ${leave.motif}` : ''}` : we ? 'Week-end' : ''}
                  />
                )
              })}
            </FragmentRow>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {([
            ['Congés annuels', C.terra],
            ['RTT', C.warning],
            ['Maladie', C.danger],
            ['Formation', C.info],
            ['Maternité / Paternité', C.green],
            ['Aujourd\'hui', `${C.green}25`],
          ] as [string, string][]).map(([l, color]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: color, border: `1px solid ${C.border}` }} />
              <p style={{ fontSize: 10, color: C.subtle }}>{l}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// Helper pour grid : permet de renvoyer plusieurs cellules sans wrapper DOM
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// ─── Onglet Paies ─────────────────────────────────────────────────────

function PaiesView() {
  const { people } = useTeam()
  const { records } = useEmployees()
  const { leaves } = useLeaveRequests()

  const agents = useMemo(() => people.filter(p => p.role === 'agent' && p.active), [people])
  const TAUX_CHARGES = 0.50  // ~50% pour FP territoriale

  const rows = agents.map(a => {
    const r = records.find(x => x.personId === a.id)
    if (!r) return null
    const ratio = r.tempsTravailHeures / 35
    const brut = (r.salaireBrut + (r.primes ?? 0) + (r.ifse ?? 0)) * ratio
    const charges = brut * TAUX_CHARGES
    return { person: a, record: r, brut, charges, total: brut + charges }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  const totals = {
    brut: rows.reduce((acc, r) => acc + r.brut, 0),
    charges: rows.reduce((acc, r) => acc + r.charges, 0),
    total: rows.reduce((acc, r) => acc + r.total, 0),
  }

  const today = new Date()
  const monthLabel = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <HRKpis records={records} leaves={leaves} people={people} />

      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Masse salariale brute" value={fmtMontant(totals.brut)} sub={`mensuel · ${monthLabel}`} color={C.slate} />
        <KpiCard label="Charges patronales" value={fmtMontant(totals.charges)} sub={`~${Math.round(TAUX_CHARGES * 100)}% du brut`} color={C.warning} />
        <KpiCard label="Coût total mensuel" value={fmtMontant(totals.total)} sub="brut + charges" color={C.danger} />
        <KpiCard label="Coût annualisé" value={fmtMontant(totals.total * 12)} sub="estimation 12 mois" />
      </div>

      <Card padding={0}>
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ flex: 1, fontSize: 12, color: C.fg, fontWeight: 700 }}>Détail paie {monthLabel}</p>
          <Button size="sm">📊 Exporter</Button>
          <Button variant="primary" size="sm">Générer fiches de paie</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 1fr 1fr 1.2fr', padding: '8px 14px', background: '#fff', borderBottom: `1px solid ${C.border}` }}>
          {['Agent', 'Contrat', 'Temps', 'Brut', 'Charges (~50%)', 'Coût total', 'Imputation'].map(h => (
            <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={row.person.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 1fr 1fr 1.2fr', padding: '10px 14px', borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar initials={row.person.initials} size={26} color={row.person.color} />
              <div>
                <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{row.person.fullName}</p>
                <p style={{ fontSize: 10, color: C.subtle }}>{row.record.numAgent} · {row.person.poste}</p>
              </div>
            </div>
            <Badge label={row.record.contrat} variant={row.record.contrat === 'Titulaire' ? 'primary' : 'terra'} />
            <p style={{ color: row.record.tempsTravailHeures < 35 ? C.warning : C.fg }}>{Math.round((row.record.tempsTravailHeures / 35) * 100)}%</p>
            <p style={{ fontWeight: 600, color: C.fg }}>{fmtMontant(row.brut)}</p>
            <p style={{ color: C.muted }}>{fmtMontant(row.charges)}</p>
            <p style={{ fontWeight: 700, color: C.fg }}>{fmtMontant(row.total)}</p>
            <p style={{ fontSize: 10, color: C.subtle, fontFamily: "'JetBrains Mono', monospace" }}>
              {row.record.contrat === 'Titulaire' ? '6411 + cotis.' : '6413 + cotis.'}
            </p>
          </div>
        ))}
        {/* Total */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 1fr 1fr 1.2fr', padding: '10px 14px', background: C.bg, alignItems: 'center', fontSize: 12 }}>
          <p style={{ fontWeight: 700, color: C.fg }}>TOTAL ({rows.length} agents)</p>
          <span /><span />
          <p style={{ fontWeight: 700, color: C.fg }}>{fmtMontant(totals.brut)}</p>
          <p style={{ fontWeight: 700, color: C.muted }}>{fmtMontant(totals.charges)}</p>
          <p style={{ fontWeight: 700, color: C.danger }}>{fmtMontant(totals.total)}</p>
          <span />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 'var(--gap)' }}>
        <SectionHeader title="Imputation comptable (M14)" />
        <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
          La masse salariale s'impute sur le chapitre 012 — Charges de personnel.
          Les comptes 6411 (titulaires) et 6413 (contractuels) reçoivent les rémunérations.
          Les cotisations vont sur 6451 (URSSAF), 6453 (retraite), 6454 (ASSEDIC).
        </p>
        <p style={{ fontSize: 11, color: C.fg }}>
          Annualisé estimé : <strong>{fmtMontant(totals.total * 12)}</strong> — à comparer au budget alloué chap. 012 dans le module Finances.
        </p>
      </Card>
    </div>
  )
}

// ─── Onglet Missions ──────────────────────────────────────────────────

function MissionsView() {
  const { people } = useTeam()
  const { records } = useEmployees()
  const { leaves } = useLeaveRequests()
  const { missions, hydrated, createMission, updateMission, deleteMission } = useMissions()

  const agents = useMemo(() => people.filter(p => p.role === 'agent' && p.active), [people])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Mission | null>(null)

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  const today = new Date().toISOString().slice(0, 10)
  const enCours = missions.filter(m => !m.dateFin || m.dateFin >= today).sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
  const passees = missions.filter(m => m.dateFin && m.dateFin < today).sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))

  return (
    <div>
      <HRKpis records={records} leaves={leaves} people={people} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <SectionHeader title={`Missions en cours (${enCours.length}) · passées (${passees.length})`} />
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>+ Nouvelle mission</Button>
      </div>

      {showForm && (
        <MissionForm
          agents={agents}
          initial={editing}
          onSubmit={(data) => {
            if (editing) updateMission(editing.id, data)
            else createMission(data)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {[
        ['En cours', enCours],
        ['Passées', passees],
      ].map(([label, list]) => (
        <div key={label as string} style={{ marginBottom: 'var(--gap)' }}>
          <p style={{ fontSize: 11, color: C.slate, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label as string}</p>
          {(list as Mission[]).length === 0 ? (
            <Card padding={20} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucune mission.</p>
            </Card>
          ) : (
            <Card padding={0}>
              {(list as Mission[]).map((m, i, arr) => {
                const p = people.find(x => x.id === m.personId)
                return (
                  <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.4fr 1fr 0.6fr', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p && <Avatar initials={p.initials} size={26} color={p.color} />}
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 500 }}>{p?.fullName ?? '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: C.fg, fontWeight: 600 }}>{m.label}</p>
                      {m.description && <p style={{ fontSize: 10, color: C.subtle }}>{m.description}</p>}
                    </div>
                    <p style={{ fontSize: 11, color: C.subtle }}>
                      {fmtDate(m.dateDebut)} {m.dateFin ? `→ ${fmtDate(m.dateFin)}` : '— en cours'}
                    </p>
                    <p style={{ fontSize: 11, color: C.fg }}>{m.lieu ?? '—'}</p>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditing(m); setShowForm(true) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>✎</button>
                      <button onClick={() => { if (confirm('Supprimer cette mission ?')) deleteMission(m.id) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}>×</button>
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}

function MissionForm({ agents, initial, onSubmit, onCancel }: {
  agents: Person[]
  initial: Mission | null
  onSubmit: (data: Omit<Mission, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [personId, setPersonId] = useState(initial?.personId ?? agents[0]?.id ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [dateDebut, setDateDebut] = useState(initial?.dateDebut ?? new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState(initial?.dateFin ?? '')
  const [lieu, setLieu] = useState(initial?.lieu ?? '')

  const valid = personId && label.trim() && dateDebut

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? 'Modifier la mission' : 'Nouvelle mission'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <Field label="Agent *">
          <select value={personId} onChange={e => setPersonId(e.target.value)} style={inputStyle}>
            {agents.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
        </Field>
        <Field label="Date de début *">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date de fin (vide = en cours)">
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Lieu">
          <input type="text" value={lieu} onChange={e => setLieu(e.target.value)} placeholder="ex: Route des Combes" style={inputStyle} />
        </Field>
      </div>
      <Field label="Intitulé *">
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Réfection signalétique" style={inputStyle} />
      </Field>
      <div style={{ marginTop: 10 }}>
        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            personId, label: label.trim(), description: description.trim() || undefined,
            dateDebut, dateFin: dateFin || undefined, lieu: lieu.trim() || undefined,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer la mission'}
        </Button>
      </div>
    </Card>
  )
}

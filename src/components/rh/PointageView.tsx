'use client'

import { useState, useMemo } from 'react'
import { Card, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { useTeam } from '@/hooks/useTeam'
import { useEmployees } from '@/hooks/useEmployees'
import { usePointages, isoWeek } from '@/hooks/usePointages'
import type { Person } from '@/lib/people'
import type { Pointage, PointageType, EmployeeRecord, ConfigHSup } from '@/lib/types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const fmtHours = (h: number) => {
  if (h === 0) return '0h00'
  const sign = h < 0 ? '-' : ''
  const abs = Math.abs(h)
  const hh = Math.floor(abs)
  const mm = Math.round((abs - hh) * 60)
  return `${sign}${hh}h${String(mm).padStart(2, '0')}`
}

const fmtMinutes = (m: number) => fmtHours(m / 60)

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

const TYPE_LABELS: Record<PointageType, string> = {
  'entree': '🟢 Entrée',
  'sortie': '🔴 Sortie',
  'pause-debut': '⏸ Début pause',
  'pause-fin': '▶ Fin pause',
}

interface PointageViewProps {
  currentUserId: string
  currentUser: Person | null
  // True si l'utilisateur peut voir tous les agents (hr.view-all ou hr.manage)
  canViewAll: boolean
  // True si l'utilisateur peut valider les pointages manuels (maire, responsable admin-finance, hr.validate-leaves)
  canValidate: boolean
}

export function PointageView({ currentUserId, currentUser, canViewAll, canValidate }: PointageViewProps) {
  const { people } = useTeam()
  const { records } = useEmployees()
  const {
    pointages, config, hydrated, enAttenteValidation,
    badger, ajouterManuel, validerPointage, refuserPointage, supprimerPointage,
    updateConfig,
    byPersonDay, minutesByDay, heuresTotalSemaine, hSupHebdo, hSupMensuel, isPresentNow,
  } = usePointages()

  const [tab, setTab] = useState<'me' | 'equipe' | 'validation' | 'config'>('me')
  const [showManualForm, setShowManualForm] = useState(false)

  const agents = useMemo(() => people.filter(p => p.role === 'agent' && p.active), [people])
  const myRecord = records.find(r => r.personId === currentUserId)

  // Suggestion : si l'utilisateur courant est un agent, on l'amène à "Mon pointage"
  // sinon "Équipe" (ou "Validation" s'il y a des demandes)
  const currentWeek = isoWeek(new Date().toISOString())
  const currentMonth = new Date().toISOString().slice(0, 7)

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  const visibleTabs: Array<['me' | 'equipe' | 'validation' | 'config', string]> = [
    ['me', 'Mon pointage'],
    canViewAll ? (['equipe', `Équipe (${agents.length})`] as ['equipe', string]) : null,
    canValidate ? (['validation', `À valider${enAttenteValidation.length > 0 ? ` (${enAttenteValidation.length})` : ''}`] as ['validation', string]) : null,
    canValidate ? (['config', '⚙ Seuils'] as ['config', string]) : null,
  ].filter((x): x is ['me' | 'equipe' | 'validation' | 'config', string] => x !== null)

  return (
    <div>
      {/* KPI bar */}
      <PointageKpis
        currentUserId={currentUserId}
        agents={agents}
        records={records}
        config={config}
        hSupHebdo={hSupHebdo}
        hSupMensuel={hSupMensuel}
        heuresTotalSemaine={heuresTotalSemaine}
        isPresentNow={isPresentNow}
        enAttenteValidation={enAttenteValidation}
        currentWeek={currentWeek}
        currentMonth={currentMonth}
        myRecord={myRecord}
      />

      {/* Sous-onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {visibleTabs.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: v === tab ? '#fff' : 'transparent',
                border: 'none',
                color: v === tab ? C.fg : C.muted,
                fontSize: 12, fontWeight: v === tab ? 600 : 400,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: v === tab ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {(tab === 'me' || tab === 'equipe') && (
          <Button variant="primary" size="sm" onClick={() => setShowManualForm(s => !s)}>
            {showManualForm ? 'Annuler' : '+ Saisie manuelle'}
          </Button>
        )}
      </div>

      {/* Formulaire de saisie manuelle (workflow validation) */}
      {showManualForm && (
        <ManualPointageForm
          agents={agents}
          defaultPersonId={currentUserId}
          createdById={currentUserId}
          canForcePersonId={canViewAll}
          onSubmit={(data) => {
            ajouterManuel(data)
            setShowManualForm(false)
          }}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {tab === 'me' && currentUser && (
        <MaPointageView
          person={currentUser}
          record={myRecord}
          config={config}
          pointages={pointages.filter(p => p.personId === currentUserId)}
          isPresent={isPresentNow(currentUserId)}
          onBadger={(type) => badger(currentUserId, type)}
          minutesByDay={minutesByDay(currentUserId)}
          heuresSemaine={heuresTotalSemaine(currentUserId, currentWeek)}
          hsupHebdo={hSupHebdo(currentUserId, currentWeek, myRecord)}
          hsupMensuel={hSupMensuel(currentUserId, currentMonth, myRecord)}
        />
      )}

      {tab === 'equipe' && canViewAll && (
        <EquipePointageView
          agents={agents}
          records={records}
          config={config}
          currentWeek={currentWeek}
          currentMonth={currentMonth}
          isPresentNow={isPresentNow}
          heuresTotalSemaine={heuresTotalSemaine}
          hSupHebdo={hSupHebdo}
          hSupMensuel={hSupMensuel}
        />
      )}

      {tab === 'validation' && canValidate && (
        <ValidationView
          enAttente={enAttenteValidation}
          people={people}
          onApprove={(id) => validerPointage(id, currentUserId)}
          onReject={(id, motif) => refuserPointage(id, currentUserId, motif)}
          onDelete={supprimerPointage}
        />
      )}

      {tab === 'config' && canValidate && (
        <ConfigView config={config} onUpdate={updateConfig} />
      )}
    </div>
  )
}

// ─── KPI bar ────────────────────────────────────────────────────────

function PointageKpis({
  currentUserId, agents, records, config, hSupHebdo, hSupMensuel, heuresTotalSemaine,
  isPresentNow, enAttenteValidation, currentWeek, currentMonth, myRecord,
}: {
  currentUserId: string
  agents: Person[]
  records: EmployeeRecord[]
  config: ConfigHSup
  hSupHebdo: (personId: string, week: string, emp?: EmployeeRecord) => number
  hSupMensuel: (personId: string, month: string, emp?: EmployeeRecord) => number
  heuresTotalSemaine: (personId: string, week: string) => number
  isPresentNow: (personId: string) => boolean
  enAttenteValidation: Pointage[]
  currentWeek: string
  currentMonth: string
  myRecord: EmployeeRecord | undefined
}) {
  // Pour l'agent connecté
  const myHsupSemaine = hSupHebdo(currentUserId, currentWeek, myRecord)
  const myHsupMois = hSupMensuel(currentUserId, currentMonth, myRecord)
  const myHeuresSemaine = heuresTotalSemaine(currentUserId, currentWeek)

  // Vue manager : combien d'agents sont présents, combien dépassent les seuils
  const presentsCount = agents.filter(a => isPresentNow(a.id)).length
  const enAlerte = agents.filter(a => {
    const r = records.find(x => x.personId === a.id)
    return hSupMensuel(a.id, currentMonth, r) > config.seuilAlerteMensuel
  })

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
      <KpiCard
        label="Mes heures cette semaine"
        value={fmtHours(myHeuresSemaine)}
        sub={myRecord ? `Réf : ${myRecord.tempsTravailHeures}h` : 'Hors ref.'}
        color={C.slate}
      />
      <KpiCard
        label="Mes HSup semaine"
        value={fmtHours(myHsupSemaine)}
        sub={myHsupSemaine > config.seuilAlerteHebdo ? `⚠ Seuil ${config.seuilAlerteHebdo}h dépassé` : 'OK'}
        color={myHsupSemaine > config.seuilAlerteHebdo ? C.danger : myHsupSemaine > 0 ? C.warning : C.success}
      />
      <KpiCard
        label="Mes HSup ce mois"
        value={fmtHours(myHsupMois)}
        sub={myHsupMois > config.seuilAlerteMensuel ? `⚠ Seuil ${config.seuilAlerteMensuel}h dépassé` : `Seuil : ${config.seuilAlerteMensuel}h`}
        color={myHsupMois > config.seuilAlerteMensuel ? C.danger : myHsupMois > config.seuilAlerteMensuel * 0.8 ? C.warning : C.green}
      />
      <KpiCard
        label="Présents"
        value={`${presentsCount} / ${agents.length}`}
        sub="agents au travail"
        color={C.green}
      />
      <KpiCard
        label="À valider"
        value={String(enAttenteValidation.length)}
        sub={enAlerte.length > 0 ? `${enAlerte.length} en alerte HSup` : 'aucune saisie'}
        color={enAttenteValidation.length > 0 ? C.warning : C.subtle}
      />
    </div>
  )
}

// ─── Vue Mon pointage (badger + planning de la semaine) ──────────────

function MaPointageView({
  person, record, config, pointages, isPresent, onBadger,
  minutesByDay, heuresSemaine, hsupHebdo, hsupMensuel,
}: {
  person: Person
  record: EmployeeRecord | undefined
  config: ConfigHSup
  pointages: Pointage[]
  isPresent: boolean
  onBadger: (type: PointageType) => void
  minutesByDay: Map<string, number>
  heuresSemaine: number
  hsupHebdo: number
  hsupMensuel: number
}) {
  const today = new Date().toISOString().slice(0, 10)
  const ptsToday = pointages
    .filter(p => p.timestamp.slice(0, 10) === today)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const lastPointage = ptsToday[ptsToday.length - 1] ?? null
  // Détermine quel bouton est disponible
  const canEntree = !lastPointage || lastPointage.type === 'sortie'
  const canSortie = lastPointage?.type === 'entree' || lastPointage?.type === 'pause-fin'
  const canPauseDebut = lastPointage?.type === 'entree' || lastPointage?.type === 'pause-fin'
  const canPauseFin = lastPointage?.type === 'pause-debut'

  // Récap semaine : les 7 derniers jours avec heures
  const last7Days: Array<{ date: string; minutes: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    last7Days.push({ date: iso, minutes: minutesByDay.get(iso) ?? 0 })
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--gap)' }}>
      {/* Boutons de pointage */}
      <Card style={{ flex: 1.2 }} padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Avatar initials={person.initials} size={56} color={isPresent ? C.success : C.subtle} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, color: C.fg, fontWeight: 700 }}>{person.fullName}</p>
            <p style={{ fontSize: 11, color: C.subtle }}>{person.poste}</p>
            <Badge
              label={isPresent ? '🟢 Au travail' : '○ Absent'}
              variant={isPresent ? 'success' : 'default'}
            />
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Pointer maintenant — {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <Button
            variant="primary"
            disabled={!canEntree}
            onClick={() => onBadger('entree')}
            style={{ height: 48, fontSize: 13, justifyContent: 'center' }}
          >
            🟢 Pointer ENTRÉE
          </Button>
          <Button
            variant="danger"
            disabled={!canSortie}
            onClick={() => onBadger('sortie')}
            style={{ height: 48, fontSize: 13, justifyContent: 'center' }}
          >
            🔴 Pointer SORTIE
          </Button>
          <Button
            disabled={!canPauseDebut}
            onClick={() => onBadger('pause-debut')}
            style={{ height: 36, fontSize: 12, justifyContent: 'center' }}
          >
            ⏸ Début pause
          </Button>
          <Button
            disabled={!canPauseFin}
            onClick={() => onBadger('pause-fin')}
            style={{ height: 36, fontSize: 12, justifyContent: 'center' }}
          >
            ▶ Fin pause
          </Button>
        </div>

        <Separator my={14} />

        <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Mes pointages d'aujourd'hui
        </p>
        {ptsToday.length === 0 ? (
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic', padding: '8px 0' }}>
            Aucun pointage encore. Cliquez sur "Pointer ENTRÉE" pour commencer la journée.
          </p>
        ) : (
          <div>
            {ptsToday.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ minWidth: 110 }}>{TYPE_LABELS[p.type]}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.fg, fontWeight: 600 }}>
                  {fmtTime(p.timestamp)}
                </span>
                {p.manuel && (
                  <Badge
                    label={p.validationStatut === 'Approuvée' ? 'Manuel ✓' : p.validationStatut === 'En attente' ? 'En attente' : 'Refusé'}
                    variant={p.validationStatut === 'Approuvée' ? 'success' : p.validationStatut === 'En attente' ? 'warning' : 'danger'}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Récap 7 derniers jours */}
      <Card style={{ flex: 1 }} padding={16}>
        <SectionHeader title="Mes 7 derniers jours" />
        {last7Days.map(d => {
          const date = new Date(d.date + 'T00:00:00')
          const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
          const isWeekend = [0, 6].includes(date.getDay())
          const hours = d.minutes / 60
          const ref = (record?.tempsTravailHeures ?? 35) / 5
          const overSeuil = hours > ref + 2
          return (
            <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
              <span style={{ flex: 1, color: isWeekend ? C.subtle : C.fg, textTransform: 'capitalize' }}>{dayName}</span>
              {d.minutes === 0 && !isWeekend && (
                <span style={{ fontSize: 10, color: C.subtle, fontStyle: 'italic' }}>—</span>
              )}
              {d.minutes > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: overSeuil ? C.warning : C.fg,
                  fontWeight: 600,
                }}>{fmtMinutes(d.minutes)}</span>
              )}
              {isWeekend && d.minutes === 0 && (
                <span style={{ fontSize: 10, color: C.subtle }}>WE</span>
              )}
            </div>
          )
        })}

        <Separator my={12} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: C.muted, fontWeight: 600 }}>Total semaine</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.fg, fontWeight: 700 }}>
            {fmtHours(heuresSemaine)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: C.muted }}>HSup semaine</span>
          <span style={{ color: hsupHebdo > config.seuilAlerteHebdo ? C.danger : hsupHebdo > 0 ? C.warning : C.success, fontWeight: 700 }}>
            {fmtHours(hsupHebdo)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: C.muted }}>HSup mois</span>
          <span style={{ color: hsupMensuel > config.seuilAlerteMensuel ? C.danger : C.fg, fontWeight: 700 }}>
            {fmtHours(hsupMensuel)}
          </span>
        </div>

        {(hsupHebdo > config.seuilAlerteHebdo || hsupMensuel > config.seuilAlerteMensuel) && (
          <div style={{ marginTop: 12, padding: 10, background: C.warningLight, border: `1px solid ${C.warning}40`, borderRadius: 6 }}>
            <p style={{ fontSize: 11, color: C.warning, fontWeight: 600 }}>
              ⚠ Seuil heures supplémentaires dépassé
            </p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              Une demande de récupération ou compensation peut être nécessaire.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Vue Équipe : tableau de tous les agents ────────────────────────

function EquipePointageView({
  agents, records, config, currentWeek, currentMonth,
  isPresentNow, heuresTotalSemaine, hSupHebdo, hSupMensuel,
}: {
  agents: Person[]
  records: EmployeeRecord[]
  config: ConfigHSup
  currentWeek: string
  currentMonth: string
  isPresentNow: (personId: string) => boolean
  heuresTotalSemaine: (personId: string, week: string) => number
  hSupHebdo: (personId: string, week: string, emp?: EmployeeRecord) => number
  hSupMensuel: (personId: string, month: string, emp?: EmployeeRecord) => number
}) {
  return (
    <Card padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 90px 110px 110px 80px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        {['Agent', 'Statut', 'Réf.', 'Sem. en cours', 'HSup semaine', 'HSup mois', 'Alerte'].map(h => (
          <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
        ))}
      </div>
      {agents.map((a, i) => {
        const r = records.find(x => x.personId === a.id)
        const present = isPresentNow(a.id)
        const heuresSem = heuresTotalSemaine(a.id, currentWeek)
        const hsupHebdo = hSupHebdo(a.id, currentWeek, r)
        const hsupMensuel = hSupMensuel(a.id, currentMonth, r)
        const enAlerte = hsupMensuel > config.seuilAlerteMensuel || hsupHebdo > config.seuilAlerteHebdo
        return (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 90px 110px 110px 80px', gap: 10, padding: '10px 14px', borderBottom: i < agents.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12, background: enAlerte ? `${C.danger}06` : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar initials={a.initials} size={26} color={present ? C.success : C.subtle} />
              <div>
                <p style={{ color: C.fg, fontWeight: 500 }}>{a.fullName}</p>
                <p style={{ fontSize: 10, color: C.subtle }}>{a.poste}</p>
              </div>
            </div>
            <Badge label={present ? 'Présent' : 'Absent'} variant={present ? 'success' : 'default'} />
            <span style={{ color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>{r?.tempsTravailHeures ?? 35}h</span>
            <span style={{ color: C.fg, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{fmtHours(heuresSem)}</span>
            <span style={{
              color: hsupHebdo > config.seuilAlerteHebdo ? C.danger : hsupHebdo > 0 ? C.warning : C.subtle,
              fontWeight: 600,
            }}>{fmtHours(hsupHebdo)}</span>
            <span style={{
              color: hsupMensuel > config.seuilAlerteMensuel ? C.danger : C.fg,
              fontWeight: 600,
            }}>{fmtHours(hsupMensuel)}</span>
            {enAlerte ? <Badge label="⚠" variant="danger" /> : <span style={{ color: C.success, fontSize: 14 }}>✓</span>}
          </div>
        )
      })}
    </Card>
  )
}

// ─── Vue Validation des saisies manuelles ───────────────────────────

function ValidationView({
  enAttente, people, onApprove, onReject, onDelete,
}: {
  enAttente: Pointage[]
  people: Person[]
  onApprove: (id: string) => void
  onReject: (id: string, motif: string) => void
  onDelete: (id: string) => void
}) {
  const [refusing, setRefusing] = useState<string | null>(null)
  const [motif, setMotif] = useState('')

  if (enAttente.length === 0) {
    return (
      <Card padding={32} style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: C.fg, fontWeight: 600, marginBottom: 4 }}>Aucune saisie en attente 👌</p>
        <p style={{ fontSize: 12, color: C.subtle }}>
          Les saisies manuelles de pointage des agents seront listées ici
          et nécessiteront votre validation.
        </p>
      </Card>
    )
  }

  return (
    <Card padding={0}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 2fr 1fr 200px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        {['Agent', 'Type', 'Date / Heure', 'Motif', 'Saisi le', 'Action'].map(h => (
          <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
        ))}
      </div>
      {enAttente.map((p, i) => {
        const agent = people.find(x => x.id === p.personId)
        return (
          <div key={p.id}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 2fr 1fr 200px', gap: 10, padding: '10px 14px', borderBottom: refusing === p.id ? 'none' : (i < enAttente.length - 1 ? `1px solid ${C.border}` : 'none'), alignItems: 'center', fontSize: 12, background: `${C.warning}06` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {agent && <Avatar initials={agent.initials} size={26} color={agent.color} />}
                <p style={{ color: C.fg, fontWeight: 500 }}>{agent?.fullName ?? '—'}</p>
              </div>
              <Tag label={TYPE_LABELS[p.type]} color={C.slate} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.fg, fontWeight: 600 }}>
                {fmtDateTime(p.timestamp)}
              </span>
              <p style={{ color: C.fg, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.motif ? `« ${p.motif} »` : <span style={{ color: C.subtle, fontStyle: 'italic' }}>aucun</span>}
              </p>
              <span style={{ color: C.subtle, fontSize: 11 }}>{fmtDateTime(p.createdAt)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="sm" variant="primary" onClick={() => onApprove(p.id)}>✓ Approuver</Button>
                <Button size="sm" variant="danger" onClick={() => { setRefusing(p.id); setMotif('') }}>✕ Refuser</Button>
                <button onClick={() => { if (confirm('Supprimer cette saisie ?')) onDelete(p.id) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11, color: C.subtle }}>×</button>
              </div>
            </div>
            {refusing === p.id && (
              <div style={{ padding: '12px 14px', background: C.dangerLight, borderBottom: i < enAttente.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>
                  Motif du refus (obligatoire)
                </p>
                <textarea
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  placeholder="Ex : pointage non justifié, horaires incohérents…"
                  rows={2}
                  style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8, marginBottom: 8 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!motif.trim()}
                    onClick={() => {
                      onReject(p.id, motif.trim())
                      setRefusing(null); setMotif('')
                    }}
                  >Confirmer le refus</Button>
                  <Button size="sm" onClick={() => { setRefusing(null); setMotif('') }}>Annuler</Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}

// ─── Formulaire de saisie manuelle ───────────────────────────────────

function ManualPointageForm({
  agents, defaultPersonId, createdById, canForcePersonId, onSubmit, onCancel,
}: {
  agents: Person[]
  defaultPersonId: string
  createdById: string
  canForcePersonId: boolean
  onSubmit: (data: { personId: string; type: PointageType; timestamp: string; motif: string; createdById: string }) => void
  onCancel: () => void
}) {
  const [personId, setPersonId] = useState(defaultPersonId)
  const [type, setType] = useState<PointageType>('entree')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [motif, setMotif] = useState('')

  const valid = personId && date && time && motif.trim().length >= 4

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title="Saisie manuelle d'un pointage" />
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
        Cette saisie sera <strong>en attente de validation</strong> par le maire ou un responsable
        de la commission Administration générale & Finances.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Agent *">
          {canForcePersonId ? (
            <select value={personId} onChange={e => setPersonId(e.target.value)} style={inputStyle}>
              {agents.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          ) : (
            <input type="text" value={agents.find(a => a.id === personId)?.fullName ?? ''} disabled style={{ ...inputStyle, background: C.bg }} />
          )}
        </Field>
        <Field label="Type *">
          <select value={type} onChange={e => setType(e.target.value as PointageType)} style={inputStyle}>
            <option value="entree">🟢 Entrée</option>
            <option value="sortie">🔴 Sortie</option>
            <option value="pause-debut">⏸ Début pause</option>
            <option value="pause-fin">▶ Fin pause</option>
          </select>
        </Field>
        <Field label="Date *">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Heure *">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <Field label="Motif * (oubli de badge, RDV extérieur…)">
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Ex : oubli de badger en sortie le matin"
          rows={2}
          style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }}
        />
      </Field>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            personId,
            type,
            timestamp: `${date}T${time}:00`,
            motif: motif.trim(),
            createdById,
          })}
        >
          Soumettre pour validation
        </Button>
      </div>
    </Card>
  )
}

// ─── Configuration des seuils ───────────────────────────────────────

function ConfigView({ config, onUpdate }: {
  config: ConfigHSup
  onUpdate: (patch: Partial<ConfigHSup>) => void
}) {
  const [draft, setDraft] = useState(config)
  const [saved, setSaved] = useState(false)

  const num = (v: string) => Number.isNaN(parseFloat(v)) ? 0 : parseFloat(v)

  return (
    <Card padding={20} style={{ maxWidth: 600 }}>
      <SectionHeader title="Configuration des heures supplémentaires" />
      <p style={{ fontSize: 12, color: C.subtle, marginBottom: 18 }}>
        Définissez les seuils au-delà desquels une alerte est affichée.
        Ces réglages sont appliqués à tous les agents (les heures contractuelles
        individuelles restent celles de chaque fiche RH).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <Field label="Heures hebdomadaires de référence (h)">
          <input
            type="number"
            min="0"
            step="0.5"
            value={draft.heuresHebdoReference}
            onChange={e => setDraft(d => ({ ...d, heuresHebdoReference: num(e.target.value) }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Pause déjeuner forfaitaire (minutes)">
          <input
            type="number"
            min="0"
            step="15"
            value={draft.pauseDejeunerMinutes}
            onChange={e => setDraft(d => ({ ...d, pauseDejeunerMinutes: num(e.target.value) }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Seuil d'alerte HSup hebdomadaire (h)">
          <input
            type="number"
            min="0"
            step="0.5"
            value={draft.seuilAlerteHebdo}
            onChange={e => setDraft(d => ({ ...d, seuilAlerteHebdo: num(e.target.value) }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Seuil d'alerte HSup mensuel (h)">
          <input
            type="number"
            min="0"
            step="1"
            value={draft.seuilAlerteMensuel}
            onChange={e => setDraft(d => ({ ...d, seuilAlerteMensuel: num(e.target.value) }))}
            style={inputStyle}
          />
        </Field>
      </div>

      {saved && (
        <p style={{ fontSize: 12, color: C.success, fontWeight: 600, marginBottom: 10 }}>
          ✓ Configuration enregistrée.
        </p>
      )}
      <Button
        variant="primary"
        onClick={() => { onUpdate(draft); setSaved(true); setTimeout(() => setSaved(false), 3000) }}
      >
        Enregistrer la configuration
      </Button>
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

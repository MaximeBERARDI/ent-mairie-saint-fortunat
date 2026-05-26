'use client'

import { useState, useMemo } from 'react'
import { Card, KpiCard } from '@/components/ui/Card'
import { DataList } from '@/components/ui/DataList'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { COLORS as C } from '@/lib/theme'
import { useParcImmobilier } from '@/hooks/useParcImmobilier'
import { useEcritures } from '@/hooks/useEcritures'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  openQuittancePreview, buildMailto, buildRelanceMailto,
} from '@/lib/quittance-pdf'
import type {
  BienImmobilier, Locataire, Bail, Quittance, TypeBien, StatutBail,
  ModeReglement, StatutQuittance,
} from '@/lib/types'

const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const fmtMontantDec = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtMois = (mois: string) => {
  const [y, m] = mois.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })

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

const TYPE_BIEN_OPTIONS: TypeBien[] = ['Logement', 'Local commercial', 'Atelier', 'Garage', 'Terrain', 'Autre']

type Subview = 'biens' | 'locataires' | 'baux' | 'quittances'

const currentMois = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function statutQuittanceVariant(s: StatutQuittance): 'warning' | 'success' | 'danger' | 'default' | 'terra' {
  switch (s) {
    case 'Payée': return 'success'
    case 'Émise': return 'warning'
    case 'Impayée': return 'danger'
    case 'Relancée': return 'terra'
    case 'À émettre': return 'default'
  }
}

export function ParcImmobilierView() {
  const {
    biens, locataires, baux, quittances, hydrated,
    createBien, updateBien, deleteBien,
    createLocataire, updateLocataire, deleteLocataire,
    createBail, updateBail, deleteBail,
    markPayee, markImpayee, markRelancee, deleteQuittance,
    genererQuittancesDuMois,
  } = useParcImmobilier()
  const { generateEncaissementLoyer, deleteEcrituresByQuittance } = useEcritures()
  const { currentUserId } = useCurrentUser()

  // Wraps : marquer payée déclenche aussi l'encaissement comptable.
  const handleMarkPayee = (id: string, mode: ModeReglement) => {
    const q = quittances.find(x => x.id === id)
    if (!q) return
    markPayee(id, mode)
    generateEncaissementLoyer({
      quittanceId: q.id,
      numero: q.numero,
      mois: q.mois,
      total: q.total,
      createdBy: currentUserId,
      date: new Date().toISOString().slice(0, 10),
    })
  }
  const handleMarkImpayee = (id: string) => {
    markImpayee(id)
    deleteEcrituresByQuittance(id)
  }
  const handleDeleteQuittance = (id: string) => {
    deleteQuittance(id)
    deleteEcrituresByQuittance(id)
  }

  const [tab, setTab] = useState<Subview>('biens')

  const baillEnCours = baux.filter(b => b.statut === 'En cours')

  // KPI globaux
  const kpis = useMemo(() => {
    const loyerMensuelAttendu = baillEnCours.reduce((acc, b) => acc + b.loyerMensuel + b.chargesMensuelles, 0)
    const moisCourant = currentMois()
    const qThisMonth = quittances.filter(q => q.mois === moisCourant)
    const impayes = quittances.filter(q => q.statut === 'Impayée' || q.statut === 'Relancée')
    const impayesMontant = impayes.reduce((acc, q) => acc + q.total, 0)
    return {
      nbBiens: biens.filter(b => b.active).length,
      nbBaux: baillEnCours.length,
      loyerMensuelAttendu,
      qThisMonth: qThisMonth.length,
      impayesCount: impayes.length,
      impayesMontant,
    }
  }, [biens, baillEnCours, quittances])

  if (!hydrated) {
    return <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
  }

  return (
    <div>
      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <KpiCard label="Biens du parc" value={String(kpis.nbBiens)} sub={`${kpis.nbBaux} baux en cours`} color={C.slate} />
        <KpiCard label="Loyer mensuel attendu" value={fmtMontant(kpis.loyerMensuelAttendu)} sub="loyers + charges" color={C.success} />
        <KpiCard label="Quittances ce mois" value={String(kpis.qThisMonth)} sub={fmtMois(currentMois())} color={C.green} />
        <KpiCard
          label="Impayés"
          value={String(kpis.impayesCount)}
          sub={kpis.impayesCount > 0 ? `${fmtMontant(kpis.impayesMontant)} dû` : 'aucun'}
          color={kpis.impayesCount > 0 ? C.danger : C.subtle}
        />
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([
            ['biens', `Biens (${biens.length})`],
            ['locataires', `Locataires (${locataires.length})`],
            ['baux', `Baux (${baillEnCours.length})`],
            ['quittances', `Quittances (${quittances.length})`],
          ] as [Subview, string][]).map(([v, label]) => (
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
      </div>

      {tab === 'biens' && (
        <BiensTab biens={biens} baux={baux} onCreate={createBien} onUpdate={updateBien} onDelete={deleteBien} />
      )}
      {tab === 'locataires' && (
        <LocatairesTab
          locataires={locataires}
          baux={baux}
          biens={biens}
          onCreate={createLocataire}
          onUpdate={updateLocataire}
          onDelete={deleteLocataire}
        />
      )}
      {tab === 'baux' && (
        <BauxTab
          baux={baux}
          biens={biens}
          locataires={locataires}
          onCreate={createBail}
          onUpdate={updateBail}
          onDelete={deleteBail}
        />
      )}
      {tab === 'quittances' && (
        <QuittancesTab
          quittances={quittances}
          baux={baux}
          biens={biens}
          locataires={locataires}
          onMarkPayee={handleMarkPayee}
          onMarkImpayee={handleMarkImpayee}
          onMarkRelancee={markRelancee}
          onDelete={handleDeleteQuittance}
          onGenererMois={genererQuittancesDuMois}
        />
      )}
    </div>
  )
}

// ─── Onglet Biens ────────────────────────────────────────────────────

function BiensTab({
  biens, baux, onCreate, onUpdate, onDelete,
}: {
  biens: BienImmobilier[]
  baux: Bail[]
  onCreate: ReturnType<typeof useParcImmobilier>['createBien']
  onUpdate: ReturnType<typeof useParcImmobilier>['updateBien']
  onDelete: ReturnType<typeof useParcImmobilier>['deleteBien']
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BienImmobilier | null>(null)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')

  const filtered = biens.filter(b =>
    filterActive === 'all' ? true : filterActive === 'active' ? b.active : !b.active,
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          ['active', 'Actifs'],
          ['inactive', 'Sortis du parc'],
          ['all', 'Tous'],
        ] as [typeof filterActive, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilterActive(v)}
            style={{ padding: '5px 12px', borderRadius: 20, background: v === filterActive ? C.green : '#fff', border: `1px solid ${v === filterActive ? C.green : C.border}`, color: v === filterActive ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filterActive ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouveau bien
        </Button>
      </div>

      {showForm && (
        <BienForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) onUpdate(editing.id, data)
            else onCreate(data)
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {filtered.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun bien dans cette catégorie.</p>
        </Card>
      ) : (
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1.5fr 1fr 70px 100px 120px 120px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Réf.', 'Nom', 'Type', 'Surface', 'Loyer + charges', 'Locataire', 'Actions'].map(h => (
              <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {filtered.map((b, i) => {
            const bail = baux.find(x => x.bienId === b.id && x.statut === 'En cours')
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '90px 1.5fr 1fr 70px 100px 120px 120px', gap: 10, padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12, opacity: b.active ? 1 : 0.6 }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle, fontSize: 11 }}>{b.reference}</p>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nom}</p>
                  <p style={{ fontSize: 10, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.adresse}</p>
                </div>
                <Tag label={b.type} color={C.slate} />
                <p style={{ color: C.fg }}>{b.surface} m²</p>
                <p style={{ color: C.fg, fontWeight: 600 }}>{fmtMontant(b.loyerMensuel + b.chargesMensuelles)}</p>
                <div style={{ minWidth: 0 }}>
                  {bail ? <Badge label="Loué" variant="success" /> : <Badge label="Vacant" variant="warning" />}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditing(b); setShowForm(true) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>✎</button>
                  <button
                    onClick={() => {
                      if (bail) {
                        alert('Ce bien a un bail en cours — résiliez-le d\'abord.')
                        return
                      }
                      if (confirm(`Supprimer ${b.nom} ?`)) onDelete(b.id)
                    }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function BienForm({ initial, onSubmit, onCancel }: {
  initial: BienImmobilier | null
  onSubmit: (data: Omit<BienImmobilier, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [reference, setReference] = useState(initial?.reference ?? `IMM-${String(Date.now()).slice(-3)}`)
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [type, setType] = useState<TypeBien>(initial?.type ?? 'Logement')
  const [adresse, setAdresse] = useState(initial?.adresse ?? '')
  const [surface, setSurface] = useState(String(initial?.surface ?? ''))
  const [pieces, setPieces] = useState(String(initial?.pieces ?? ''))
  const [loyerMensuel, setLoyerMensuel] = useState(String(initial?.loyerMensuel ?? ''))
  const [chargesMensuelles, setChargesMensuelles] = useState(String(initial?.chargesMensuelles ?? ''))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [active, setActive] = useState(initial?.active ?? true)

  const num = (s: string) => Number.isNaN(parseFloat(s)) ? 0 : parseFloat(s)
  const valid = nom.trim() && adresse.trim() && num(loyerMensuel) > 0

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? `Modifier ${initial.nom}` : 'Nouveau bien immobilier'} />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 2fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Référence *">
          <input type="text" value={reference} onChange={e => setReference(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Nom du bien *">
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="ex: 12 rue de l'Église — Logement T3" style={inputStyle} />
        </Field>
        <Field label="Type *">
          <select value={type} onChange={e => setType(e.target.value as TypeBien)} style={inputStyle}>
            {TYPE_BIEN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Adresse *">
        <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
        <Field label="Surface (m²) *">
          <input type="number" min="0" value={surface} onChange={e => setSurface(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Nb. pièces (logement)">
          <input type="number" min="0" value={pieces} onChange={e => setPieces(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Loyer mensuel HC (€) *">
          <input type="number" min="0" step="0.01" value={loyerMensuel} onChange={e => setLoyerMensuel(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges mensuelles (€)">
          <input type="number" min="0" step="0.01" value={chargesMensuelles} onChange={e => setChargesMensuelles(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="Notes (facultatif)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: C.fg, cursor: 'pointer' }}>
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ accentColor: C.green }} />
        Bien actif (présent dans le parc)
      </label>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            reference: reference.trim(),
            nom: nom.trim(),
            type,
            adresse: adresse.trim(),
            surface: num(surface),
            pieces: pieces ? parseInt(pieces, 10) : undefined,
            loyerMensuel: num(loyerMensuel),
            chargesMensuelles: num(chargesMensuelles),
            notes: notes.trim() || undefined,
            active,
            documents: initial?.documents,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer le bien'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Onglet Locataires ───────────────────────────────────────────────

function LocatairesTab({
  locataires, baux, biens, onCreate, onUpdate, onDelete,
}: {
  locataires: Locataire[]
  baux: Bail[]
  biens: BienImmobilier[]
  onCreate: ReturnType<typeof useParcImmobilier>['createLocataire']
  onUpdate: ReturnType<typeof useParcImmobilier>['updateLocataire']
  onDelete: ReturnType<typeof useParcImmobilier>['deleteLocataire']
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Locataire | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouveau locataire
        </Button>
      </div>

      {showForm && (
        <LocataireForm
          initial={editing}
          onSubmit={(data) => {
            if (editing) onUpdate(editing.id, data)
            else onCreate(data)
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {locataires.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun locataire.</p>
        </Card>
      ) : (
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1.5fr 80px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['', 'Nom', 'Email', 'Téléphone', 'Bien loué', 'Actions'].map(h => (
              <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {locataires.map((l, i) => {
            const bail = baux.find(b => b.locataireId === l.id && b.statut === 'En cours')
            const bien = bail ? biens.find(b => b.id === bail.bienId) : null
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1.5fr 80px', gap: 10, padding: '10px 14px', borderBottom: i < locataires.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
                <Avatar initials={`${l.prenom[0] ?? ''}${l.nom[0] ?? ''}`.toUpperCase()} size={28} color={C.terra} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.fullName}</p>
                  {l.notes && <p style={{ fontSize: 10, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.notes}</p>}
                </div>
                <p style={{ color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.email ?? '—'}</p>
                <p style={{ color: C.subtle }}>{l.phone ?? '—'}</p>
                <p style={{ color: C.fg, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bien ? bien.nom : <span style={{ color: C.subtle, fontStyle: 'italic' }}>aucun bien</span>}
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditing(l); setShowForm(true) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>✎</button>
                  <button
                    onClick={() => {
                      if (bail) { alert('Ce locataire a un bail en cours.'); return }
                      if (confirm(`Supprimer ${l.fullName} ?`)) onDelete(l.id)
                    }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function LocataireForm({ initial, onSubmit, onCancel }: {
  initial: Locataire | null
  onSubmit: (data: Omit<Locataire, 'id' | 'createdAt' | 'fullName'>) => void
  onCancel: () => void
}) {
  const [prenom, setPrenom] = useState(initial?.prenom ?? '')
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [adresseFacturation, setAdresseFacturation] = useState(initial?.adresseFacturation ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const valid = prenom.trim() && nom.trim()

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? `Modifier ${initial.fullName}` : 'Nouveau locataire'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Prénom *">
          <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Nom *">
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Téléphone">
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="Adresse de facturation (si différente du bien loué)">
          <input type="text" value={adresseFacturation} onChange={e => setAdresseFacturation(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="Notes (SIRET, contexte…)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            prenom: prenom.trim(),
            nom: nom.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            adresseFacturation: adresseFacturation.trim() || undefined,
            notes: notes.trim() || undefined,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer le locataire'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Onglet Baux ─────────────────────────────────────────────────────

function BauxTab({
  baux, biens, locataires, onCreate, onUpdate, onDelete,
}: {
  baux: Bail[]
  biens: BienImmobilier[]
  locataires: Locataire[]
  onCreate: ReturnType<typeof useParcImmobilier>['createBail']
  onUpdate: ReturnType<typeof useParcImmobilier>['updateBail']
  onDelete: ReturnType<typeof useParcImmobilier>['deleteBail']
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Bail | null>(null)
  const [filter, setFilter] = useState<StatutBail | 'tous'>('En cours')

  const filtered = baux.filter(b => filter === 'tous' || b.statut === filter)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          ['En cours', 'En cours'],
          ['Préavis', 'En préavis'],
          ['Terminé', 'Terminés'],
          ['tous', 'Tous'],
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
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouveau bail
        </Button>
      </div>

      {showForm && (
        <BailForm
          biens={biens}
          locataires={locataires}
          initial={editing}
          onSubmit={(data) => {
            if (editing) onUpdate(editing.id, data)
            else onCreate(data)
            setShowForm(false); setEditing(null)
          }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {filtered.length === 0 ? (
        <Card padding={24} style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.subtle, fontStyle: 'italic' }}>Aucun bail dans cette catégorie.</p>
        </Card>
      ) : (
        <Card padding={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 100px 100px 80px', gap: 10, padding: '8px 14px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Bien', 'Locataire', 'Début', 'Fin', 'Loyer + ch.', 'Statut', 'Actions'].map(h => (
              <p key={h} style={{ fontSize: 10, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
            ))}
          </div>
          {filtered.map((b, i) => {
            const bien = biens.find(x => x.id === b.bienId)
            const locataire = locataires.find(x => x.id === b.locataireId)
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 100px 100px 80px', gap: 10, padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', fontSize: 12 }}>
                <p style={{ color: C.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bien?.nom ?? '—'}
                </p>
                <p style={{ color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {locataire?.fullName ?? '—'}
                </p>
                <p style={{ color: C.subtle }}>{fmtDate(b.dateDebut)}</p>
                <p style={{ color: C.subtle }}>{b.dateFin ? fmtDate(b.dateFin) : <em style={{ color: C.subtle }}>indéterminée</em>}</p>
                <p style={{ color: C.fg, fontWeight: 600 }}>{fmtMontant(b.loyerMensuel + b.chargesMensuelles)}</p>
                <Badge label={b.statut} variant={b.statut === 'En cours' ? 'success' : b.statut === 'Préavis' ? 'warning' : 'default'} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditing(b); setShowForm(true) }} style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 11 }}>✎</button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce bail ? Les quittances liées resteront en base.')) onDelete(b.id) }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: `1px solid ${C.danger}`, background: C.dangerLight, color: C.danger, cursor: 'pointer', fontSize: 11 }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function BailForm({ biens, locataires, initial, onSubmit, onCancel }: {
  biens: BienImmobilier[]
  locataires: Locataire[]
  initial: Bail | null
  onSubmit: (data: Omit<Bail, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [bienId, setBienId] = useState(initial?.bienId ?? biens[0]?.id ?? '')
  const [locataireId, setLocataireId] = useState(initial?.locataireId ?? locataires[0]?.id ?? '')
  const [dateDebut, setDateDebut] = useState(initial?.dateDebut ?? new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState(initial?.dateFin ?? '')

  const selectedBien = biens.find(b => b.id === bienId)
  const [loyerMensuel, setLoyerMensuel] = useState(String(initial?.loyerMensuel ?? selectedBien?.loyerMensuel ?? ''))
  const [chargesMensuelles, setChargesMensuelles] = useState(String(initial?.chargesMensuelles ?? selectedBien?.chargesMensuelles ?? ''))
  const [depotGarantie, setDepotGarantie] = useState(String(initial?.depotGarantie ?? selectedBien?.loyerMensuel ?? ''))
  const [statut, setStatut] = useState<StatutBail>(initial?.statut ?? 'En cours')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const num = (s: string) => Number.isNaN(parseFloat(s)) ? 0 : parseFloat(s)
  const valid = bienId && locataireId && dateDebut && num(loyerMensuel) > 0

  return (
    <Card padding={14} style={{ marginBottom: 12, background: C.greenLight, borderColor: C.green }}>
      <SectionHeader title={initial ? 'Modifier le bail' : 'Nouveau bail'} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Bien *">
          <select value={bienId} onChange={e => setBienId(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionner —</option>
            {biens.filter(b => b.active).map(b => (
              <option key={b.id} value={b.id}>{b.reference} — {b.nom}</option>
            ))}
          </select>
        </Field>
        <Field label="Locataire *">
          <select value={locataireId} onChange={e => setLocataireId(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionner —</option>
            {locataires.map(l => (
              <option key={l.id} value={l.id}>{l.fullName}</option>
            ))}
          </select>
        </Field>
        <Field label="Date de début *">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date de fin (vide = indéterminée)">
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <Field label="Loyer mensuel HC (€) *">
          <input type="number" min="0" step="0.01" value={loyerMensuel} onChange={e => setLoyerMensuel(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Charges mensuelles (€)">
          <input type="number" min="0" step="0.01" value={chargesMensuelles} onChange={e => setChargesMensuelles(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Dépôt de garantie (€)">
          <input type="number" min="0" step="0.01" value={depotGarantie} onChange={e => setDepotGarantie(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Statut">
          <select value={statut} onChange={e => setStatut(e.target.value as StatutBail)} style={inputStyle}>
            <option value="En cours">En cours</option>
            <option value="Préavis">En préavis</option>
            <option value="Terminé">Terminé</option>
          </select>
        </Field>
      </div>
      <Field label="Notes (clauses particulières…)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const, padding: 8 }} />
      </Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button
          variant="primary"
          disabled={!valid}
          onClick={() => valid && onSubmit({
            bienId, locataireId, dateDebut,
            dateFin: dateFin || undefined,
            loyerMensuel: num(loyerMensuel),
            chargesMensuelles: num(chargesMensuelles),
            depotGarantie: num(depotGarantie),
            statut,
            notes: notes.trim() || undefined,
            documents: initial?.documents,
          })}
        >
          {initial ? 'Enregistrer' : 'Créer le bail'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Onglet Quittances ───────────────────────────────────────────────

function QuittancesTab({
  quittances, baux, biens, locataires,
  onMarkPayee, onMarkImpayee, onMarkRelancee, onDelete, onGenererMois,
}: {
  quittances: Quittance[]
  baux: Bail[]
  biens: BienImmobilier[]
  locataires: Locataire[]
  onMarkPayee: (id: string, mode: ModeReglement) => void
  onMarkImpayee: (id: string) => void
  onMarkRelancee: (id: string) => void
  onDelete: (id: string) => void
  onGenererMois: (mois: string) => Quittance[]
}) {
  const [filterStatut, setFilterStatut] = useState<StatutQuittance | 'tous' | 'impayes'>('tous')
  const [moisAGenerer, setMoisAGenerer] = useState(currentMois())
  const [feedbackGen, setFeedbackGen] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return quittances
      .filter(q => {
        if (filterStatut === 'tous') return true
        if (filterStatut === 'impayes') return q.statut === 'Impayée' || q.statut === 'Relancée'
        return q.statut === filterStatut
      })
      .sort((a, b) => b.mois.localeCompare(a.mois) || b.numero.localeCompare(a.numero))
  }, [quittances, filterStatut])

  const handleGenerer = () => {
    const created = onGenererMois(moisAGenerer)
    setFeedbackGen(`${created.length} quittance${created.length > 1 ? 's' : ''} générée${created.length > 1 ? 's' : ''} pour ${fmtMois(moisAGenerer)}.`)
    setTimeout(() => setFeedbackGen(null), 5000)
  }

  return (
    <div>
      {/* Génération du mois */}
      <Card padding={14} style={{ marginBottom: 12, background: `${C.green}08`, borderColor: `${C.green}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: C.fg, fontWeight: 600, flex: 1, minWidth: 200 }}>
            Générer les quittances mensuelles pour tous les baux en cours
          </p>
          <input
            type="month"
            value={moisAGenerer}
            onChange={e => setMoisAGenerer(e.target.value)}
            style={{ ...inputStyle, width: 160 }}
          />
          <Button variant="primary" size="sm" onClick={handleGenerer}>
            🧾 Générer pour {fmtMois(moisAGenerer)}
          </Button>
        </div>
        {feedbackGen && (
          <p style={{ fontSize: 12, color: C.success, fontWeight: 600, marginTop: 8 }}>✓ {feedbackGen}</p>
        )}
      </Card>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          ['tous', `Toutes (${quittances.length})`],
          ['impayes', `Impayés (${quittances.filter(q => q.statut === 'Impayée' || q.statut === 'Relancée').length})`],
          ['Émise', 'Émises'],
          ['Payée', 'Payées'],
        ] as [typeof filterStatut, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilterStatut(v)}
            style={{ padding: '5px 12px', borderRadius: 20, background: v === filterStatut ? C.green : '#fff', border: `1px solid ${v === filterStatut ? C.green : C.border}`, color: v === filterStatut ? '#fff' : C.muted, fontSize: 11, fontWeight: v === filterStatut ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {label}
          </button>
        ))}
      </div>

      <DataList
        rows={filtered}
        rowKey={(q) => q.id}
        emptyMessage="Aucune quittance."
        columns={[
          {
            key: 'numero',
            label: 'N°',
            width: '120px',
            primaryOnMobile: true,
            render: (q) => <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.subtle, fontSize: 12 }}>{q.numero}</span>,
          },
          {
            key: 'mois',
            label: 'Mois',
            width: '110px',
            secondaryOnMobile: true,
            render: (q) => <span style={{ color: C.fg, textTransform: 'capitalize' }}>{fmtMois(q.mois)}</span>,
          },
          {
            key: 'bien',
            label: 'Bien',
            width: '1.5fr',
            hideOnMedium: true,
            render: (q) => {
              const bail = baux.find(b => b.id === q.bailId)
              const bien = bail ? biens.find(x => x.id === bail.bienId) : null
              return <span style={{ color: C.fg, fontWeight: 500 }}>{bien?.nom ?? '—'}</span>
            },
          },
          {
            key: 'locataire',
            label: 'Locataire',
            width: '1fr',
            render: (q) => {
              const bail = baux.find(b => b.id === q.bailId)
              const locataire = bail ? locataires.find(x => x.id === bail.locataireId) : null
              return <span style={{ color: C.fg }}>{locataire?.fullName ?? '—'}</span>
            },
          },
          {
            key: 'total',
            label: 'Total',
            width: '110px',
            align: 'right',
            render: (q) => <span style={{ color: C.fg, fontWeight: 700 }}>{fmtMontantDec(q.total)}</span>,
          },
          {
            key: 'statut',
            label: 'Statut',
            width: '120px',
            render: (q) => <Badge label={q.statut} variant={statutQuittanceVariant(q.statut)} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '230px',
            align: 'right',
            render: (q) => {
              const bail = baux.find(b => b.id === q.bailId)
              const bien = bail ? biens.find(x => x.id === bail.bienId) : null
              const locataire = bail ? locataires.find(x => x.id === bail.locataireId) : null
              return (
                <QuittanceActions
                  quittance={q}
                  bail={bail}
                  bien={bien}
                  locataire={locataire}
                  onMarkPayee={onMarkPayee}
                  onMarkImpayee={onMarkImpayee}
                  onMarkRelancee={onMarkRelancee}
                  onDelete={onDelete}
                />
              )
            },
          },
        ]}
      />
    </div>
  )
}

function QuittanceActions({
  quittance, bail, bien, locataire,
  onMarkPayee, onMarkImpayee, onMarkRelancee, onDelete,
}: {
  quittance: Quittance
  bail: Bail | null | undefined
  bien: BienImmobilier | null | undefined
  locataire: Locataire | null | undefined
  onMarkPayee: (id: string, mode: ModeReglement) => void
  onMarkImpayee: (id: string) => void
  onMarkRelancee: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showPayee, setShowPayee] = useState(false)
  const [mode, setMode] = useState<ModeReglement>('Virement')

  const handlePreview = () => {
    if (!bail || !bien || !locataire) return
    openQuittancePreview({ quittance, bail, bien, locataire })
  }

  const handleEnvoyer = () => {
    if (!bien || !locataire || !locataire.email) {
      alert('Le locataire n\'a pas d\'email enregistré.')
      return
    }
    window.location.href = buildMailto(quittance, bien, locataire)
  }

  const handleRelancer = () => {
    if (!bien || !locataire || !locataire.email) {
      alert('Le locataire n\'a pas d\'email enregistré.')
      return
    }
    onMarkRelancee(quittance.id)
    window.location.href = buildRelanceMailto(quittance, bien, locataire)
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={handlePreview} title="Aperçu PDF" style={btnIcon}>🧾</button>
      <button onClick={handleEnvoyer} title="Envoyer par email" style={btnIcon} disabled={!locataire?.email}>✉</button>
      {(quittance.statut === 'Émise' || quittance.statut === 'Impayée' || quittance.statut === 'Relancée') && (
        showPayee ? (
          <>
            <select value={mode} onChange={e => setMode(e.target.value as ModeReglement)} style={{ ...inputStyle, height: 26, fontSize: 11, padding: '0 6px', width: 100 }}>
              <option value="Virement">Virement</option>
              <option value="Chèque">Chèque</option>
              <option value="Espèces">Espèces</option>
              <option value="Prélèvement">Prélèvement</option>
            </select>
            <button onClick={() => { onMarkPayee(quittance.id, mode); setShowPayee(false) }} title="Confirmer" style={{ ...btnIcon, borderColor: C.success, background: C.successLight, color: C.success }}>✓</button>
            <button onClick={() => setShowPayee(false)} style={btnIcon}>×</button>
          </>
        ) : (
          <button onClick={() => setShowPayee(true)} title="Marquer payée" style={{ ...btnIcon, borderColor: C.success, background: C.successLight, color: C.success }}>€✓</button>
        )
      )}
      {(quittance.statut === 'Émise' || quittance.statut === 'Impayée') && (
        <button onClick={handleRelancer} title="Envoyer relance" style={{ ...btnIcon, borderColor: C.warning, background: C.warningLight, color: C.warning }} disabled={!locataire?.email}>⏰</button>
      )}
      {quittance.statut === 'Émise' && (
        <button onClick={() => onMarkImpayee(quittance.id)} title="Marquer impayée" style={{ ...btnIcon, borderColor: C.danger, color: C.danger }}>!</button>
      )}
      <button onClick={() => { if (confirm('Supprimer cette quittance ?')) onDelete(quittance.id) }} title="Supprimer" style={{ ...btnIcon, borderColor: C.border, color: C.subtle }}>×</button>
    </div>
  )
}

const btnIcon: React.CSSProperties = {
  padding: '3px 7px',
  borderRadius: 4,
  border: `1px solid ${C.border}`,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: "'DM Sans', sans-serif",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: C.subtle, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}

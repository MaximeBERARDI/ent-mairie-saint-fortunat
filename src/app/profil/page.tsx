'use client'

import { useState, useRef, useEffect } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Separator } from '@/components/ui/Separator'
import { Tag } from '@/components/ui/Tag'
import { COLORS as C } from '@/lib/theme'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'
import { AUTH_LEVEL_LABELS, AUTH_LEVEL_DESCRIPTIONS } from '@/lib/permissions'

const STORAGE_PREFS = 'ent-mairie:profil-prefs:v1'

interface NotifPrefs {
  emailTaskAssigned: boolean
  emailTaskValidation: boolean
  emailSignature: boolean
  emailFactureValidation: boolean
  emailLeaveApproved: boolean
  emailWeeklyDigest: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  emailTaskAssigned: true,
  emailTaskValidation: true,
  emailSignature: true,
  emailFactureValidation: true,
  emailLeaveApproved: true,
  emailWeeklyDigest: false,
}

function loadPrefs(personId: string): NotifPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFS}:${personId}`)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(personId: string, prefs: NotifPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${STORAGE_PREFS}:${personId}`, JSON.stringify(prefs))
  } catch {}
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 12px',
  border: `1px solid ${C.border}`, borderRadius: 6,
  background: '#fff', fontSize: 13, color: C.fg,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

export default function ProfilPage() {
  const { currentUser, currentUserId, hydrated } = useCurrentUser()
  const { setPassword: setPwd, verifyPassword } = useAuth()
  const { updatePerson } = useTeam()

  const [tab, setTab] = useState<'infos' | 'securite' | 'notifications'>('infos')

  // Champs identité
  const [phone, setPhone] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // Champs sécurité
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdOk, setPwdOk] = useState(false)

  // Préférences notifications
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)

  useEffect(() => {
    if (!currentUser) return
    setPhone(currentUser.phone ?? '')
    setPrefs(loadPrefs(currentUser.id))
    // Charger la photo persistée pour ce profil
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(`ent-mairie:profil-photo:${currentUser.id}`)
        setPhotoDataUrl(stored)
      } catch {}
    }
  }, [currentUserId, currentUser])

  if (!hydrated || !currentUser) {
    return (
      <Shell title="Mon profil">
        <p style={{ padding: 20, fontSize: 12, color: C.subtle }}>Chargement…</p>
      </Shell>
    )
  }

  const handleSaveInfos = () => {
    updatePerson(currentUser.id, { phone: phone.trim() || undefined })
    setSavedMsg('Profil mis à jour.')
    setTimeout(() => setSavedMsg(null), 3000)
  }

  const handleChangePwd = () => {
    setPwdError(null)
    setPwdOk(false)
    if (!verifyPassword(currentUser.email, oldPwd)) {
      setPwdError('Mot de passe actuel incorrect.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    if (newPwd.length < 8) {
      setPwdError('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    const result = setPwd(currentUser.email, newPwd)
    if (!result.ok) {
      setPwdError(result.error ?? 'Échec.')
      return
    }
    setPwdOk(true)
    setOldPwd(''); setNewPwd(''); setConfirmPwd('')
    setTimeout(() => setPwdOk(false), 3000)
  }

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return
    if (file.size > 1024 * 1024) {
      alert('La photo doit faire moins de 1 Mo.')
      return
    }
    if (!currentUser) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPhotoDataUrl(dataUrl)
      // Persister dans localStorage par profil
      try {
        window.localStorage.setItem(`ent-mairie:profil-photo:${currentUser.id}`, dataUrl)
      } catch {
        alert('Impossible d\'enregistrer la photo (espace de stockage saturé).')
      }
    }
    reader.readAsDataURL(file)
  }

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePrefs(currentUser.id, next)
  }

  return (
    <Shell title="Mon profil">
      {/* En-tête profil */}
      <Card padding={20} style={{ marginBottom: 'var(--gap)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            {photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDataUrl}
                alt={currentUser.fullName}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }}
              />
            ) : (
              <Avatar initials={currentUser.initials} size={80} color={currentUser.color} />
            )}
            <button
              onClick={() => photoInputRef.current?.click()}
              aria-label="Modifier la photo"
              title="Changer la photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: '#fff', border: `1px solid ${C.border}`,
                cursor: 'pointer', fontSize: 12, padding: 0,
              }}
            >📷</button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={e => handlePhotoUpload(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 22, color: C.fg, fontWeight: 700 }}>{currentUser.fullName}</p>
            <p style={{ fontSize: 13, color: C.subtle }}>{currentUser.poste}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Badge label={AUTH_LEVEL_LABELS[currentUser.authLevel]} variant="primary" />
              {currentUser.canSign && <Badge label="Signataire" variant="success" />}
              {currentUser.role === 'maire' && <Tag label="Maire" color={C.green} />}
              {currentUser.role === 'adjoint' && <Tag label="Adjoint" color={C.terra} />}
              {currentUser.role === 'agent' && <Tag label="Agent" color={C.slate} />}
            </div>
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, background: C.ph, borderRadius: 8, padding: 3 }}>
          {([
            ['infos', 'Informations'],
            ['securite', 'Sécurité'],
            ['notifications', 'Notifications'],
          ] as ['infos' | 'securite' | 'notifications', string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                padding: '5px 14px', borderRadius: 6,
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

      {tab === 'infos' && (
        <Card padding={20}>
          <SectionHeader title="Informations personnelles" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Prénom">
              <input type="text" value={currentUser.prenom} disabled style={{ ...inputStyle, background: C.bg }} />
            </Field>
            <Field label="Nom">
              <input type="text" value={currentUser.nom} disabled style={{ ...inputStyle, background: C.bg }} />
            </Field>
            <Field label="Email professionnel">
              <input type="email" value={currentUser.email} disabled style={{ ...inputStyle, background: C.bg }} />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                style={inputStyle}
              />
            </Field>
            <Field label="Poste">
              <input type="text" value={currentUser.poste} disabled style={{ ...inputStyle, background: C.bg }} />
            </Field>
            <Field label="En poste depuis">
              <input
                type="text"
                value={currentUser.startDate
                  ? new Date(currentUser.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
                disabled
                style={{ ...inputStyle, background: C.bg }}
              />
            </Field>
          </div>
          <p style={{ fontSize: 11, color: C.subtle, marginBottom: 14 }}>
            Le prénom, nom, email et poste sont gérés par les administrateurs depuis le module Équipe.
            Pour les modifier, contactez la Direction Générale des Services.
          </p>
          {savedMsg && (
            <p style={{ fontSize: 12, color: C.success, fontWeight: 600, marginBottom: 10 }}>✓ {savedMsg}</p>
          )}
          <Button variant="primary" size="sm" onClick={handleSaveInfos}>Enregistrer</Button>
        </Card>
      )}

      {tab === 'securite' && (
        <Card padding={20}>
          <SectionHeader title="Sécurité du compte" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 16 }}>
            Modifiez votre mot de passe. Il doit faire au moins 8 caractères et idéalement
            mélanger lettres, chiffres et caractères spéciaux.
          </p>
          <div style={{ maxWidth: 420 }}>
            <div style={{ marginBottom: 12 }}>
              <Field label="Mot de passe actuel">
                <input
                  type="password"
                  value={oldPwd}
                  onChange={e => setOldPwd(e.target.value)}
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Field label="Nouveau mot de passe (8 caractères min.)">
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Field label="Confirmer le nouveau mot de passe">
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </Field>
            </div>

            {pwdError && (
              <div style={{
                padding: '10px 12px', marginBottom: 14,
                background: C.dangerLight, border: `1px solid ${C.danger}40`,
                borderRadius: 6, color: C.danger, fontSize: 12,
              }}>
                {pwdError}
              </div>
            )}
            {pwdOk && (
              <div style={{
                padding: '10px 12px', marginBottom: 14,
                background: C.successLight, border: `1px solid ${C.success}40`,
                borderRadius: 6, color: C.success, fontSize: 12,
              }}>
                ✓ Mot de passe modifié.
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={!oldPwd || !newPwd || !confirmPwd}
              onClick={handleChangePwd}
            >
              Modifier le mot de passe
            </Button>
          </div>

          <Separator my={20} />

          <SectionHeader title="Niveau d'autorisation" />
          <div style={{ padding: 14, background: C.bg, borderRadius: 6 }}>
            <p style={{ fontSize: 13, color: C.fg, fontWeight: 700, marginBottom: 4 }}>
              {AUTH_LEVEL_LABELS[currentUser.authLevel]}
            </p>
            <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              {AUTH_LEVEL_DESCRIPTIONS[currentUser.authLevel]}
            </p>
            {currentUser.customPermissions && currentUser.customPermissions.length > 0 && (
              <p style={{ fontSize: 11, color: C.subtle, marginTop: 6, fontStyle: 'italic' }}>
                {currentUser.customPermissions.length} permission(s) personnalisée(s) accordée(s) en plus du niveau.
              </p>
            )}
          </div>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card padding={20}>
          <SectionHeader title="Notifications par email" />
          <p style={{ fontSize: 12, color: C.subtle, marginBottom: 18 }}>
            Choisissez les évènements pour lesquels vous souhaitez recevoir un email.
            <br />
            <em>Note : l'envoi effectif des emails sera activé lors de la mise en production avec le back-end.</em>
          </p>

          {([
            ['emailTaskAssigned', 'Une nouvelle tâche m\'est assignée'],
            ['emailTaskValidation', 'Une tâche attend ma validation'],
            ['emailSignature', 'Une signature m\'est demandée'],
            ['emailFactureValidation', 'Une facture attend ma validation'],
            ['emailLeaveApproved', 'Ma demande de congés a été approuvée ou refusée'],
            ['emailWeeklyDigest', 'Récapitulatif hebdomadaire (chaque lundi)'],
          ] as [keyof NotifPrefs, string][]).map(([key, label]) => (
            <PrefRow
              key={key}
              label={label}
              checked={prefs[key]}
              onChange={(v) => updatePref(key, v)}
            />
          ))}
        </Card>
      )}
    </Shell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {children}
    </div>
  )
}

function PrefRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0', borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.green }}
      />
      <span style={{ flex: 1, fontSize: 13, color: C.fg }}>{label}</span>
    </label>
  )
}

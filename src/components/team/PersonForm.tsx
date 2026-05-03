'use client'

import { useEffect, useState } from 'react'
import { COLORS as C } from '@/lib/theme'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { COMMISSIONS } from '@/lib/data'
import {
  AUTH_LEVEL_LABELS, AUTH_LEVEL_DESCRIPTIONS,
  PERMISSION_LABELS, SIGNATURE_LABELS,
  ALL_PERMISSIONS, ALL_SIGNATURE_DOMAINS,
  ROLE_PERMISSIONS,
  type AuthLevel, type Permission, type SignatureDomain,
} from '@/lib/permissions'
import { ROLE_LABELS, type Person, type PersonRole } from '@/lib/people'

interface PersonFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Person, 'id' | 'fullName' | 'initials'>) => void
  onDelete?: () => void
  initial?: Partial<Person>
}

const ROLES: PersonRole[] = ['maire', 'adjoint', 'elu', 'agent']
const AUTH_LEVELS: AuthLevel[] = ['super-admin', 'admin', 'gestionnaire', 'contributeur', 'lecteur']

const COLORS_PALETTE = [
  C.green, C.terra, C.slate, C.info, C.warning, C.danger, C.muted,
]

// Groupes de permissions pour l'affichage
const PERMISSION_GROUPS: Array<{ title: string; perms: Permission[] }> = [
  { title: 'Tâches', perms: ['tasks.create', 'tasks.edit-any', 'tasks.delete-any', 'tasks.validate'] },
  { title: 'Commissions', perms: ['commissions.view-all', 'commissions.manage', 'commissions.add-members'] },
  { title: 'Comptes rendus', perms: ['cr.upload', 'cr.validate', 'cr.publish'] },
  { title: 'RH', perms: ['hr.view-all', 'hr.manage', 'hr.validate-leaves', 'hr.generate-payslips'] },
  { title: 'Finances', perms: ['finance.view-all', 'finance.validate-invoices', 'finance.manage-budget'] },
  { title: 'Documents (GED)', perms: ['documents.view-all', 'documents.upload', 'documents.delete'] },
  { title: 'Équipe', perms: ['team.view', 'team.invite', 'team.edit-roles', 'team.deactivate'] },
  { title: 'Système', perms: ['system.settings'] },
]

export function PersonForm({ open, onClose, onSubmit, onDelete, initial }: PersonFormProps) {
  const [section, setSection] = useState<'identite' | 'autorisations' | 'signature' | 'delegations'>('identite')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [role, setRole] = useState<PersonRole>('agent')
  const [poste, setPoste] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [color, setColor] = useState(C.slate)
  const [active, setActive] = useState(true)
  const [authLevel, setAuthLevel] = useState<AuthLevel>('contributeur')
  const [customPerms, setCustomPerms] = useState<Set<Permission>>(new Set())
  const [canSign, setCanSign] = useState(false)
  const [signatureDomains, setSignatureDomains] = useState<Set<SignatureDomain>>(new Set())
  const [responsibleCommissions, setResponsibleCommissions] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSection('identite')
    setPrenom(initial?.prenom ?? '')
    setNom(initial?.nom ?? '')
    setRole(initial?.role ?? 'agent')
    setPoste(initial?.poste ?? '')
    setEmail(initial?.email ?? '')
    setPhone(initial?.phone ?? '')
    setColor(initial?.color ?? C.slate)
    setActive(initial?.active ?? true)
    setAuthLevel(initial?.authLevel ?? 'contributeur')
    setCustomPerms(new Set(initial?.customPermissions ?? []))
    setCanSign(initial?.canSign ?? false)
    setSignatureDomains(new Set(initial?.signatureDomains ?? []))
    setResponsibleCommissions(new Set(initial?.responsibleCommissions ?? []))
    setError(null)
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const togglePermission = (p: Permission) => {
    setCustomPerms(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const toggleSignature = (d: SignatureDomain) => {
    setSignatureDomains(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const toggleResponsible = (cid: string) => {
    setResponsibleCommissions(prev => {
      const next = new Set(prev)
      if (next.has(cid)) next.delete(cid)
      else next.add(cid)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prenom.trim()) return setError('Le prénom est obligatoire.')
    if (!nom.trim()) return setError('Le nom est obligatoire.')
    if (!poste.trim()) return setError('Le poste est obligatoire.')
    onSubmit({
      prenom: prenom.trim(),
      nom: nom.trim(),
      role,
      poste: poste.trim(),
      email: email.trim() || `${prenom.toLowerCase()}.${nom.toLowerCase().replace(/\s+/g, '-')}@saint-fortunat.fr`,
      phone: phone.trim() || undefined,
      color,
      active,
      authLevel,
      customPermissions: Array.from(customPerms),
      canSign,
      signatureDomains: Array.from(signatureDomains),
      responsibleCommissions: Array.from(responsibleCommissions),
      startDate: initial?.startDate,
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '8px 12px', fontSize: 13, color: C.fg,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#fff',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  // Permissions effectives = permissions du niveau + custom
  const effective = new Set(ROLE_PERMISSIONS[authLevel])
  customPerms.forEach(p => effective.add(p))
  const isFromRole = (p: Permission) => ROLE_PERMISSIONS[authLevel].includes(p)
  const isCustom = (p: Permission) => customPerms.has(p)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,28,22,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%', maxWidth: 720,
          background: '#fff', borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          {prenom && nom && <Avatar initials={`${prenom[0]}${nom[0]}`.toUpperCase()} color={color} size={36} />}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.fg, margin: 0 }}>
              {initial?.id ? 'Modifier la fiche' : 'Nouveau membre'}
            </h2>
            {prenom && nom && <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>{prenom} {nom}</p>}
          </div>
          <button
            type="button" onClick={onClose} aria-label="Fermer"
            style={{
              width: 28, height: 28, border: 'none', background: 'transparent',
              borderRadius: 6, cursor: 'pointer', fontSize: 20, color: C.subtle,
            }}
          >×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, paddingLeft: 20 }}>
          {([
            ['identite', 'Identité'],
            ['autorisations', 'Autorisations'],
            ['signature', 'Signature'],
            ['delegations', 'Délégations'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSection(k)}
              style={{
                padding: '10px 16px', border: 'none', background: 'none',
                borderBottom: section === k ? `2px solid ${C.green}` : '2px solid transparent',
                color: section === k ? C.green : C.muted,
                fontWeight: section === k ? 600 : 400,
                fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {section === 'identite' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Prénom <span style={{ color: C.danger }}>*</span></label>
                  <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nom <span style={{ color: C.danger }}>*</span></label>
                  <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Poste / Fonction <span style={{ color: C.danger }}>*</span></label>
                <input type="text" value={poste} onChange={e => setPoste(e.target.value)} placeholder="Ex : 1ère adjointe — Urbanisme" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Type de membre</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ROLES.map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        background: role === r ? C.green : '#fff',
                        border: `1px solid ${role === r ? C.green : C.border}`,
                        color: role === r ? '#fff' : C.muted,
                        fontSize: 12, fontWeight: role === r ? 600 : 400,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ex@saint-fortunat.fr" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="04 75 00 00 00" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Couleur de l&apos;avatar</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {COLORS_PALETTE.map(co => (
                    <button
                      key={co} type="button"
                      onClick={() => setColor(co)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: co,
                        border: color === co ? `3px solid ${C.fg}` : '2px solid transparent',
                        cursor: 'pointer', padding: 0,
                      }}
                      aria-label={`Couleur ${co}`}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: active ? C.successLight : C.dangerLight, border: `1px solid ${(active ? C.success : C.danger)}40`, borderRadius: 6 }}>
                <input
                  id="active-toggle"
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="active-toggle" style={{ flex: 1, fontSize: 12, color: active ? C.success : C.danger, fontWeight: 500, cursor: 'pointer' }}>
                  Compte {active ? 'actif' : 'désactivé'} — {active ? 'la personne peut se connecter et apparaît dans les listes.' : 'la personne ne peut plus se connecter.'}
                </label>
              </div>
            </>
          )}

          {section === 'autorisations' && (
            <>
              <div>
                <label style={labelStyle}>Niveau d&apos;autorisation</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {AUTH_LEVELS.map(lvl => (
                    <label
                      key={lvl}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px',
                        background: authLevel === lvl ? `${C.green}10` : '#fff',
                        border: `1px solid ${authLevel === lvl ? C.green : C.border}`,
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio" name="authLevel" checked={authLevel === lvl}
                        onChange={() => setAuthLevel(lvl)}
                        style={{ marginTop: 3, cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: authLevel === lvl ? C.green : C.fg }}>
                          {AUTH_LEVEL_LABELS[lvl]}
                        </p>
                        <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
                          {AUTH_LEVEL_DESCRIPTIONS[lvl]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Permissions effectives ({effective.size} / {ALL_PERMISSIONS.length})
                </label>
                <p style={{ fontSize: 11, color: C.subtle, marginBottom: 8 }}>
                  Cases grisées = permissions héritées du niveau d&apos;autorisation. Cases bleues = ajouts spécifiques à cette personne.
                </p>
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.title} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: C.fg, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {group.title}
                    </p>
                    {group.perms.map(perm => {
                      const fromRole = isFromRole(perm)
                      const custom = isCustom(perm)
                      const checked = fromRole || custom
                      return (
                        <label
                          key={perm}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 8px', borderRadius: 4,
                            background: custom ? `${C.info}10` : 'transparent',
                            cursor: fromRole ? 'not-allowed' : 'pointer',
                            opacity: fromRole && !custom ? 0.7 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={fromRole}
                            onChange={() => togglePermission(perm)}
                            style={{ cursor: fromRole ? 'not-allowed' : 'pointer' }}
                          />
                          <span style={{ flex: 1, fontSize: 12, color: C.fg }}>
                            {PERMISSION_LABELS[perm]}
                          </span>
                          {fromRole && <Badge label="Du rôle" variant="default" />}
                          {custom && <Badge label="Spécifique" variant="info" />}
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'signature' && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: canSign ? `${C.green}10` : C.bg,
                border: `1px solid ${canSign ? C.green : C.border}`,
                borderRadius: 8,
              }}>
                <input
                  id="canSign"
                  type="checkbox"
                  checked={canSign}
                  onChange={e => setCanSign(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="canSign" style={{ flex: 1, cursor: 'pointer' }}>
                  <p style={{ fontSize: 13, color: canSign ? C.green : C.fg, fontWeight: 600 }}>
                    Pouvoir de signature
                  </p>
                  <p style={{ fontSize: 11, color: C.subtle }}>
                    {canSign
                      ? 'Cette personne peut valider et signer les actes des domaines cochés ci-dessous.'
                      : 'Activez pour autoriser cette personne à signer / valider des actes officiels.'}
                  </p>
                </label>
              </div>

              {canSign && (
                <div>
                  <label style={labelStyle}>Domaines de signature</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {ALL_SIGNATURE_DOMAINS.map(dom => {
                      const checked = signatureDomains.has(dom)
                      return (
                        <label
                          key={dom}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px',
                            background: checked ? `${C.green}10` : '#fff',
                            border: `1px solid ${checked ? C.green : C.border}`,
                            borderRadius: 6, cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSignature(dom)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ flex: 1, fontSize: 12, color: C.fg, fontWeight: checked ? 500 : 400 }}>
                            {SIGNATURE_LABELS[dom]}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'delegations' && (
            <>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                Cochez les commissions dont cette personne est <strong>référent(e) / responsable</strong>.
                Une commission peut avoir plusieurs responsables. Indépendant de l&apos;appartenance simple à la commission.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {COMMISSIONS.map(c => {
                  const checked = responsibleCommissions.has(c.id)
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        background: checked ? `${c.color}10` : '#fff',
                        border: `1px solid ${checked ? c.color : C.border}`,
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleResponsible(c.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: C.fg, fontWeight: checked ? 600 : 400 }}>
                        {c.name}
                      </span>
                      {checked && <Badge label="Référent(e)" variant="primary" />}
                    </label>
                  )
                })}
              </div>
            </>
          )}

          {error && (
            <div style={{ padding: '8px 12px', background: C.dangerLight, border: `1px solid ${C.danger}40`, borderRadius: 6, color: C.danger, fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, background: C.bg }}>
          {onDelete && initial?.id && (
            <Button variant="danger" size="sm" onClick={onDelete}>Supprimer</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit">
            {initial?.id ? 'Enregistrer' : 'Créer le membre'}
          </Button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { COLORS as C } from '@/lib/theme'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const COMMUNE_PHOTO = 'https://www.saint-fortunat-sur-eyrieux.fr/wp-content/uploads/2018/12/41199_372425_24.jpg'

export default function PremiereConnexionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontSize: 13, color: C.subtle }}>Chargement…</div>}>
      <PremiereConnexionContent />
    </Suspense>
  )
}

function PremiereConnexionContent() {
  const router = useRouter()
  const params = useSearchParams()
  const emailFromUrl = params.get('email') ?? ''

  const { setPassword, findPersonByEmail, hydrated } = useAuth()
  const { setCurrentUserId } = useCurrentUser()

  const [email, setEmail] = useState(emailFromUrl)
  const [password, setPasswordVal] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const person = email ? findPersonByEmail(email) : null

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl)
  }, [emailFromUrl])

  const score = scorePassword(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    const result = setPassword(email, password)
    if (!result.ok) {
      setError(result.error ?? 'Impossible de définir le mot de passe.')
      setSubmitting(false)
      return
    }
    if (person) setCurrentUserId(person.id)
    router.push('/dashboard')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        width: '45%',
        background: C.slateDark,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '40px 44px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            background: C.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>SFE</span>
          </div>
          <div>
            <p style={{ fontSize: 17, color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>Mairie de</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>Saint-Fortunat-sur-Eyrieux</p>
          </div>
        </div>
        <div style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COMMUNE_PHOTO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <div style={{
        flex: 1,
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 6 }}>
            Première connexion
          </h1>
          <p style={{ fontSize: 13, color: C.subtle, marginBottom: 24 }}>
            Bienvenue{person ? ` ${person.prenom}` : ''} ! Définissez votre mot de passe pour accéder à l'ENT.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!!emailFromUrl}
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: `1px solid ${C.border}`, borderRadius: 6,
                background: emailFromUrl ? C.bg : '#fff', fontSize: 13, color: C.fg,
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {person && (
              <p style={{ fontSize: 11, color: C.success, marginTop: 4 }}>
                ✓ {person.fullName} — {person.poste}
              </p>
            )}
            {email && !person && hydrated && (
              <p style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>
                ⚠ Aucun compte associé à cet email.
              </p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPasswordVal(e.target.value)}
              autoComplete="new-password"
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: `1px solid ${C.border}`, borderRadius: 6,
                background: '#fff', fontSize: 13, color: C.fg,
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {password && <PasswordStrength score={score} />}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: `1px solid ${confirm && confirm === password ? C.success : confirm && confirm !== password ? C.danger : C.border}`,
                borderRadius: 6, background: '#fff', fontSize: 13, color: C.fg,
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {confirm && confirm !== password && (
              <p style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>
                Les deux mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          <FormError message={error} />

          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !person || password.length < 8 || password !== confirm}
            style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}
          >
            Définir et se connecter
          </Button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Link href="/login" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
              ← Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Indicateur de robustesse du mot de passe ──────────────────────────

function scorePassword(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pwd) return { score: 0, label: '—', color: C.subtle }
  let s = 0
  if (pwd.length >= 8) s++
  if (pwd.length >= 12) s++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++
  if (/\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) s++
  const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'] as const
  const colors = [C.danger, C.danger, C.warning, C.success, C.success]
  return { score: s as 0 | 1 | 2 | 3 | 4, label: labels[s], color: colors[s] }
}

function PasswordStrength({ score }: { score: ReturnType<typeof scorePassword> }) {
  return (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < score.score ? score.color : C.ph,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 10, color: score.color, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
        {score.label}
      </span>
    </div>
  )
}

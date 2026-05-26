'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { COLORS as C } from '@/lib/theme'
import { useAuth } from '@/hooks/useAuth'

const COMMUNE_PHOTO = 'https://www.saint-fortunat-sur-eyrieux.fr/wp-content/uploads/2018/12/41199_372425_24.jpg'

export default function MotDePasseOubliePage() {
  const { requestReset, hydrated } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const result = requestReset(email)
    if (!result.ok) {
      setError(result.error ?? 'Demande impossible.')
      return
    }
    setSent(true)
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
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 6 }}>
                Mot de passe oublié
              </h1>
              <p style={{ fontSize: 13, color: C.subtle, marginBottom: 24 }}>
                Saisissez votre adresse email. Vous recevrez un lien pour
                réinitialiser votre mot de passe.
              </p>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="prenom.nom@saint-fortunat.fr"
                  style={{
                    width: '100%', height: 42, padding: '0 12px',
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    background: '#fff', fontSize: 13, color: C.fg,
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 12px', marginBottom: 14,
                  background: C.dangerLight, border: `1px solid ${C.danger}40`,
                  borderRadius: 6, color: C.danger, fontSize: 12,
                }}>
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                disabled={!hydrated}
                style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}
              >
                Envoyer le lien de réinitialisation
              </Button>

              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <Link href="/login" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
                  ← Retour à la connexion
                </Link>
              </div>
            </form>
          ) : (
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: C.successLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 28, color: C.success }}>✓</span>
              </div>
              <h1 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 6 }}>
                Email envoyé
              </h1>
              <p style={{ fontSize: 13, color: C.subtle, marginBottom: 18, lineHeight: 1.5 }}>
                Un lien de réinitialisation a été envoyé à <strong style={{ color: C.fg }}>{email}</strong>.
                Vérifiez votre boîte de réception.
              </p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 18, fontStyle: 'italic' }}>
                Démo : votre mot de passe a été réinitialisé. Au prochain login,
                vous serez redirigé vers la définition d'un nouveau mot de passe.
              </p>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center', height: 44 }}>
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

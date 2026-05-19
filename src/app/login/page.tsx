'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { COLORS as C } from '@/lib/theme'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const COMMUNE_PHOTO = 'https://www.saint-fortunat-sur-eyrieux.fr/wp-content/uploads/2018/12/41199_372425_24.jpg'

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentUserId } = useCurrentUser()
  const [email, setEmail] = useState('berardi.maxime@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Connexion via NextAuth (Credentials provider + bcrypt côté serveur).
  // En succès : on synchronise currentUserId localStorage avec le
  // personId de la session pour que le reste de l'app (qui utilise
  // encore localStorage) reconnaisse l'utilisateur connecté.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    // En NextAuth v5 beta, on ne peut pas se fier à result.ok seul :
    // on vérifie aussi result.error et l'existence effective de la
    // session côté serveur. Sans ça, un signIn raté peut quand même
    // laisser l'utilisateur entrer si un ancien cookie de session est
    // encore valide.
    if (result?.error || !result?.ok) {
      setError('Email ou mot de passe incorrect.')
      setSubmitting(false)
      return
    }

    const session = await getSession()
    if (!session?.user?.personId) {
      setError('Email ou mot de passe incorrect.')
      setSubmitting(false)
      return
    }

    setCurrentUserId(session.user.personId)
    router.push('/dashboard')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Panneau gauche — Branding + photo */}
      <div style={{
        width: '45%',
        background: C.slateDark,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '40px 44px',
        position: 'relative',
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

        {/* Photo de la commune */}
        <div style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COMMUNE_PHOTO}
            alt="Saint-Fortunat-sur-Eyrieux — vue de la commune"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '20px 16px 14px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }}>
            <p style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Vallée de l'Eyrieux · Ardèche</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Espace Numérique de Travail — réservé aux élus et agents municipaux
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            Connexion sécurisée · Hébergement souverain France
          </span>
        </div>
      </div>

      {/* Panneau droit — Formulaire */}
      <div style={{
        flex: 1,
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 24, color: C.fg, fontWeight: 700, marginBottom: 6 }}>Connexion</h1>
          <p style={{ fontSize: 13, color: C.subtle, marginBottom: 28 }}>
            Veuillez vous identifier pour accéder à l'ENT.
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
              autoComplete="username"
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: `1px solid ${C.border}`, borderRadius: 6,
                background: '#fff', fontSize: 13, color: C.fg,
                outline: 'none', fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Laisser vide à la première connexion"
              style={{
                width: '100%', height: 42, padding: '0 12px',
                border: `1px solid ${C.border}`, borderRadius: 6,
                background: '#fff', fontSize: 13, color: C.fg,
                outline: 'none', fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
            <Link href="/auth/mot-de-passe-oublie" style={{ fontSize: 11, color: C.muted, textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
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
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>

          <div style={{
            marginTop: 24, padding: '10px 14px',
            background: '#eaf1fb', border: `1px solid #2563a830`,
            borderRadius: 8, fontSize: 11, color: C.muted,
          }}>
            <strong style={{ color: C.info, fontWeight: 600 }}>Mot de passe par défaut</strong>
            <p style={{ marginTop: 4 }}>
              Pour cette première phase, le mot de passe initial est{' '}
              <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>
                saintfortunat2026
              </code>. Il sera personnalisable dans une prochaine version.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

// Photo locale (cf. public/images/README.md). Servie depuis /public, aucun
// hotlink externe : conformité RGPD + résilience (pas de dépendance à
// saint-fortunat-sur-eyrieux.fr). Fallback SVG si jamais le .jpg est absent.
const COMMUNE_PHOTO = '/images/saint-fortunat.jpg'
const COMMUNE_PHOTO_FALLBACK = '/images/saint-fortunat-placeholder.svg'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  // Déconnexion sur inactivité (cf. <IdleTimeout/>) : on lit la query string
  // directement pour ne pas imposer un <Suspense> autour de useSearchParams.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reason') === 'timeout') {
      setTimedOut(true)
    }
  }, [])

  // Connexion via NextAuth (Credentials provider + bcrypt côté serveur).
  // L'identité de l'utilisateur courant est dérivée de la session côté
  // TeamContext — rien à synchroniser ici.
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

    router.push('/dashboard')
  }

  return (
    <div className="login">
      {/* Branding + photo — colonne gauche en desktop, fond plein écran en mobile */}
      <aside className="login__brand">
        <div className="login__brand-header">
          <div className="login__logo">SFE</div>
          <div>
            <p className="login__brand-title">Mairie de</p>
            <p className="login__brand-sub">Saint-Fortunat-sur-Eyrieux</p>
          </div>
        </div>

        <div className="login__photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login__photo"
            src={COMMUNE_PHOTO}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = COMMUNE_PHOTO_FALLBACK }}
            alt="Saint-Fortunat-sur-Eyrieux — vue de la commune"
          />
          <div className="login__photo-caption">
            <b>Vallée de l'Eyrieux · Ardèche</b>
            <span>Espace Numérique de Travail — réservé aux élus et agents municipaux</span>
          </div>
        </div>

        <div className="login__secure">
          <span className="login__secure-dot" />
          <span>Connexion sécurisée · Hébergement souverain France</span>
        </div>
      </aside>

      {/* Formulaire — colonne droite en desktop, carte ancrée en bas en mobile */}
      <main className="login__main">
        <form onSubmit={handleSubmit} className="login__card">
          <div className="login__card-handle" aria-hidden="true" />
          <h1 className="login__title">Connexion</h1>
          <p className="login__subtitle">Veuillez vous identifier pour accéder à l'ENT.</p>

          <div className="login__field">
            <label htmlFor="login-email" className="login__label">Adresse e-mail</label>
            <input
              id="login-email"
              className="login__input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="login__field">
            <label htmlFor="login-password" className="login__label">Mot de passe</label>
            <div className="login__password">
              <input
                id="login-password"
                className="login__input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login__eye"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login__forgot">
            <Link href="/auth/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </div>

          {timedOut && !error && (
            <div className="login__timeout">
              <strong>Session expirée</strong>
              <p>Vous avez été déconnecté après 30 minutes d'inactivité. Veuillez vous reconnecter.</p>
            </div>
          )}

          <FormError message={error} />

          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 16 }}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>

          <div className="login__secure login__secure--card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            </svg>
            <span>Connexion sécurisée · Hébergement souverain France</span>
          </div>
        </form>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { COLORS as C } from '@/lib/theme'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [email, setEmail] = useState('jean.martin@mairie-sfe.fr')
  const [code, setCode] = useState(['', '', '', '', '', ''])

  const handleNext = () => {
    if (step === 'credentials') setStep('2fa')
    else router.push('/dashboard')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left — Brand panel */}
      <div style={{
        width: '42%',
        background: C.slateDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '48px 52px',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            background: C.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>SFE</span>
          </div>
          <div>
            <p style={{ fontSize: 17, color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>Mairie de</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>Saint-Fortunat-sur-Eyrieux</p>
          </div>
        </div>

        {/* Illustration placeholder */}
        <div style={{
          width: '100%',
          height: 240,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏔️</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Vallée de l'Eyrieux · Ardèche</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.5 }}>
          Espace Numérique de Travail — réservé aux élus et agents municipaux
        </p>

        {/* Security indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'absolute', bottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Connexion sécurisée · Hébergement souverain France</span>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{
        flex: 1,
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {step === 'credentials' ? (
            <>
              <h1 style={{ fontSize: 24, color: C.fg, fontWeight: 700, marginBottom: 6 }}>Connexion</h1>
              <p style={{ fontSize: 13, color: C.subtle, marginBottom: 32 }}>
                Veuillez vous identifier pour accéder à l'ENT.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', height: 42, padding: '0 12px',
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    background: '#fff', fontSize: 13, color: C.fg,
                    outline: 'none', fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  defaultValue="••••••••••"
                  style={{
                    width: '100%', height: 42, padding: '0 12px',
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    background: '#fff', fontSize: 13, color: C.fg,
                    outline: 'none', fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              <Button variant="primary" onClick={handleNext} style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14 }}>
                Se connecter
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: C.subtle, cursor: 'pointer' }}>Mot de passe oublié ?</span>
              </div>

              <div style={{ marginTop: 24, padding: '10px 14px', background: '#eaf1fb', border: `1px solid #2563a830`, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: C.info, fontWeight: 600 }}>Connexion avec certificat numérique</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Pour les agents disposant d'une carte agent</p>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <button
                    onClick={() => setStep('credentials')}
                    style={{ fontSize: 12, color: C.subtle, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                  >
                    ← Retour
                  </button>
                </div>
                <h1 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 6 }}>Vérification en deux étapes</h1>
                <p style={{ fontSize: 13, color: C.subtle }}>
                  Saisissez le code à 6 chiffres envoyé au ••• ••• 42
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {code.map((c, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={c}
                    onChange={e => {
                      const next = [...code]
                      next[i] = e.target.value.replace(/\D/, '')
                      setCode(next)
                    }}
                    style={{
                      flex: 1,
                      height: 52,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      border: `2px solid ${c ? C.green : C.border}`,
                      borderRadius: 8,
                      background: '#fff',
                      outline: 'none',
                      color: C.fg,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              <Button variant="primary" onClick={handleNext} style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14, marginBottom: 10 }}>
                Valider le code
              </Button>
              <Button onClick={() => {}} style={{ width: '100%', justifyContent: 'center' }}>
                Renvoyer le code
              </Button>

              <p style={{ fontSize: 11, color: C.subtle, textAlign: 'center', marginTop: 12 }}>
                Code valable pendant <strong style={{ fontFamily: "'Caveat', cursive", fontSize: 13 }}>4:32</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

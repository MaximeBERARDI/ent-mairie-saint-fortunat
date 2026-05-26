'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { COLORS as C } from '@/lib/theme'

// Photo locale (cf. public/images/README.md) — pas de hotlink externe (RGPD).
const COMMUNE_PHOTO = '/images/saint-fortunat.jpg'
const COMMUNE_PHOTO_FALLBACK = '/images/saint-fortunat-placeholder.svg'

export default function MotDePasseOubliePage() {
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
          <img
            src={COMMUNE_PHOTO}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = COMMUNE_PHOTO_FALLBACK }}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
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
          <h1 style={{ fontSize: 22, color: C.fg, fontWeight: 700, marginBottom: 6 }}>
            Mot de passe oublié
          </h1>
          <p style={{ fontSize: 13, color: C.subtle, marginBottom: 18, lineHeight: 1.6 }}>
            La réinitialisation se fait par un administrateur. Contactez le
            secrétariat de mairie (Direction Générale des Services) : il
            réinitialisera votre accès et vous communiquera un mot de passe
            temporaire.
          </p>
          <div style={{
            padding: '12px 14px', marginBottom: 20,
            background: '#eaf1fb', border: `1px solid #2563a830`,
            borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.6,
          }}>
            À réception du mot de passe temporaire, connectez-vous puis
            changez-le immédiatement depuis <strong style={{ color: C.fg }}>Profil → Sécurité</strong>.
          </div>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center', height: 44 }}>
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

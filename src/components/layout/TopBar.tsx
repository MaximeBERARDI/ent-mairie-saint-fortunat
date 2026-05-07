'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { PEOPLE } from '@/lib/people'
import { AUTH_LEVEL_LABELS } from '@/lib/permissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Tâches', href: '/taches' },
  { label: 'Commissions', href: '/commissions' },
  { label: 'Comptes rendus', href: '/comptes-rendus' },
  { label: 'Ressources humaines', href: '/rh' },
  { label: 'Finances', href: '/finances' },
  { label: 'Équipe', href: '/equipe' },
]

interface TopBarProps {
  title: string
  notif?: number
}

export function TopBar({ title, notif = 2 }: TopBarProps) {
  const pathname = usePathname()
  const { nav } = useSettings()
  const isTopNav = nav === 'top'
  const { currentUser, currentUserId, setCurrentUserId } = useCurrentUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [userMenuOpen])

  // Personnes actives groupées par rôle (pour le sélecteur démo)
  const elus = PEOPLE.filter(p => p.active && p.role !== 'agent')
  const agents = PEOPLE.filter(p => p.active && p.role === 'agent')

  return (
    <div style={{
      height: 'var(--topbar-h)',
      background: 'var(--topbar-bg)',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      flexShrink: 0,
    }}>
      {isTopNav && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>SFE</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--topbar-text)', fontWeight: 700 }}>Saint-Fortunat</span>
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '5px 10px', borderRadius: 6, background: active ? `var(--accent-light)` : 'transparent' }}>
                    <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
      {!isTopNav && (
        <h1 style={{ fontSize: 15, color: 'var(--topbar-text)', fontWeight: 600, flex: 1 }}>{title}</h1>
      )}

      {/* Search */}
      <div style={{
        width: isTopNav ? 160 : 180,
        height: isTopNav ? 28 : 30,
        background: 'transparent',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Rechercher…</span>
      </div>

      {/* Notif bell */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, border: '1px solid var(--card-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 14 }}>🔔</span>
        </div>
        {notif > 0 && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{notif}</span>
          </div>
        )}
      </div>

      {/* Profil utilisateur courant + sélecteur démo */}
      <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          aria-label="Mon profil / changer d'utilisateur"
          title={currentUser ? `${currentUser.fullName} — ${AUTH_LEVEL_LABELS[currentUser.authLevel]}` : 'Profil'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Avatar
            initials={currentUser?.initials ?? 'JM'}
            size={30}
            color={currentUser?.color ?? C.terra}
          />
        </button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute',
            top: 36,
            right: 0,
            width: 280,
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            {currentUser && (
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                <p style={{ fontSize: 13, color: C.fg, fontWeight: 700 }}>{currentUser.fullName}</p>
                <p style={{ fontSize: 11, color: C.subtle }}>{currentUser.poste}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  {AUTH_LEVEL_LABELS[currentUser.authLevel]}
                </p>
              </div>
            )}
            <div style={{ padding: '6px 0', maxHeight: 320, overflowY: 'auto' }}>
              <Link
                href="/profil"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  textDecoration: 'none',
                  color: C.fg,
                  fontSize: 12,
                  fontWeight: 600,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 14 }}>👤</span>
                Voir mon profil
              </Link>
              <p style={{ fontSize: 9, color: C.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 14px' }}>
                Démo — Changer d'utilisateur
              </p>
              {[...elus, ...agents].map(p => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentUserId(p.id); setUserMenuOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    background: p.id === currentUserId ? `${C.green}10` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <Avatar initials={p.initials} size={22} color={p.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: C.fg, fontWeight: p.id === currentUserId ? 700 : 500 }}>{p.fullName}</p>
                    <p style={{ fontSize: 9, color: C.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {AUTH_LEVEL_LABELS[p.authLevel]}
                    </p>
                  </div>
                  {p.id === currentUserId && <span style={{ fontSize: 12, color: C.green }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

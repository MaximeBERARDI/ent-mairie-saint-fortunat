'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useSettings } from '@/context/SettingsContext'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { AUTH_LEVEL_LABELS } from '@/lib/permissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { moduleKeyForHref } from '@/lib/modules'
import { useMobileNav } from '@/context/MobileNavContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsBell } from './NotificationsBell'

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Calendrier', href: '/calendrier' },
  { label: 'Tâches', href: '/taches' },
  { label: 'Commissions', href: '/commissions' },
  { label: 'Comptes rendus', href: '/comptes-rendus' },
  { label: 'Ressources humaines', href: '/rh' },
  { label: 'Finances', href: '/finances' },
  { label: 'Équipe', href: '/equipe' },
]

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { nav } = useSettings()
  const isTopNav = nav === 'top'
  const isMobile = useIsMobile()
  const { toggle: toggleMobileNav } = useMobileNav()
  const { currentUser, can } = useCurrentUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const hiddenModules = new Set(currentUser?.hiddenModules ?? [])
  const visibleNav = NAV_ITEMS.filter(item => {
    const key = moduleKeyForHref(item.href)
    if (!key) return true
    if (key === 'equipe' && can('team.edit-roles')) return true
    return !hiddenModules.has(key)
  })

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--topbar-bg)',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 14px',
      flexShrink: 0,
    }}>
      {isMobile && !isTopNav && (
        <button
          onClick={toggleMobileNav}
          aria-label="Menu"
          style={{
            width: 36, height: 36, borderRadius: 6,
            background: 'transparent',
            border: '1px solid var(--card-border)',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >☰</button>
      )}
      {isTopNav && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, letterSpacing: 0.3 }}>SF</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--topbar-text)', fontWeight: 700 }}>Saint-Fortunat</span>
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {visibleNav.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} style={{ textDecoration: 'none' }}>
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
        <h1 style={{ fontSize: 15, color: 'var(--topbar-text)', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
      )}

      {/* Search global */}
      <GlobalSearch />

      {/* Notif bell */}
      <NotificationsBell />

      {/* Profil utilisateur courant + déconnexion */}
      <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          aria-label="Mon profil"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          title={currentUser ? `${currentUser.fullName} — ${AUTH_LEVEL_LABELS[currentUser.authLevel]}` : 'Profil'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Avatar
            initials={currentUser?.initials ?? '?'}
            size={30}
            color={currentUser?.color ?? C.terra}
            photo={currentUser?.photoUrl ?? null}
          />
        </button>
        {userMenuOpen && (
          <div className="topbar-dropdown" style={{
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
            <div style={{ padding: '6px 0' }}>
              <Link
                href="/profil"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  textDecoration: 'none',
                  color: C.fg,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 14 }}>👤</span>
                Voir mon profil
              </Link>
              {can('team.edit-roles') && (
                <Link
                  href="/journal"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    textDecoration: 'none', color: C.fg, fontSize: 12, fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 14 }}>📋</span>
                  Journal d&apos;audit
                </Link>
              )}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.danger,
                }}
              >
                <span style={{ fontSize: 14 }}>⏻</span>
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'
import { ROLE_LABELS } from '@/lib/people'
import { moduleKeyForHref } from '@/lib/modules'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTasks } from '@/hooks/useTasks'
import { isMyActiveTask } from '@/lib/task-filters'

type IconName = 'dashboard' | 'check' | 'users' | 'doc' | 'briefcase' | 'euro' | 'team' | 'folder'

const NAV_ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: 'dashboard' },
  { label: 'Tâches', href: '/taches', icon: 'check' },
  { label: 'Commissions', href: '/commissions', icon: 'users' },
  { label: 'Comptes rendus', href: '/comptes-rendus', icon: 'doc' },
  { label: 'Ressources humaines', href: '/rh', icon: 'briefcase' },
  { label: 'Finances', href: '/finances', icon: 'euro' },
  { label: 'Équipe', href: '/equipe', icon: 'team' },
  { label: 'Bibliothèque', href: '/bibliotheque', icon: 'folder' },
]

// Icônes trait cohérentes (viewBox 24, currentColor → la couleur active/inactive
// est portée par le parent). Remplace les anciens carrés décoratifs sans sens.
function NavIcon({ name }: { name: IconName }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'dashboard':
      return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>
    case 'check':
      return <svg {...p}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    case 'users':
      return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'doc':
      return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    case 'briefcase':
      return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
    case 'euro':
      return <svg {...p}><path d="M18 7a6 6 0 1 0 0 10" /><line x1="4" y1="10" x2="13" y2="10" /><line x1="4" y1="14" x2="13" y2="14" /></svg>
    case 'team':
      return <svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    case 'folder':
      return <svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const { nav } = useSettings()
  const { currentUser: me, can } = useCurrentUser()
  const { tasks } = useTasks()
  const [guideHover, setGuideHover] = useState(false)
  const isIcons = nav === 'icons'
  const w = isIcons ? 54 : 212

  // Badge "Tâches" : mes tâches actives (assignées à moi ou à valider, non
  // terminées). Même définition que le filtre « Mes tâches » de /taches.
  const myOpenTaskCount = me
    ? tasks.filter(t => isMyActiveTask(t, me.id)).length
    : 0

  // Filtrage par profil (config admin, persistée en DB sur Person.hiddenModules).
  // Équipe reste visible pour qui peut gérer les accès (anti-verrouillage).
  const hiddenModules = new Set(me?.hiddenModules ?? [])
  const visibleNav = NAV_ITEMS.filter(item => {
    const key = moduleKeyForHref(item.href)
    if (!key) return true
    if (key === 'equipe' && can('team.edit-roles')) return true
    return !hiddenModules.has(key)
  })

  return (
    <div style={{
      width: w,
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
      transition: 'width 200ms ease',
    }}>
      {/* Logo */}
      <div style={{
        padding: isIcons ? '16px 0' : '18px 14px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isIcons ? 'center' : 'flex-start',
        gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'var(--accent-dark)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: 0.3 }}>{isIcons ? 'S' : 'SF'}</span>
        </div>
        {!isIcons && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--sidebar-text)', fontWeight: 600, lineHeight: 1.3 }}>Saint-Fortunat</p>
            <p style={{ fontSize: 10, color: 'var(--sidebar-muted)', lineHeight: 1.3 }}>sur-Eyrieux · Mairie</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Navigation principale" style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const badge = item.href === '/taches' ? myOpenTaskCount : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <div
                title={isIcons ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isIcons ? 0 : 10,
                  padding: isIcons ? '8px 0' : '7px 10px',
                  justifyContent: isIcons ? 'center' : 'flex-start',
                  borderRadius: 6,
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: active ? 'var(--accent)' : 'var(--sidebar-muted)',
                }}>
                  <NavIcon name={item.icon} />
                </span>
                {!isIcons && (
                  <span style={{
                    fontSize: 12,
                    color: active ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
                    fontWeight: active ? 600 : 400,
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                )}
                {!isIcons && badge > 0 && (
                  <div style={{
                    minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11,
                    background: C.danger,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{badge}</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Guide d'utilisateur — page statique servie depuis /public, ouverte en
          plein écran dans un nouvel onglet (design system propre, hors shell). */}
      <a
        href="/guide-utilisateur/index.html"
        target="_blank"
        rel="noopener noreferrer"
        title={isIcons ? "Guide d'utilisateur" : undefined}
        onMouseEnter={() => setGuideHover(true)}
        onMouseLeave={() => setGuideHover(false)}
        style={{ textDecoration: 'none', padding: '6px 8px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isIcons ? 0 : 10,
          padding: isIcons ? '8px 0' : '7px 10px',
          justifyContent: isIcons ? 'center' : 'flex-start',
          borderRadius: 6,
          background: guideHover ? 'var(--sidebar-active)' : 'transparent',
          cursor: 'pointer',
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: guideHover ? 'var(--accent)' : 'var(--sidebar-muted)',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          {!isIcons && (
            <span style={{
              fontSize: 12,
              color: guideHover ? 'var(--sidebar-text)' : 'var(--sidebar-muted)',
              fontWeight: guideHover ? 600 : 400,
              flex: 1,
            }}>
              Guide d&apos;utilisateur
            </span>
          )}
        </div>
      </a>

      {/* User courant — dérivé de la session NextAuth via useCurrentUser */}
      {(() => {
        const initials = me?.initials ?? '?'
        const fullName = me?.fullName ?? '—'
        const roleLabel = me ? ROLE_LABELS[me.role] : ''
        const color = me?.color ?? C.terra
        const photo = me?.photoUrl ?? null
        if (!isIcons) {
          return (
            <Link href="/equipe" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
              }}>
                <Avatar initials={initials} size={28} color={color} photo={photo} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: 'var(--sidebar-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</p>
                  <p style={{ fontSize: 9, color: 'var(--sidebar-muted)' }}>{roleLabel}</p>
                </div>
              </div>
            </Link>
          )
        }
        return (
          <Link href="/equipe" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
              <Avatar initials={initials} size={26} color={color} photo={photo} />
            </div>
          </Link>
        )
      })()}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard', icon: '⊞' },
  { label: 'Tâches', href: '/taches', icon: '✓', badge: 5 },
  { label: 'Commissions', href: '/commissions', icon: '⊙' },
  { label: 'Comptes rendus', href: '/comptes-rendus', icon: '📄' },
  { label: 'Ressources humaines', href: '/rh', icon: '👥' },
  { label: 'Finances', href: '/finances', icon: '€' },
  { label: 'Équipe', href: '/equipe', icon: '⊕' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { nav } = useSettings()
  const isIcons = nav === 'icons'
  const w = isIcons ? 54 : 212

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
          width: 26, height: 26, borderRadius: 5,
          background: 'var(--accent)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{isIcons ? 'S' : 'SFE'}</span>
        </div>
        {!isIcons && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--sidebar-text)', fontWeight: 600, lineHeight: 1.3 }}>Saint-Fortunat</p>
            <p style={{ fontSize: 9, color: 'var(--sidebar-muted)', lineHeight: 1.3 }}>Espace de travail</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div
                title={isIcons ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isIcons ? 0 : 8,
                  padding: isIcons ? '8px 0' : '7px 10px',
                  justifyContent: isIcons ? 'center' : 'flex-start',
                  borderRadius: 6,
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 14, height: 14,
                  background: active ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
                  borderRadius: 3,
                  flexShrink: 0,
                }} />
                {!isIcons && (
                  <span style={{
                    fontSize: 12,
                    color: active ? 'var(--sidebar-text)' : 'rgba(255,255,255,0.5)',
                    fontWeight: active ? 600 : 400,
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                )}
                {!isIcons && item.badge && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: C.danger,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{item.badge}</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {!isIcons ? (
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Avatar initials="JM" size={28} color={C.terra} />
          <div>
            <p style={{ fontSize: 11, color: 'var(--sidebar-text)', fontWeight: 500 }}>Jean Martin</p>
            <p style={{ fontSize: 9, color: 'var(--sidebar-muted)' }}>Conseiller</p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center' }}>
          <Avatar initials="JM" size={26} color={C.terra} />
        </div>
      )}
    </div>
  )
}

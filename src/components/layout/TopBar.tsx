'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import { Avatar } from '@/components/ui/Avatar'
import { COLORS as C } from '@/lib/theme'

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

      <Avatar initials="JM" size={30} color={C.terra} />
    </div>
  )
}

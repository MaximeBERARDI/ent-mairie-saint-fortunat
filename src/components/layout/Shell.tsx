'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import { MobileNavProvider, useMobileNav } from '@/context/MobileNavContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { moduleKeyForHref } from '@/lib/modules'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface ShellProps {
  title: string
  children: ReactNode
  notif?: number
}

export function Shell(props: ShellProps) {
  return (
    <MobileNavProvider>
      <ShellInner {...props} />
    </MobileNavProvider>
  )
}

function ShellInner({ title, children, notif }: ShellProps) {
  const { nav } = useSettings()
  const isTopNav = nav === 'top'
  const isMobile = useIsMobile()
  const { open: mobileNavOpen, setOpen: setMobileNavOpen } = useMobileNav()
  const pathname = usePathname()
  const { currentUser, can, hydrated } = useCurrentUser()

  // Garde de route : si le module de la page courante est masqué pour ce
  // profil (config admin, persistée en DB), on bloque l'accès direct en plus
  // du filtrage de la nav. Équipe reste accessible à qui gère les accès.
  const moduleKey = moduleKeyForHref('/' + (pathname?.split('/')[1] ?? ''))
  const hiddenModules = new Set(currentUser?.hiddenModules ?? [])
  const blocked = hydrated && moduleKey !== null
    && !(moduleKey === 'equipe' && can('team.edit-roles'))
    && hiddenModules.has(moduleKey)

  return (
    <div style={{
      display: 'flex',
      flexDirection: isTopNav ? 'column' : 'row',
      height: '100%',
      background: 'var(--page-bg)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>

      {!isTopNav && !isMobile && <Sidebar />}

      {!isTopNav && isMobile && (
        <>
          {mobileNavOpen && (
            <div
              onClick={() => setMobileNavOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 90,
                background: 'rgba(0,0,0,0.4)',
              }}
            />
          )}
          <div
            onClick={() => setMobileNavOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              zIndex: 100,
              transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 220ms ease',
            }}
          >
            <Sidebar />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={title} notif={notif} />
        <main id="main-content" tabIndex={-1} style={{ flex: 1, overflow: 'auto', padding: 'var(--content-pad)' }}>
          {/* En mode nav-haut, la TopBar n'affiche pas le titre : on fournit le
              h1 de page ici pour qu'il existe toujours exactement un h1 (RGAA). */}
          {isTopNav && (
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-fg)', marginBottom: 'var(--gap)' }}>{title}</h1>
          )}
          {blocked ? <ModuleBlocked /> : children}
        </main>
      </div>
    </div>
  )
}

function ModuleBlocked() {
  return (
    <div style={{ maxWidth: 460, margin: '8vh auto 0', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>🔒</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-fg)', marginBottom: 8 }}>Module non accessible</h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
        Ce module a été masqué pour votre profil par un administrateur.
      </p>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 18px',
          background: 'var(--accent-dark)', color: 'var(--accent-text)',
          borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 600,
        }}
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}

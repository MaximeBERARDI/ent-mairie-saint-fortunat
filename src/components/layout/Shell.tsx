'use client'

import type { ReactNode } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { MobileNavProvider, useMobileNav } from '@/context/MobileNavContext'
import { useIsMobile } from '@/hooks/useIsMobile'
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
          {children}
        </main>
      </div>
    </div>
  )
}

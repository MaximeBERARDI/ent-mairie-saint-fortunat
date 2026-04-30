'use client'

import type { ReactNode } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface ShellProps {
  title: string
  children: ReactNode
  notif?: number
}

export function Shell({ title, children, notif }: ShellProps) {
  const { nav } = useSettings()
  const isTopNav = nav === 'top'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isTopNav ? 'column' : 'row',
      height: '100%',
      background: 'var(--page-bg)',
      overflow: 'hidden',
    }}>
      {!isTopNav && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={title} notif={notif} />
        <main style={{ flex: 1, overflow: 'auto', padding: 'var(--content-pad)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

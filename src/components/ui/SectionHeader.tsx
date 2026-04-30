import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  actions?: ReactNode
}

export function SectionHeader({ title, actions }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
      <h2 style={{ fontSize: 14, color: 'var(--text-fg)', fontWeight: 600, flex: 1 }}>{title}</h2>
      {actions}
    </div>
  )
}

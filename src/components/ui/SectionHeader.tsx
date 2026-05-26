import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  actions?: ReactNode
  // Niveau de titre. 2 par défaut (section sous le h1 de page). Passer 3 pour
  // une sous-section imbriquée sous un autre titre, afin de préserver la
  // hiérarchie des headings (RGAA 9.1 — pas de saut de niveau).
  level?: 2 | 3
}

export function SectionHeader({ title, actions, level = 2 }: SectionHeaderProps) {
  const Heading = level === 3 ? 'h3' : 'h2'
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
      <Heading style={{ fontSize: 14, color: 'var(--text-fg)', fontWeight: 600, flex: 1 }}>{title}</Heading>
      {actions}
    </div>
  )
}

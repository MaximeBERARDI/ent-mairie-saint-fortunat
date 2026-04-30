import { Badge } from './Badge'
import type { BadgeVariant } from '@/lib/types'

interface RowProps {
  label: string
  sub?: string
  badge?: string
  badgeVariant?: BadgeVariant
  right?: string
  last?: boolean
  dot?: string
  onClick?: () => void
}

export function Row({ label, sub, badge, badgeVariant = 'default', right, last, dot, onClick }: RowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 0',
        borderBottom: last ? 'none' : '1px solid var(--card-border)',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {dot && <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--text-fg)', fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{sub}</p>}
      </div>
      {badge && <Badge label={badge} variant={badgeVariant} />}
      {right && <span style={{ fontSize: 10, color: 'var(--text-subtle)', flexShrink: 0 }}>{right}</span>}
    </div>
  )
}

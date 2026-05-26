import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  padding?: number | string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', style, padding, hover, onClick }: CardProps) {
  const p = padding !== undefined ? padding : 'var(--card-pad)'
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 8,
        padding: p,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: hover ? 'box-shadow 0.15s' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  style?: React.CSSProperties
}

export function KpiCard({ label, value, sub, color = '#6ab123', style }: KpiCardProps) {
  return (
    <Card padding={16} style={{ flex: '1 1 200px', minWidth: 180, ...style }}>
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 24, color, fontWeight: 700, lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{sub}</p>}
    </Card>
  )
}

interface KpiBarProps {
  children: ReactNode
}

/**
 * Conteneur pour aligner des KpiCard avec wrap automatique au-delà de 3-4
 * cartes selon la largeur disponible.
 */
export function KpiBar({ children }: KpiBarProps) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--gap)',
      marginBottom: 'var(--gap)',
    }}>
      {children}
    </div>
  )
}

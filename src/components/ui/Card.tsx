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
    <Card style={{ flex: 1, minWidth: 0, ...style }}>
      <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, color, fontWeight: 700, lineHeight: 1.1, marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{sub}</p>}
    </Card>
  )
}

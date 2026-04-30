import type { BadgeVariant } from '@/lib/types'

const VARIANTS: Record<BadgeVariant, { bg: string; color: string }> = {
  default:  { bg: '#f0f3f5', color: '#4d5e6c' },
  success:  { bg: '#e8f7f1', color: '#2d9c6e' },
  warning:  { bg: '#fef5e4', color: '#d4860a' },
  danger:   { bg: '#fdeaea', color: '#c4393a' },
  primary:  { bg: '#f2f9e8', color: '#6ab123' },
  terra:    { bg: '#fdf4ec', color: '#c4793a' },
  info:     { bg: '#eaf1fb', color: '#2563a8' },
}

interface BadgeProps {
  label: string | number
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { bg, color } = VARIANTS[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 9999,
      background: bg,
      color,
      fontSize: 10,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      lineHeight: 1.6,
    }}>
      {label}
    </span>
  )
}

import type { BadgeVariant } from '@/lib/types'

// Fonds clairs conserves (identite visuelle des statuts) — textes assombris
// pour atteindre WCAG AA (>= 4,5:1). Les couleurs vives d'origine restent
// utilisables en bordures, fills d'icones et fonds, mais pas en texte.
// Cf. docs/audit-ux-2026-05.
const VARIANTS: Record<BadgeVariant, { bg: string; color: string }> = {
  default:  { bg: '#f0f3f5', color: '#4d5e6c' }, // 6,01:1
  success:  { bg: '#e8f7f1', color: '#1f7a52' }, // 4,79:1 (avant 3,12:1)
  warning:  { bg: '#fef5e4', color: '#8a560a' }, // 5,68:1 (avant 2,69:1)
  danger:   { bg: '#fdeaea', color: '#9c2d2e' }, // 5,76:1 (avant 4,54:1, on durcit)
  primary:  { bg: '#f2f9e8', color: '#3d7a14' }, // 4,88:1 (avant 2,46:1)
  terra:    { bg: '#fdf4ec', color: '#8e552a' }, // 5,55:1 (avant 3,15:1)
  info:     { bg: '#eaf1fb', color: '#1d4d85' }, // 6,76:1 (avant 5,39:1, on durcit)
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

'use client'

import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'default' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children, variant = 'default', size = 'md',
  onClick, className = '', style, disabled, type = 'button',
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    transition: 'all 0.15s',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    ...(size === 'sm'
      ? { padding: '4px 10px', fontSize: 12 }
      : { padding: '7px 16px', fontSize: 13 }),
  }

  // primary utilise --accent-dark (et non --accent) car le texte est blanc
  // et il faut un contraste WCAG AA >= 4,5:1. --accent reste utilise pour
  // les fonds sans texte (badges decoratifs, bordures, icones).
  // danger : on durcit le rouge du texte (#9c2d2e) pour passer 5,76:1.
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent-dark)', borderColor: 'var(--accent-dark)', color: 'var(--accent-text)' },
    default: { background: 'var(--surface)', borderColor: 'var(--card-border)', color: 'var(--text-fg)' },
    danger:  { background: '#fdeaea', borderColor: '#9c2d2e', color: '#9c2d2e' },
    ghost:   { background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}

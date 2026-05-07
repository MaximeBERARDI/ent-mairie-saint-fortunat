'use client'

import { useState, useRef, useEffect } from 'react'
import { COLORS as C } from '@/lib/theme'
import { INDICATORS, type IndicatorExplanation } from '@/lib/indicators-help'

interface InfoTooltipProps {
  /** Clé dans le dictionnaire INDICATORS */
  indicatorKey?: string
  /** Ou contenu personnalisé */
  custom?: IndicatorExplanation
  /** Taille du picto (défaut 14) */
  size?: number
}

/**
 * Picto "?" cliquable qui affiche une bulle d'aide explicative pour un
 * indicateur financier. Utilisé dans les vues Ratios / Indicateurs M14.
 */
export function InfoTooltip({ indicatorKey, custom, size = 14 }: InfoTooltipProps) {
  const data = custom ?? (indicatorKey ? INDICATORS[indicatorKey] : undefined)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!data) return null

  return (
    <div ref={ref} style={{ display: 'inline-flex', position: 'relative', verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Afficher l'explication"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1px solid ${C.subtle}`,
          background: open ? C.green : 'transparent',
          color: open ? '#fff' : C.subtle,
          cursor: 'pointer',
          padding: 0,
          fontSize: Math.max(8, size - 4),
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: size + 6,
            left: 0,
            zIndex: 100,
            width: 320,
            maxWidth: 'calc(100vw - 40px)',
            padding: 12,
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            fontSize: 11,
            lineHeight: 1.5,
            color: C.fg,
            cursor: 'auto',
            whiteSpace: 'normal',
          }}
        >
          {data.formule && (
            <div style={{
              padding: '6px 8px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              marginBottom: 8,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: C.fg,
            }}>
              {data.formule}
            </div>
          )}
          <p style={{ marginBottom: data.seuils || data.source ? 8 : 0 }}>{data.description}</p>
          {data.seuils && (
            <p style={{ marginBottom: data.source ? 6 : 0 }}>
              <strong style={{ color: C.muted }}>Seuils : </strong>
              <span style={{ color: C.subtle }}>{data.seuils}</span>
            </p>
          )}
          {data.source && (
            <p style={{ fontSize: 10, color: C.subtle, fontStyle: 'italic' }}>
              {data.source}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

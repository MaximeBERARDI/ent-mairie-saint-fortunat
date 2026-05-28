'use client'

// Composants Skeleton : remplacent les « Chargement… » textuels par des
// boîtes grises animées. Mieux perçu, moins de saut de mise en page quand
// les données arrivent.

import type { CSSProperties } from 'react'
import { COLORS as C } from '@/lib/theme'

const KEYFRAMES_ID = 'skeleton-pulse-keyframes'

function injectKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(KEYFRAMES_ID)) return
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = `@keyframes skeleton-pulse { 0%, 100% { opacity: 0.55 } 50% { opacity: 1 } }`
  document.head.appendChild(style)
}

interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}

export function Skeleton({ width = '100%', height = 14, radius = 4, style }: SkeletonProps) {
  injectKeyframes()
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        background: C.ph,
        borderRadius: radius,
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

// 4 cartes KPI sur une ligne (cas finances / dashboard)
export function SkeletonKpis({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--gap)', marginBottom: 'var(--gap)' }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 92,
          }}
        >
          <Skeleton width="60%" height={11} />
          <Skeleton width="40%" height={20} />
          <Skeleton width="80%" height={10} />
        </div>
      ))}
    </div>
  )
}

// Liste générique : n lignes, chaque ligne avec avatar + 2 lignes de texte
export function SkeletonList({ rows = 5, withAvatar = false }: { rows?: number; withAvatar?: boolean }) {
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
          {withAvatar && <Skeleton width={28} height={28} radius={14} />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="55%" height={13} />
            <Skeleton width="35%" height={10} />
          </div>
          <Skeleton width={60} height={20} radius={10} />
        </div>
      ))}
    </div>
  )
}

// Bloc texte multi-lignes (paragraphe en attente)
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={12} />
      ))}
    </div>
  )
}

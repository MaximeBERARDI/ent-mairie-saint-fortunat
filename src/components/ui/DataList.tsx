'use client'

import { useState, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { COLORS as C } from '@/lib/theme'

/**
 * Définition d'une colonne pour <DataList>.
 *
 * @template T Type d'une ligne
 */
export interface DataListColumn<T> {
  /** Identifiant unique (utilisé comme clé React) */
  key: string
  /** Titre de la colonne (en-tête du tableau) */
  label: string
  /** Rendu du contenu de la cellule */
  render: (row: T) => ReactNode
  /** Largeur fixe ou flex (en CSS grid value, ex: '120px' ou '1.5fr') */
  width?: string
  /** Si true, masquée sur les écrans de taille moyenne (< 1100px) */
  hideOnMedium?: boolean
  /** Si true, masquée sur petit écran (< 768px) — sera affichée dans le rendu mobile en mode card */
  hideOnSmall?: boolean
  /** Mis en avant sur le rendu mobile (titre principal de la card) */
  primaryOnMobile?: boolean
  /** Sous-titre sur la card mobile */
  secondaryOnMobile?: boolean
  /** Alignement du contenu */
  align?: 'left' | 'right' | 'center'
}

interface DataListProps<T> {
  rows: T[]
  columns: DataListColumn<T>[]
  /** Identifiant unique pour chaque ligne (clé React) */
  rowKey: (row: T) => string
  /** Au clic sur une ligne */
  onRowClick?: (row: T) => void
  /** Ligne actuellement sélectionnée (mise en évidence) */
  isSelected?: (row: T) => boolean
  /** Background conditionnel par ligne (en plus du selected) */
  rowBackground?: (row: T) => string | undefined
  /** Message si liste vide */
  emptyMessage?: string
  /** Si true, le header est sticky en haut quand on scrolle */
  stickyHeader?: boolean
  /** Densité d'affichage */
  density?: 'compact' | 'comfortable'
}

/**
 * Composant de liste générique avec :
 * - Affichage en tableau aéré sur grand écran
 * - Bascule automatique en cards sur écran ≤ 768px
 * - Colonnes secondaires masquables sur écran moyen
 *
 * Préserve les détails complets dans le panneau drill-down de la page,
 * ce composant ne montre que les colonnes essentielles.
 */
export function DataList<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  isSelected,
  rowBackground,
  emptyMessage = 'Aucun élément à afficher.',
  stickyHeader = false,
  density = 'comfortable',
}: DataListProps<T>) {
  const isMobile = useIsMobile()

  if (rows.length === 0) {
    return (
      <div style={{
        padding: 32,
        textAlign: 'center',
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 8,
      }}>
        <p style={{ fontSize: 13, color: C.subtle, fontStyle: 'italic' }}>{emptyMessage}</p>
      </div>
    )
  }

  // ─── Rendu mobile en cards ────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(row => {
          const selected = isSelected?.(row) ?? false
          const bg = selected ? `${C.green}10` : rowBackground?.(row) ?? '#fff'
          const primary = columns.find(c => c.primaryOnMobile) ?? columns[0]
          const secondary = columns.find(c => c.secondaryOnMobile)
          const otherCols = columns.filter(c => c !== primary && c !== secondary && !c.hideOnSmall)
          return (
            <div
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                background: bg,
                border: `1px solid ${selected ? C.green : C.border}`,
                borderRadius: 8,
                padding: 12,
                cursor: onRowClick ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: C.fg, marginBottom: 4 }}>
                {primary.render(row)}
              </div>
              {secondary && (
                <div style={{ fontSize: 12, color: C.subtle, marginBottom: 10 }}>
                  {secondary.render(row)}
                </div>
              )}
              {otherCols.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  {otherCols.map(col => (
                    <div key={col.key}>
                      <p style={{ fontSize: 9, color: C.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                        {col.label}
                      </p>
                      <div style={{ fontSize: 12, color: C.fg }}>
                        {col.render(row)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ─── Rendu desktop en tableau aéré ────────────────────────────────
  const padding = density === 'compact' ? '8px 14px' : '14px 18px'
  const gridCols = columns.map(c => c.width ?? '1fr').join(' ')

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 14,
          padding,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          position: stickyHeader ? 'sticky' : 'static',
          top: 0,
          zIndex: 2,
        }}
      >
        {columns.map(col => (
          <p
            key={col.key}
            style={{
              fontSize: 10,
              color: C.subtle,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textAlign: col.align ?? 'left',
              minWidth: 0,
            }}
          >
            {col.label}
          </p>
        ))}
      </div>
      {/* Body */}
      {rows.map((row, i) => {
        const selected = isSelected?.(row) ?? false
        const bg = selected ? `${C.green}08` : rowBackground?.(row) ?? '#fff'
        return (
          <div
            key={rowKey(row)}
            onClick={() => onRowClick?.(row)}
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              gap: 14,
              padding,
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
              background: bg,
              alignItems: 'center',
              cursor: onRowClick ? 'pointer' : 'default',
              fontSize: 13,
            }}
          >
            {columns.map(col => (
              <div
                key={col.key}
                style={{
                  textAlign: col.align ?? 'left',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.render(row)}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

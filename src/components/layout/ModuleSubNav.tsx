'use client'

// Sous-navigation latérale d'un module (Finances, RH…). Composant de
// présentation : il ne connaît rien aux permissions — la page lui passe
// uniquement les groupes/items déjà filtrés selon ce que l'utilisateur peut
// consulter. Sur mobile, la page bascule sur un <select className="tabs-select">
// (cette colonne est masquée par .module-subnav en CSS sous 767px).

import { useState, type ReactNode } from 'react'
import { COLORS as C } from '@/lib/theme'

export interface SubNavItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: number
}

export interface SubNavGroup {
  label: string
  items: SubNavItem[]
}

export function ModuleSubNav({ groups, activeId, onSelect }: {
  groups: SubNavGroup[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <nav
      className="module-subnav"
      aria-label="Sections du module"
      style={{
        flex: '0 0 196px', width: 196, alignSelf: 'flex-start',
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '8px 6px',
      }}
    >
      {groups.map(grp => (
        <div key={grp.label} style={{ marginBottom: 6 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: C.subtle, padding: '8px 10px 4px',
          }}>
            {grp.label}
          </div>
          {grp.items.map(item => {
            const on = item.id === activeId
            const hot = !on && hovered === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(h => (h === item.id ? null : h))}
                aria-current={on ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  textAlign: 'left', padding: '7px 10px', borderRadius: 7, border: 'none',
                  background: on ? C.greenLight : hot ? C.slateLight : 'transparent',
                  color: on ? C.greenDark : C.muted, fontWeight: on ? 600 : 500,
                  fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.18s, color 0.18s', minHeight: 34,
                }}
              >
                {item.icon && (
                  <span aria-hidden style={{ display: 'inline-flex', flex: '0 0 auto', opacity: 0.85 }}>
                    {item.icon}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {item.badge ? (
                  <span style={{
                    flex: '0 0 auto', fontSize: 10, fontWeight: 700, color: C.white,
                    background: C.danger, borderRadius: 9, padding: '0 6px', lineHeight: '16px',
                  }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

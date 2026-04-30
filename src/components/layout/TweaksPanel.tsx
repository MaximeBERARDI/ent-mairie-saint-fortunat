'use client'

import { useState } from 'react'
import { useSettings } from '@/context/SettingsContext'
import type { Theme, Density, NavStyle } from '@/lib/types'

export function TweaksPanel() {
  const [open, setOpen] = useState(false)
  const { theme, density, nav, setTheme, setDensity, setNav } = useSettings()

  const THEMES: { value: Theme; label: string }[] = [
    { value: 'ardeche', label: 'Ardèche' },
    { value: 'institutionnel', label: 'Institutionnel' },
    { value: 'sombre', label: 'Sombre' },
  ]

  const DENSITIES: { value: Density; label: string }[] = [
    { value: 'compact', label: 'Compacte' },
    { value: 'comfortable', label: 'Confortable' },
    { value: 'aere', label: 'Aérée' },
  ]

  const NAVS: { value: NavStyle; label: string }[] = [
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'icons', label: 'Icônes' },
    { value: 'top', label: 'Top bar' },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: open ? 296 : 16,
          zIndex: 9999,
          background: '#1f2a31',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'right 0.2s',
        }}
      >
        🎨 Tweaks
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 270,
          zIndex: 9998,
          background: 'rgba(250,249,247,0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1f2a31' }}>Personnalisation</p>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section label="Ambiance">
              <SegmentedControl
                options={THEMES}
                value={theme}
                onChange={v => setTheme(v as Theme)}
              />
            </Section>
            <Section label="Densité d'interface">
              <SegmentedControl
                options={DENSITIES}
                value={density}
                onChange={v => setDensity(v as Density)}
              />
            </Section>
            <Section label="Navigation">
              <SegmentedControl
                options={NAVS}
                value={nav}
                onChange={v => setNav(v as NavStyle)}
              />
            </Section>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(41,38,27,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
      {children}
    </div>
  )
}

function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const idx = options.findIndex(o => o.value === value)
  const n = options.length
  return (
    <div style={{ position: 'relative', display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(0,0,0,0.06)' }}>
      <div style={{
        position: 'absolute',
        top: 2, bottom: 2,
        left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
        width: `calc((100% - 4px) / ${n})`,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        transition: 'left 0.15s cubic-bezier(.3,.7,.4,1)',
      }} />
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 4px',
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

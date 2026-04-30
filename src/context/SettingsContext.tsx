'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Theme, Density, NavStyle, AppSettings } from '@/lib/types'

interface SettingsContextValue extends AppSettings {
  setTheme: (t: Theme) => void
  setDensity: (d: Density) => void
  setNav: (n: NavStyle) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  theme: 'ardeche',
  density: 'comfortable',
  nav: 'sidebar',
  setTheme: () => {},
  setDensity: () => {},
  setNav: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'ardeche',
    density: 'comfortable',
    nav: 'sidebar',
  })

  useEffect(() => {
    const saved = localStorage.getItem('ent-settings')
    if (saved) {
      try { setSettings(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('ent-settings', JSON.stringify(settings))
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme === 'ardeche' ? '' : settings.theme)
    root.setAttribute('data-density', settings.density === 'comfortable' ? '' : settings.density)
    root.setAttribute('data-nav', settings.nav)
  }, [settings])

  return (
    <SettingsContext.Provider value={{
      ...settings,
      setTheme: (t) => setSettings(s => ({ ...s, theme: t })),
      setDensity: (d) => setSettings(s => ({ ...s, density: d })),
      setNav: (n) => setSettings(s => ({ ...s, nav: n })),
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)

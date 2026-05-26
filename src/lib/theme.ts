import type { Theme, Density, NavStyle } from './types'

// `accentDark` est l'accent utilisé pour porter du texte (boutons primaires,
// liens, KPI). Le ratio de contraste de l'accent vif (#6ab123) sur blanc est
// 2,65:1, sous le seuil WCAG AA. accentDark passe 5,26:1 et reste reconnaissable
// comme le vert ardéchois. Cf. docs/audit-ux-2026-05.
//
// `sidebarText` et `sidebarMuted` ont été remontés (0.5 → 0.78, 0.45 → 0.7)
// pour atteindre WCAG AA sur fond sidebar slate.
export const THEMES: Record<Theme, Record<string, string>> = {
  ardeche: {
    sidebar: '#2e3b45',
    sidebarActive: 'rgba(106,177,35,0.25)',
    sidebarText: 'rgba(255,255,255,0.92)',
    sidebarMuted: 'rgba(255,255,255,0.78)',
    accent: '#6ab123',
    accentDark: '#3d7a14',
    accentLight: '#f2f9e8',
    accentText: '#fff',
    bg: '#f4f6f1',
    surface: '#ffffff',
    topbar: '#ffffff',
    border: '#dde4e9',
    fg: '#1f2a31',
    muted: '#4d5e6c',
    subtle: '#5e7480',
    topbarText: '#1f2a31',
  },
  institutionnel: {
    sidebar: '#132d4e',
    sidebarActive: 'rgba(37,99,168,0.28)',
    sidebarText: 'rgba(255,255,255,0.94)',
    sidebarMuted: 'rgba(255,255,255,0.78)',
    accent: '#2563a8',
    accentDark: '#1d4d85',
    accentLight: '#eaf1fb',
    accentText: '#fff',
    bg: '#eef2f7',
    surface: '#ffffff',
    topbar: '#ffffff',
    border: '#ccd8e5',
    fg: '#0f2033',
    muted: '#2e4a68',
    subtle: '#4a6985',
    topbarText: '#0f2033',
  },
  sombre: {
    sidebar: '#0d1210',
    sidebarActive: 'rgba(106,177,35,0.22)',
    sidebarText: 'rgba(255,255,255,0.92)',
    sidebarMuted: 'rgba(255,255,255,0.7)',
    accent: '#6ab123',
    accentDark: '#8fc94f',
    accentLight: '#1c2a14',
    accentText: '#0d1210',
    bg: '#181f1a',
    surface: '#222c24',
    topbar: '#1a2420',
    border: '#2c3a2e',
    fg: '#dce8dc',
    muted: '#a8c3a8',
    subtle: '#7e9a82',
    topbarText: '#dce8dc',
  },
}

export const DENSITIES: Record<Density, { contentPad: number; cardPad: number; gap: number; topbarH: number }> = {
  compact: { contentPad: 12, cardPad: 8, gap: 8, topbarH: 42 },
  comfortable: { contentPad: 20, cardPad: 12, gap: 12, topbarH: 50 },
  aere: { contentPad: 28, cardPad: 18, gap: 16, topbarH: 62 },
}

export const SIDEBAR_WIDTHS: Record<NavStyle, number> = {
  sidebar: 212,
  icons: 54,
  top: 0,
}

// Les *Dark variantes sont utilisées pour porter du texte (boutons, badges
// avec texte, liens, KPI). Les couleurs de base restent réservées aux fonds,
// bordures, icônes décoratives. Cf. docs/audit-ux-2026-05 (audit RGAA / WCAG AA).
export const COLORS = {
  green: '#6ab123',
  greenDark: '#3d7a14',
  greenLight: '#f2f9e8',
  greenMid: '#c4e18a',
  slate: '#4d5e6c',
  slateLight: '#f0f3f5',
  slateDark: '#2e3b45',
  terra: '#c4793a',
  terraDark: '#8e552a',
  terraLight: '#fdf4ec',
  bg: '#f4f6f1',
  white: '#ffffff',
  border: '#dde4e9',
  fg: '#1f2a31',
  muted: '#4d5e6c',
  subtle: '#5e7480',
  ph: '#e2e6e3',
  success: '#2d9c6e',
  successDark: '#1f7a52',
  successLight: '#e8f7f1',
  warning: '#d4860a',
  warningDark: '#8a560a',
  warningLight: '#fef5e4',
  danger: '#c4393a',
  dangerDark: '#9c2d2e',
  dangerLight: '#fdeaea',
  info: '#2563a8',
  infoDark: '#1d4d85',
  infoLight: '#eaf1fb',
}

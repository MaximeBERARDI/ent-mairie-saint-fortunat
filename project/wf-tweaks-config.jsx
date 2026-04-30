// wf-tweaks-config.jsx — Theme, density & nav context for wireframes

const TweakCtx = React.createContext({ theme:'ardeche', density:'comfortable', nav:'sidebar' });

const THEMES = {
  ardeche: {
    id: 'ardeche',
    sidebar: '#2e3b45', sidebarActive: 'rgba(106,177,35,0.2)',
    sidebarText: 'rgba(255,255,255,0.9)', sidebarMuted: 'rgba(255,255,255,0.45)',
    accent: '#6ab123', accentLight: '#f2f9e8', accentText: '#fff',
    bg: '#f4f6f1', surface: '#ffffff', topbar: '#ffffff',
    border: '#dde4e9', fg: '#1f2a31', muted: '#4d5e6c', subtle: '#94aab7',
    topbarText: '#1f2a31',
  },
  institutionnel: {
    id: 'institutionnel',
    sidebar: '#132d4e', sidebarActive: 'rgba(37,99,168,0.25)',
    sidebarText: 'rgba(255,255,255,0.92)', sidebarMuted: 'rgba(255,255,255,0.42)',
    accent: '#2563a8', accentLight: '#eaf1fb', accentText: '#fff',
    bg: '#eef2f7', surface: '#ffffff', topbar: '#ffffff',
    border: '#ccd8e5', fg: '#0f2033', muted: '#2e4a68', subtle: '#7090b0',
    topbarText: '#0f2033',
  },
  sombre: {
    id: 'sombre',
    sidebar: '#0d1210', sidebarActive: 'rgba(106,177,35,0.18)',
    sidebarText: 'rgba(255,255,255,0.85)', sidebarMuted: 'rgba(255,255,255,0.35)',
    accent: '#6ab123', accentLight: '#1c2a14', accentText: '#fff',
    bg: '#181f1a', surface: '#222c24', topbar: '#1a2420',
    border: '#2c3a2e', fg: '#dce8dc', muted: '#8aab8e', subtle: '#556b58',
    topbarText: '#dce8dc',
  },
};

const DENSITIES = {
  compact:     { label:'Compacte',    contentPad:12, cardPad:8,  gap:8,  topbarH:42, rowPad:'5px 0' },
  comfortable: { label:'Confortable', contentPad:20, cardPad:12, gap:12, topbarH:50, rowPad:'7px 0' },
  aere:        { label:'Aérée',       contentPad:28, cardPad:18, gap:16, topbarH:62, rowPad:'10px 0' },
};

const useTheme = () => {
  const ctx = React.useContext(window.TweakCtx || TweakCtx);
  const theme   = THEMES[ctx.theme]     || THEMES.ardeche;
  const density = DENSITIES[ctx.density] || DENSITIES.comfortable;
  return { tweaks: ctx, theme, density };
};

Object.assign(window, { TweakCtx, THEMES, DENSITIES, useTheme });

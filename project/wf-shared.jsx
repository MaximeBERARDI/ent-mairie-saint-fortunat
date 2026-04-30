// wf-shared.jsx — Primitives partagées (context-aware)

const C = {
  green:'#6ab123', greenLight:'#f2f9e8', greenMid:'#c4e18a',
  slate:'#4d5e6c', slateLight:'#f0f3f5', slateDark:'#2e3b45',
  terra:'#c4793a', terraLight:'#fdf4ec',
  bg:'#f4f6f1', white:'#ffffff', border:'#dde4e9',
  fg:'#1f2a31', muted:'#4d5e6c', subtle:'#94aab7',
  success:'#2d9c6e', successLight:'#e8f7f1',
  warning:'#d4860a', warningLight:'#fef5e4',
  danger:'#c4393a', dangerLight:'#fdeaea',
  info:'#2563a8', infoLight:'#eaf1fb',
  ph:'#e2e6e3',
};

// Safe context hook — works even before wf-tweaks-config loads
const DEFAULT_THEME = {
  sidebar:'#2e3b45', sidebarActive:'rgba(106,177,35,0.2)',
  sidebarText:'rgba(255,255,255,0.9)', sidebarMuted:'rgba(255,255,255,0.45)',
  accent:C.green, accentLight:C.greenLight, accentText:'#fff',
  bg:C.bg, surface:C.white, topbar:C.white, border:C.border,
  fg:C.fg, muted:C.muted, subtle:C.subtle, topbarText:C.fg,
};
const DEFAULT_DENSITY = { contentPad:20, cardPad:12, gap:12, topbarH:50, rowPad:'7px 0' };

const useWFTheme = () => {
  if (window.useTheme) return window.useTheme();
  return { theme:DEFAULT_THEME, density:DEFAULT_DENSITY, tweaks:{ nav:'sidebar' } };
};

// ── Typography ───────────────────────────────────────────────
const tx = (size, color, weight=400, extra={}) => ({
  fontSize:size, color, fontWeight:weight, fontFamily:"'DM Sans',sans-serif",
  lineHeight:1.4, ...extra,
});
const T = ({ children, s=12, c=C.fg, w=400, mb=0, style={} }) => (
  <div style={{ ...tx(s,c,w), marginBottom:mb, ...style }}>{children}</div>
);

// ── Primitives (color-static — intentional) ──────────────────
const WFBox = ({ width='100%', h=40, color, label='', style={}, round=4 }) => (
  <div style={{ width, height:h, background:color||C.ph, borderRadius:round,
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, ...style }}>
    {label && <span style={tx(10,C.subtle)}>{label}</span>}
  </div>
);

// WFCard — theme-aware surface + border + density padding
const WFCard = ({ children, style={}, p }) => {
  const { theme, density } = useWFTheme();
  const padding = p !== undefined ? p : density.cardPad;
  return (
    <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:8,
      padding, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  );
};

const WFKpi = ({ label, value, sub, color=C.green, style={} }) => (
  <WFCard style={{ flex:1, minWidth:0, ...style }}>
    <T s={10} c={C.subtle} mb={4}>{label}</T>
    <T s={26} c={color} w={700} mb={2}>{value}</T>
    {sub && <T s={10} c={C.subtle}>{sub}</T>}
  </WFCard>
);

const WFBadge = ({ label, type='default' }) => {
  const map = {
    default:[C.slateLight,C.slate], success:[C.successLight,C.success],
    warning:[C.warningLight,C.warning], danger:[C.dangerLight,C.danger],
    primary:[C.greenLight,C.green], terra:[C.terraLight,C.terra], info:[C.infoLight,C.info],
  };
  const [bg,fg] = map[type]||map.default;
  return <span style={{ padding:'2px 8px', borderRadius:9999, background:bg, color:fg,
    fontSize:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>{label}</span>;
};

const WFBtn = ({ label, primary, small, danger, style={} }) => {
  const { theme } = useWFTheme();
  const accent = theme.accent || C.green;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', padding:small?'4px 10px':'7px 14px',
      borderRadius:6, cursor:'pointer', flexShrink:0,
      background: danger?C.dangerLight : primary?accent:theme.surface,
      border:`1px solid ${danger?C.danger:primary?accent:theme.border}`, ...style }}>
      <span style={tx(small?10:12, danger?C.danger : primary?'#fff':C.fg, 600)}>{label}</span>
    </div>
  );
};

const WFProg = ({ pct, color }) => {
  const c = color || (pct>85?C.danger : pct>65?C.warning : C.green);
  return (
    <div style={{ width:'100%', height:6, borderRadius:3, background:C.ph, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:3 }} />
    </div>
  );
};

// WFRow — theme-aware separator
const WFRow = ({ label, sub, badge, badgeType, right, last, dot }) => {
  const { theme } = useWFTheme();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0',
      borderBottom: last?'none':`1px solid ${theme.border}` }}>
      {dot && <div style={{ width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0 }} />}
      <div style={{ flex:1,minWidth:0 }}>
        <T s={12} c={C.fg} w={500}>{label}</T>
        {sub && <T s={10} c={C.subtle}>{sub}</T>}
      </div>
      {badge && <WFBadge label={badge} type={badgeType||'default'} />}
      {right && <T s={10} c={C.subtle}>{right}</T>}
    </div>
  );
};

const WFSep = ({ my=10 }) => {
  const { theme } = useWFTheme();
  return <div style={{ height:1, background:theme.border, margin:`${my}px 0` }} />;
};

const WFAvatar = ({ initials='JM', color=C.terra, size=28 }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', background:color, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center' }}>
    <span style={tx(size*0.35, '#fff', 700)}>{initials}</span>
  </div>
);

const WFTag = ({ label, color=C.green }) => (
  <span style={{ padding:'2px 7px', borderRadius:3, background:`${color}18`,
    border:`1px solid ${color}40`, fontSize:10, fontWeight:600,
    fontFamily:"'DM Sans',sans-serif", color, whiteSpace:'nowrap' }}>{label}</span>
);

const WFNote = ({ children, style={} }) => (
  <div style={{ background:'#fffde7', border:'1px dashed #f4c842', borderRadius:4,
    padding:'3px 8px', fontSize:11, color:'#7a6000', fontFamily:"'Caveat',cursive",
    display:'inline-block', ...style }}>{children}</div>
);

const WFStep = ({ steps, current }) => (
  <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:16 }}>
    {steps.map((s,i) => (
      <React.Fragment key={i}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:28,height:28,borderRadius:'50%', display:'flex',alignItems:'center',justifyContent:'center',
            background: i<=current?C.green:'#e2e6e3', border:`2px solid ${i<=current?C.green:'#e2e6e3'}` }}>
            {i<current ? <T s={11} c='#fff' w={700}>✓</T>
                       : <T s={11} c={i===current?'#fff':C.subtle} w={600}>{i+1}</T>}
          </div>
          <T s={9} c={i===current?C.green:C.subtle} w={i===current?600:400}>{s}</T>
        </div>
        {i<steps.length-1 && <div style={{ flex:1,height:2,background:i<current?C.green:'#e2e6e3',margin:'0 4px',marginBottom:16 }} />}
      </React.Fragment>
    ))}
  </div>
);

// ── Navigation ───────────────────────────────────────────────
const NAV = [
  'Tableau de bord','Tâches','Commissions',
  'Comptes rendus','Ressources humaines','Finances','Équipe',
];

// Sidebar — full or icon-only
const Sidebar = ({ active=0 }) => {
  const { theme, tweaks } = useWFTheme();
  const isIcons = tweaks.nav === 'icons';
  const w = isIcons ? 54 : 212;

  return (
    <div style={{ width:w, background:theme.sidebar, display:'flex', flexDirection:'column',
      flexShrink:0, height:'100%', transition:'width 200ms ease' }}>
      {/* Logo */}
      <div style={{ padding: isIcons ? '16px 0' : '18px 14px 14px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        display:'flex', alignItems:'center', justifyContent: isIcons?'center':'flex-start', gap:8 }}>
        <div style={{ width:26,height:26,borderRadius:5,background:theme.accent,flexShrink:0,
          display:'flex',alignItems:'center',justifyContent:'center' }}>
          <T s={10} c='#fff' w={700}>{isIcons ? 'S' : 'SFE'}</T>
        </div>
        {!isIcons && <div>
          <T s={11} c={theme.sidebarText} w={600}>Saint-Fortunat</T>
          <T s={9} c={theme.sidebarMuted}>Espace de travail</T>
        </div>}
      </div>
      {/* Nav items */}
      <div style={{ flex:1, padding:'8px', display:'flex', flexDirection:'column', gap:1, overflowY:'auto' }}>
        {NAV.map((n,i) => (
          <div key={i} title={isIcons ? n : ''} style={{ display:'flex', alignItems:'center',
            gap: isIcons ? 0 : 8, padding: isIcons ? '8px 0' : '7px 10px',
            justifyContent: isIcons ? 'center' : 'flex-start',
            borderRadius:6, background: i===active?theme.sidebarActive:'transparent', cursor:'pointer' }}>
            <WFBox width={14} h={14} color={i===active?theme.accent:'rgba(255,255,255,0.18)'}
              round={3} style={{ flexShrink:0 }} />
            {!isIcons && <T s={12} c={i===active?theme.sidebarText:'rgba(255,255,255,0.5)'}
              w={i===active?600:400}>{n}</T>}
            {!isIcons && i===1 && <div style={{ marginLeft:'auto', width:16,height:16,
              borderRadius:'50%', background:C.danger,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              <T s={8} c='#fff' w={700}>5</T></div>}
          </div>
        ))}
      </div>
      {/* User */}
      {!isIcons && (
        <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex', alignItems:'center', gap:8 }}>
          <WFAvatar initials='JM' size={28} />
          <div>
            <T s={11} c={theme.sidebarText} w={500}>Jean Martin</T>
            <T s={9} c={theme.sidebarMuted}>Conseiller</T>
          </div>
        </div>
      )}
      {isIcons && (
        <div style={{ padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex', justifyContent:'center' }}>
          <WFAvatar initials='JM' size={26} />
        </div>
      )}
    </div>
  );
};

// TopBar — standard (used with sidebar) or top-nav (nav='top')
const TopBar = ({ title, active=0, notif=2 }) => {
  const { theme, density, tweaks } = useWFTheme();
  const isTopNav = tweaks.nav === 'top';
  const h = density.topbarH;

  return (
    <div style={{ height:h, background:theme.topbar, borderBottom:`1px solid ${theme.border}`,
      display:'flex', alignItems:'center', gap:12, padding:'0 20px', flexShrink:0 }}>
      {/* Logo (top nav only) */}
      {isTopNav && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:8, flexShrink:0 }}>
          <div style={{ width:24,height:24,borderRadius:5,background:theme.accent,
            display:'flex',alignItems:'center',justifyContent:'center' }}>
            <T s={9} c='#fff' w={700}>SFE</T>
          </div>
          <T s={12} c={theme.topbarText} w={700}>Saint-Fortunat</T>
        </div>
      )}
      {/* Nav items (top nav only) */}
      {isTopNav && (
        <div style={{ display:'flex', gap:2, flex:1 }}>
          {NAV.map((n,i) => (
            <div key={i} style={{ padding:'5px 10px', borderRadius:6, cursor:'pointer',
              background: i===active ? `${theme.accent}18` : 'transparent' }}>
              <T s={11} c={i===active?theme.accent:theme.muted} w={i===active?600:400}>{n}</T>
            </div>
          ))}
        </div>
      )}
      {/* Title (sidebar modes) */}
      {!isTopNav && <T s={15} c={theme.topbarText} w={600} style={{ flex:1 }}>{title}</T>}
      {/* Right controls */}
      <WFBox width={isTopNav?160:180} h={isTopNav?28:30} color={`${theme.border}60`}
        label='Rechercher…' style={{ borderRadius:20, border:`1px solid ${theme.border}`, flexShrink:0 }} />
      <div style={{ position:'relative', flexShrink:0 }}>
        <WFBox width={30} h={30} color={`${theme.border}60`} round={6}
          style={{ border:`1px solid ${theme.border}` }} />
        {notif>0 && <div style={{ position:'absolute',top:-3,right:-3,width:14,height:14,
          borderRadius:'50%',background:C.danger,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <T s={8} c='#fff' w={700}>{notif}</T></div>}
      </div>
      <WFAvatar initials='JM' size={30} />
    </div>
  );
};

// Shell — the main layout wrapper
const Shell = ({ title, active=0, children, notif=2 }) => {
  const { theme, density, tweaks } = useWFTheme();
  const isTopNav = tweaks.nav === 'top';

  return (
    <div style={{ display:'flex', flexDirection: isTopNav ? 'column' : 'row',
      height:'100%', background:theme.bg, fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>
      {/* Sidebar (sidebar + icons modes) */}
      {!isTopNav && <Sidebar active={active} />}
      {/* Main area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <TopBar title={title} active={active} notif={notif} />
        <div style={{ flex:1, overflow:'auto', padding:density.contentPad }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const SectionHd = ({ title, actions }) => (
  <div style={{ display:'flex',alignItems:'center',marginBottom:14,gap:8 }}>
    <T s={14} c={C.fg} w={600} style={{ flex:1 }}>{title}</T>
    {actions}
  </div>
);

Object.assign(window, {
  C, T, WFBox, WFCard, WFKpi, WFBadge, WFBtn, WFProg, WFRow, WFSep,
  WFAvatar, WFTag, WFNote, WFStep, Sidebar, TopBar, Shell, SectionHd,
  useWFTheme,
});

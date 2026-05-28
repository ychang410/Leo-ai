export const THEMES = {
  pink: {
    label: '핑크',
    dot: '#F9A8D4',
    vars: {
      '--accent':         '#FBCFE8',
      '--accent-dim':     'rgba(251,140,200,0.10)',
      '--accent-border':  'rgba(251,140,200,0.22)',
      '--accent-glow':    'rgba(251,180,220,0.32)',
      '--text-main':      '#FDF2F8',
      '--text-sub':       '#C4A0B8',
      '--text-dim':       '#4A3040',
      '--bg-app':         '#06091A',
      '--bg-sidebar':     'rgba(7,9,24,0.96)',
      '--bg-card':        'rgba(10,8,28,0.80)',
      '--bg-input':       'rgba(8,6,22,0.85)',
      '--bg-nav-active':  'rgba(240,120,180,0.10)',
      '--ok-color':       '#FDE68A',
      '--ok-glow':        'rgba(253,220,138,0.35)',
      '--star-opacity':   '1',
      '--nebula-opacity': '1',
    },
  },
  blue: {
    label: '블루',
    dot: '#93C5FD',
    vars: {
      '--accent':         '#BFDBFE',
      '--accent-dim':     'rgba(126,184,255,0.10)',
      '--accent-border':  'rgba(126,184,255,0.22)',
      '--accent-glow':    'rgba(126,184,255,0.32)',
      '--text-main':      '#EFF6FF',
      '--text-sub':       '#93C5FD',
      '--text-dim':       '#2A4060',
      '--bg-app':         '#06091A',
      '--bg-sidebar':     'rgba(6,9,24,0.96)',
      '--bg-card':        'rgba(8,12,32,0.80)',
      '--bg-input':       'rgba(6,9,24,0.85)',
      '--bg-nav-active':  'rgba(80,140,255,0.10)',
      '--ok-color':       '#6EE7B7',
      '--ok-glow':        'rgba(110,231,183,0.35)',
      '--star-opacity':   '1',
      '--nebula-opacity': '1',
    },
  },
  red: {
    label: '레드',
    dot: '#FCA5A5',
    vars: {
      '--accent':         '#FECACA',
      '--accent-dim':     'rgba(254,150,150,0.10)',
      '--accent-border':  'rgba(254,150,150,0.22)',
      '--accent-glow':    'rgba(254,180,180,0.30)',
      '--text-main':      '#FFF1F1',
      '--text-sub':       '#FECACA',
      '--text-dim':       '#4A2828',
      '--bg-app':         '#06091A',
      '--bg-sidebar':     'rgba(8,6,20,0.96)',
      '--bg-card':        'rgba(14,8,20,0.80)',
      '--bg-input':       'rgba(10,5,18,0.85)',
      '--bg-nav-active':  'rgba(254,100,100,0.10)',
      '--ok-color':       '#FED7AA',
      '--ok-glow':        'rgba(254,210,160,0.35)',
      '--star-opacity':   '1',
      '--nebula-opacity': '1',
    },
  },
  yellow: {
    label: '노랑',
    dot: '#FDE68A',
    vars: {
      '--accent':         '#FDE68A',
      '--accent-dim':     'rgba(253,220,100,0.10)',
      '--accent-border':  'rgba(253,220,100,0.22)',
      '--accent-glow':    'rgba(253,220,100,0.30)',
      '--text-main':      '#FFFBEB',
      '--text-sub':       '#D4A840',
      '--text-dim':       '#4A3A10',
      '--bg-app':         '#06091A',
      '--bg-sidebar':     'rgba(8,8,16,0.96)',
      '--bg-card':        'rgba(14,12,8,0.80)',
      '--bg-input':       'rgba(10,9,6,0.85)',
      '--bg-nav-active':  'rgba(253,220,100,0.10)',
      '--ok-color':       '#86EFAC',
      '--ok-glow':        'rgba(134,239,172,0.35)',
      '--star-opacity':   '1',
      '--nebula-opacity': '1',
    },
  },
  white: {
    label: '화이트',
    dot: '#A78BFA',
    vars: {
      '--accent':         '#7C3AED',
      '--accent-dim':     'rgba(124,58,237,0.08)',
      '--accent-border':  'rgba(124,58,237,0.18)',
      '--accent-glow':    'rgba(124,58,237,0.20)',
      '--text-main':      '#1A1030',
      '--text-sub':       '#6B5080',
      '--text-dim':       '#C0B0D0',
      '--bg-app':         '#F4F0FF',
      '--bg-sidebar':     'rgba(242,236,255,0.98)',
      '--bg-card':        'rgba(255,255,255,0.95)',
      '--bg-input':       'rgba(255,255,255,0.95)',
      '--bg-nav-active':  'rgba(124,58,237,0.08)',
      '--ok-color':       '#059669',
      '--ok-glow':        'rgba(5,150,105,0.25)',
      '--star-opacity':   '0',
      '--nebula-opacity': '0',
    },
  },
}

export const THEME_ORDER = ['pink', 'blue', 'red', 'yellow', 'white']
export const DEFAULT_THEME = 'pink'
const STORAGE_KEY = 'planner_theme'

export function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
}

export function applyTheme(themeId) {
  const theme = THEMES[themeId]
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })
  localStorage.setItem(STORAGE_KEY, themeId)
}

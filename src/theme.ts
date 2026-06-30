import { createTheme, responsiveFontSizes, type ThemeOptions } from '@mui/material/styles'

// ── Kaizen Design Tokens ──────────────────────────────────────────────────────
export const KZ = {
  // Verde esmeralda — cor principal (dinheiro, crescimento, saúde)
  green:     '#10B981',
  greenDim:  '#34D399',
  greenDark: '#059669',
  // Dourado — metas, investimentos, conquistas
  gold:      '#F59E0B',
  goldDim:   '#FCD34D',
  // Vermelho — dívidas, alertas críticos
  red:       '#EF4444',
  redDim:    '#FCA5A5',
  // Azul — informação, receitas, neutro
  blue:      '#3B82F6',
  // Backgrounds
  bg:        '#060A0E',          // preto-azulado profundo
  surface:   'rgba(10,15,20,0.98)',
  surfaceAlt:'rgba(13,19,26,0.98)',
  // Borders
  border:    'rgba(255,255,255,0.07)',
  borderGreen: 'rgba(16,185,129,0.2)',
  // Text
  t1: 'rgba(255,255,255,0.92)',
  t2: 'rgba(255,255,255,0.50)',
  t3: 'rgba(255,255,255,0.26)',
}

// Gradientes utilitários
export const KZ_GRADIENTS = {
  green:  'linear-gradient(135deg, #10B981, #059669)',
  gold:   'linear-gradient(135deg, #F59E0B, #D97706)',
  danger: 'linear-gradient(135deg, #EF4444, #DC2626)',
  hero:   'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
}

export const themeOptions: ThemeOptions = {
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1920 } },

  palette: {
    mode: 'dark',
    primary:    { main: KZ.green,  light: KZ.greenDim, dark: KZ.greenDark },
    secondary:  { main: KZ.gold },
    background: { default: KZ.bg, paper: KZ.surface },
    success:    { main: KZ.green },
    warning:    { main: KZ.gold },
    error:      { main: KZ.red },
    info:       { main: KZ.blue },
    text: { primary: KZ.t1, secondary: KZ.t2, disabled: KZ.t3 },
    divider: KZ.border,
  },

  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontWeightBold: 700,
    h1: { fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08 },
    h2: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.12 },
    h3: { fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { letterSpacing: '-0.011em', lineHeight: 1.65 },
    body2: { letterSpacing: '-0.006em', lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '-0.01em', textTransform: 'none' },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          background: KZ.bg,
          scrollbarColor: `rgba(16,185,129,0.3) transparent`,
          '&::-webkit-scrollbar': { width: 4, height: 4 },
          '&::-webkit-scrollbar-thumb': { background: `rgba(16,185,129,0.25)`, borderRadius: 4 },
        },
        // Acessibilidade/bateria: respeita "reduzir movimento" do sistema
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: KZ.surface,
          border: `1px solid ${KZ.border}`,
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
          transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.18s',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.12)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: KZ.surface,
          border: `1px solid ${KZ.border}`,
          borderRadius: 12,
        },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(8,12,18,0.99)',
          backdropFilter: 'blur(40px)',
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 18,
          boxShadow: '0 4px 8px rgba(0,0,0,0.6), 0 32px 96px rgba(0,0,0,0.9)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10, transition: 'all 0.18s' },
        contained: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          '&:hover': { transform: 'translateY(-1px)', filter: 'brightness(1.08)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' },
        },
        outlined: {
          borderColor: KZ.border,
          '&:hover': { borderColor: KZ.borderGreen, background: 'rgba(16,185,129,0.05)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 8, transition: 'background 0.15s', '&:hover': { background: 'rgba(16,185,129,0.08)' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 7, fontSize: '0.72rem', border: '1px solid transparent' },
        colorPrimary: {
          background: 'rgba(16,185,129,0.12)', color: KZ.green, borderColor: 'rgba(16,185,129,0.25)',
        },
        colorSecondary: {
          background: 'rgba(245,158,11,0.12)', color: KZ.gold, borderColor: 'rgba(245,158,11,0.25)',
        },
        colorError: {
          background: 'rgba(239,68,68,0.1)', color: KZ.red, borderColor: 'rgba(239,68,68,0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            '& fieldset': { borderColor: KZ.border, transition: 'border-color 0.2s' },
            '&:hover:not(.Mui-focused) fieldset': { borderColor: 'rgba(16,185,129,0.3)' },
            '&.Mui-focused fieldset': { borderColor: KZ.green, borderWidth: '1.5px' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: KZ.green },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: KZ.border, borderBottomWidth: '0.5px' } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(8,12,18,0.97)', backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
          fontSize: '0.72rem', color: KZ.t1, padding: '6px 10px',
        },
        arrow: { color: 'rgba(8,12,18,0.97)' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: 'rgba(8,12,18,0.99)', backdropFilter: 'blur(24px)',
          border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.82rem', borderRadius: 7, margin: '1px 4px',
          '&:hover': { background: 'rgba(16,185,129,0.06)' },
          '&.Mui-selected': { background: 'rgba(16,185,129,0.1)', '&:hover': { background: 'rgba(16,185,129,0.15)' } },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' },
        bar:  { borderRadius: 6 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${KZ.border}`, color: KZ.t1, padding: '10px 16px' },
        head: { color: KZ.t2, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.02)' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s',
          '&:hover': { background: 'rgba(16,185,129,0.03)' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { height: 64, background: 'rgba(6,10,14,0.99)', backdropFilter: 'blur(24px)', borderTop: `1px solid ${KZ.border}` },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { minWidth: 0, color: KZ.t2, '&.Mui-selected': { color: KZ.green } },
        label: { fontWeight: 500, fontSize: '0.58rem' },
      },
    },
  },
}

const base = createTheme(themeOptions)
export default responsiveFontSizes(base, { breakpoints: ['md', 'lg', 'xl'], factor: 2 })

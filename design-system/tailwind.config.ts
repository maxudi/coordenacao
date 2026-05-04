import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ─── CORES ────────────────────────────────────────────────────────────────
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // base
          700: '#1d4ed8', // hover
          800: '#1e40af', // active
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // base
          700: '#6d28d9', // hover
          800: '#5b21b6', // active
          900: '#4c1d95',
          950: '#2e1065',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // base
          700: '#15803d', // hover
          800: '#166534', // active
          900: '#14532d',
          950: '#052e16',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // base
          700: '#b91c1c', // hover
          800: '#991b1b', // active
          900: '#7f1d1d',
          950: '#450a0a',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // base
          600: '#d97706', // hover
          700: '#b45309', // active
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // ── Neutros / superfícies ──────────────────────────────────────────────
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8fafc', // background da página
          subtle:  '#f1f5f9', // hover de linhas de tabela, chips
          border:  '#e2e8f0', // bordas gerais
        },
        ink: {
          DEFAULT: '#0f172a', // texto principal
          muted:   '#64748b', // texto secundário / placeholder
          faint:   '#94a3b8', // texto desativado / hint
        },
      },

      // ─── TIPOGRAFIA ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // [tamanho, { lineHeight, letterSpacing, fontWeight padrão }]
        'display-xl': ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-lg': ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.02em' }],
        'display':    ['1.875rem',{ lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-xl': ['1.5rem',  { lineHeight: '1.33', letterSpacing: '-0.01em' }],
        'heading-lg': ['1.25rem', { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        'heading':    ['1.125rem',{ lineHeight: '1.5',  letterSpacing: '0' }],
        'heading-sm': ['1rem',    { lineHeight: '1.5',  letterSpacing: '0' }],
        'body-lg':    ['1rem',    { lineHeight: '1.625',letterSpacing: '0' }],
        'body':       ['0.875rem',{ lineHeight: '1.571',letterSpacing: '0' }],
        'body-sm':    ['0.8125rem',{ lineHeight:'1.538',letterSpacing: '0' }],
        'caption':    ['0.75rem', { lineHeight: '1.5',  letterSpacing: '0.01em' }],
        'overline':   ['0.6875rem',{ lineHeight:'1.45', letterSpacing: '0.08em' }],
      },
      fontWeight: {
        regular:   '400',
        medium:    '500',
        semibold:  '600',
        bold:      '700',
      },

      // ─── ESPAÇAMENTOS ─────────────────────────────────────────────────────────
      spacing: {
        // Escala de 4 px (base 4 px)
        '0.5':  '2px',
        '1':    '4px',
        '1.5':  '6px',
        '2':    '8px',
        '2.5':  '10px',
        '3':    '12px',
        '3.5':  '14px',
        '4':    '16px',
        '5':    '20px',
        '6':    '24px',
        '7':    '28px',
        '8':    '32px',
        '9':    '36px',
        '10':   '40px',
        '12':   '48px',
        '14':   '56px',
        '16':   '64px',
        '18':   '72px',
        '20':   '80px',
        '24':   '96px',
        '28':   '112px',
        '32':   '128px',
        '36':   '144px',
        '40':   '160px',
        '48':   '192px',
        '56':   '224px',
        '64':   '256px',
      },

      // ─── BORDAS ───────────────────────────────────────────────────────────────
      borderRadius: {
        none:    '0',
        sm:      '4px',
        DEFAULT: '6px',
        md:      '8px',
        lg:      '12px',
        xl:      '16px',
        '2xl':   '20px',
        full:    '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0':     '0',
        '2':     '2px',
      },
      borderColor: {
        DEFAULT: '#e2e8f0', // surface.border
      },

      // ─── SOMBRAS ──────────────────────────────────────────────────────────────
      boxShadow: {
        // Sombras sutis para SaaS clean
        xs:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm:   '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT:'0 2px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        md:   '0 4px 10px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg:   '0 10px 24px -4px rgb(0 0 0 / 0.1),  0 4px 8px -4px rgb(0 0 0 / 0.06)',
        xl:   '0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -6px rgb(0 0 0 / 0.08)',
        // Sombra colorida para botão primário
        'primary-glow': '0 4px 14px 0 rgb(37 99 235 / 0.30)',
        // Inner shadows
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
        none:  'none',
      },

      // ─── TRANSIÇÕES ───────────────────────────────────────────────────────────
      transitionDuration: {
        fast:    '100ms',
        DEFAULT: '150ms',
        slow:    '250ms',
        slower:  '400ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in:      'cubic-bezier(0.4, 0, 1, 1)',
        out:     'cubic-bezier(0, 0, 0.2, 1)',
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Z-INDEX ──────────────────────────────────────────────────────────────
      zIndex: {
        base:      '0',
        raised:    '10',
        dropdown:  '100',
        sticky:    '200',
        overlay:   '300',
        modal:     '400',
        toast:     '500',
        tooltip:   '600',
      },

      // ─── BREAKPOINTS ──────────────────────────────────────────────────────────
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/blocks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.css',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Brand Tokens via CSS Variables ────────────────────────────
      colors: {
        brand: {
          primary: 'var(--color-brand-primary, #FFD600)',
          hover: 'var(--color-brand-primary-hover, #FFE855)',
          active: 'var(--color-brand-primary-active, #F5CF00)',
          subtle: 'var(--color-brand-primary-subtle, rgba(255, 214, 0, 0.12))',
        },
        surface: {
          base: 'var(--color-surface-base, #060A17)',
          elevated: 'var(--color-surface-elevated, #0A1124)',
          overlay: 'var(--color-surface-overlay, #0F1932)',
          float: 'var(--color-surface-float, rgba(6, 10, 23, 0.85))',
        },
        content: {
          primary: 'var(--color-text-primary, #F8FAFC)',
          secondary: 'var(--color-text-secondary, #94A3B8)',
          muted: 'var(--color-text-muted, #64748B)',
          inverse: 'var(--color-text-inverse, #070E1E)',
          accent: 'var(--color-text-accent, #FFD600)',
        },
        border: {
          DEFAULT: 'var(--color-border, rgba(255, 255, 255, 0.08))',
          subtle: 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
          strong: 'var(--color-border-strong, rgba(255, 214, 0, 0.25))',
        },
        studio: {
          bg: 'var(--studio-bg, #030611)',
          sidebar: 'var(--studio-sidebar-bg, #060A17)',
          accent: 'var(--studio-accent, #FFD600)',
          border: 'var(--studio-border, rgba(255, 214, 0, 0.10))',
        },
        // Electric Yellow / Cyber scale
        yellow: {
          DEFAULT: '#FFD600',
          soft: '#FFE855',
          500: '#FFD600',
          600: '#E0BC00',
        },
        // Deep Navy scale
        navy: {
          DEFAULT: '#060A17',
          950: '#030611',
          900: '#060A17',
          850: '#0A1124',
          800: '#0F1932',
          700: '#162444',
          600: '#1E315B',
          500: '#2A437A',
        },
        // accent maps to yellow for Studio
        accent: {
          DEFAULT: '#FFD600',
          300: '#FFE855',
          400: '#FFD600',
          500: '#FFD600',
          950: '#030611',
        },
      },
      fontFamily: {
        // Official brand heading font (AGENTS.md): Montserrat.
        heading: ['var(--font-montserrat)', 'var(--font-display)', 'Montserrat', 'sans-serif'],
        syne: ['var(--font-syne)', 'Syne', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'var(--font-body)', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['var(--font-plus-jakarta)', 'var(--font-body)', 'Plus Jakarta Sans', 'sans-serif'],
        display: ['var(--font-montserrat)', 'var(--font-display)', 'Montserrat', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'var(--font-mono)', 'DM Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm, 0.375rem)',
        md: 'var(--radius-md, 0.5rem)',
        lg: 'var(--radius-lg, 0.75rem)',
        xl: 'var(--radius-xl, 1rem)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.6))',
        md: 'var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.7))',
        lg: 'var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.8))',
        yellow: 'var(--shadow-yellow, 0 0 24px rgba(255, 214, 0, 0.25))',
        'yellow-glow': '0 10px 25px -3px rgba(255, 214, 0, 0.3)',
      },
      animation: {
        'marquee-left': 'marquee-left 30s linear infinite',
        'marquee-right': 'marquee-right 30s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config

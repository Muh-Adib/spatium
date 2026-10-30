import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/sections/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      // ─── SEMANTIC COLOR SYSTEM (SegiaTech New Brand Direction) ────────
      colors: {
        // Structural Darks
        brand: {
          black: '#2B2B2B',
          charcoal: '#242424',
          surface: '#191919',
          border: '#383838',
          white: '#FFFFFF',
          neutral: '#DBD7D5',
          muted: '#999898',
        },
        // Warm Neutral Palette (Selective editorial character)
        warm: {
          brown: '#917664',
          taupe: '#B29279',
          beige: '#D3AD8D',
          peach: '#F2C7A0',
        },
        // Action Palette (Mapped to #F2C7A0 Soft Peach direction)
        action: {
          DEFAULT: '#F2C7A0', // Soft Peach
          hover: '#D3AD8D',   // Warm Beige
          active: '#B29279',  // Warm Taupe
          deep: '#917664',    // Warm Brown
          orange: '#F2C7A0',
          core: '#D3AD8D',
          burnt: '#B29279',
        },
        // Thematic Accent Palette mapped to #F2C7A0 spectrum
        accent: {
          DEFAULT: '#F2C7A0',
          50:  '#FDF8F4',
          100: '#FBEFE5',
          200: '#F2C7A0', // Soft Peach
          300: '#F2C7A0',
          400: '#E5B68E',
          500: '#F2C7A0', // Soft Peach primary
          600: '#D3AD8D', // Warm Beige
          700: '#B29279', // Warm Taupe
          800: '#917664', // Warm Brown
          900: '#2B2B2B', // Dark Base
          950: '#191919', // Dark Surface
        },
        // Structural Dark Palette (#2B2B2B primary background)
        midnight: {
          DEFAULT: '#2B2B2B',
          950: '#2B2B2B', // Dark Base
          900: '#242424',
          850: '#1F1F1F',
          800: '#191919', // Dark Surface
          700: '#383838', // Border
          600: '#4A4A4A',
          500: '#525252',
          400: '#999898', // Muted Gray
          300: '#B29279', // Warm Taupe
          200: '#DBD7D5', // Light Neutral
          100: '#F5F5F5',
          50:  '#FFFFFF', // Pure White
        },
        // Refactored Neutral palette conforming to specified role
        neutral: {
          0:   '#FFFFFF',
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#DBD7D5', // Light Neutral
          300: '#DBD7D5',
          400: '#999898', // Muted Gray
          500: '#999898',
          600: '#917664', // Warm Brown
          700: '#383838', // Border
          800: '#191919', // Dark Surface
          900: '#242424',
          950: '#2B2B2B', // Base Background
        },
        // Semantic variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },

      // ─── TYPOGRAPHY ─────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Commissioner', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-xl': ['1.25rem', { lineHeight: '1.8', letterSpacing: '-0.005em' }],
        'body-lg': ['1.125rem',{ lineHeight: '1.75' }],
        'body-md': ['1rem',    { lineHeight: '1.7' }],
        'body-sm': ['0.875rem',{ lineHeight: '1.6' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      },

      boxShadow: {
        'soft-sm': '0 1px 3px rgba(2, 13, 50, 0.06), 0 1px 2px rgba(2, 13, 50, 0.04)',
        'soft-md': '0 4px 16px rgba(2, 13, 50, 0.08), 0 2px 6px rgba(2, 13, 50, 0.04)',
        'soft-lg': '0 10px 40px rgba(2, 13, 50, 0.12), 0 4px 12px rgba(2, 13, 50, 0.06)',
        'soft-xl': '0 20px 60px rgba(2, 13, 50, 0.18), 0 8px 24px rgba(2, 13, 50, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config

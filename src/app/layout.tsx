import type { Metadata, Viewport } from 'next'
import { Syne, Plus_Jakarta_Sans, DM_Mono, Montserrat, Inter } from 'next/font/google'
import { SiteShell } from '@/components/layout/SiteShell'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import '@/components/layout/layout.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

// Official brand fonts (AGENTS.md): Montserrat for headings, Inter for body.
// Used by the immersive hero + landing motion layer only; existing pages keep
// their current fonts until a dedicated pass migrates them.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#060E1F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://unimasi.studio'),
  title: {
    default: 'UNIMASI — Animation & Motion Design Studio',
    template: '%s · UNIMASI',
  },
  description:
    'UNIMASI is an animation and motion design studio crafting 2D animation, 3D animation and visual production, and motion graphics that make complex ideas move.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'UNIMASI',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'We make ideas move. 2D animation, 3D animation and visual production, and motion graphics for education, industry, and brands.',
    url: 'https://unimasi.studio/',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'UNIMASI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'We make ideas move. 2D animation, 3D animation and visual production, and motion graphics for education, industry, and brands.',
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${plusJakartaSans.variable} ${dmMono.variable} ${montserrat.variable} ${inter.variable}`}
    >
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}

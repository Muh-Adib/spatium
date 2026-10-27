import type { Metadata, Viewport } from 'next'
import { Syne, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollProgress, ClientLayoutEffects } from '@/components/layout/ScrollProgress'
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
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'UNIMASI',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'We make ideas move. 2D animation, 3D animation and visual production, and motion graphics for education, industry, and brands.',
    url: 'https://unimasi.studio/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNIMASI — Animation & Motion Design Studio',
    description:
      'We make ideas move. 2D animation, 3D animation and visual production, and motion graphics for education, industry, and brands.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${plusJakartaSans.variable} ${dmMono.variable}`}>
      <body>
        <div className="app-shell">
          <ClientLayoutEffects />
          <Header />
          <ScrollProgress />
          <main id="main" className="app-main">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}

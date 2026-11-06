import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Mono, Montserrat, Inter } from 'next/font/google'
import { SiteShell } from '@/components/layout/SiteShell'
import { siteConfig } from '@/config/site'
import { getSocialLinks, getUseCaseMenu } from '@/lib/content/spatium'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import '@/components/layout/layout.css'

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

// Content lives in PostgreSQL, which is not reachable while the Docker image builds.
// Prerendering would freeze empty pages (and an empty nav) into every deploy, so all
// routes render per request; Studio's revalidatePath calls stay harmless.
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#03060D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'SPATIUM — Spatial Technology Studio',
    template: '%s · SPATIUM',
  },
  description:
    'SPATIUM — Spatial Technology Studio. Digital twin for creative industry: real places captured and reconstructed as photorealistic, explorable 3D Gaussian Splats.',
  icons: {
    icon: [
      { url: '/brand/mark-spatium.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'SPATIUM',
    title: 'SPATIUM — Real places. New perspectives.',
    description:
      'Digital twin for creative industry. Walk, explore, and breathe inside the space as you are truly there.',
    url: siteConfig.url,
    images: [{ url: siteConfig.defaultOgImage, alt: 'SPATIUM — Spatial Technology Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPATIUM — Real places. New perspectives.',
    description: 'Digital twin for creative industry. One Point, Unlimited Possibilities.',
    images: [siteConfig.defaultOgImage],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Header/footer content is Studio-managed: use cases (service_categories with
  // show_in_nav) and social profiles (site_configs.social_links). Both resolve
  // to [] on failure, which hides the corresponding menu or list.
  const [useCases, socials] = await Promise.all([getUseCaseMenu(), getSocialLinks()])
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${dmMono.variable} ${montserrat.variable} ${inter.variable}`}
    >
      <body>
        <SiteShell useCases={useCases} socials={socials}>
          {children}
        </SiteShell>
      </body>
    </html>
  )
}

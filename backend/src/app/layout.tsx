import { LocalServiceWorkerReset } from '@/components/dev/LocalServiceWorkerReset'
import { getSchemaGenerators } from '@/lib/seo/server'
import { getSeoSite } from '@/lib/seo/server'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans, Outfit, Commissioner } from 'next/font/google'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/seo/JsonLd'
import { getActiveThemeTokens, generateCssVariables } from '@/lib/theme/tokens'
import './globals.css'

// --- Fonts (Plus Jakarta Sans for Body/UI, Outfit for Headings, Commissioner for Badges/Tags) ---

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const commissioner = Commissioner({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

// --- Root Metadata --------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSeoSite()
  return {
  metadataBase: new URL(site.url),
  title: {
    default: [site.name, site.tagline].filter(Boolean).join(' — '),
    template: `%s | ${site.name}`,
  },
  description: site.description,
  robots: {
    index: process.env.NEXT_PUBLIC_EMPTY_CONTENT_PREVIEW !== 'true',
    follow: process.env.NEXT_PUBLIC_EMPTY_CONTENT_PREVIEW !== 'true',
    googleBot: {
      index: process.env.NEXT_PUBLIC_EMPTY_CONTENT_PREVIEW !== 'true',
      follow: process.env.NEXT_PUBLIC_EMPTY_CONTENT_PREVIEW !== 'true',
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [{ url: site.defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.description,
  },
  verification: {
    // Populated from CMS SiteSettings if available
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
}
}

// --- Root Layout ----------------------------------------------------------

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { generateOrganizationSchema, generateWebSiteSchema } = await getSchemaGenerators()

  const themeTokensPayload = await getActiveThemeTokens().catch(() => null)
  const themeCssVariables = themeTokensPayload ? generateCssVariables(themeTokensPayload) : ''

  return (
    <html
      lang="id"
      className={`dark ${plusJakartaSans.variable} ${outfit.variable} ${commissioner.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {themeCssVariables && (
          <style
            id="segiatech-theme-variables"
            dangerouslySetInnerHTML={{ __html: themeCssVariables }}
          />
        )}
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased selection:bg-emerald-500/30 selection:text-white">
        {process.env.NODE_ENV === 'development' && <LocalServiceWorkerReset />}
        {/* Structured Data — Organization + WebSite */}
        <JsonLd schema={generateOrganizationSchema()} />
        <JsonLd schema={generateWebSiteSchema()} />

        {/* Google Tag Manager — noscript fallback */}
        {siteConfig.analytics.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.analytics.gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="GTM"
            />
          </noscript>
        )}

        <main className="min-h-screen">
          {children}
        </main>

        {/* Google Analytics */}
        {siteConfig.analytics.gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.analytics.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteConfig.analytics.gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}

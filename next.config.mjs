/**
 * Legacy route trees inherited from the pre-SPATIUM fork (Indonesian slugs and
 * the retired "solutions" catalogue). They permanently redirect (308) to the
 * canonical SPATIUM routes; query strings are passed through by Next.js.
 */
const LEGACY_REDIRECTS = [
  { source: '/layanan', destination: '/services' },
  { source: '/layanan/:slug', destination: '/services/:slug' },
  { source: '/solusi', destination: '/services' },
  { source: '/solusi/:slug', destination: '/services' },
  { source: '/solutions', destination: '/services' },
  { source: '/solutions/:slug', destination: '/services' },
  { source: '/portofolio', destination: '/portfolio' },
  { source: '/portofolio/:slug', destination: '/portfolio/:slug' },
  { source: '/artikel', destination: '/journal' },
  { source: '/artikel/:slug', destination: '/journal/:slug' },
  { source: '/kontak', destination: '/contact' },
  { source: '/tentang', destination: '/about' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Standalone output keeps the Docker runtime image small.
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return LEGACY_REDIRECTS.map((rule) => ({ ...rule, permanent: true }))
  },
}

export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.segiatech.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.mixkit.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      { source: '/solusi/pendidikan', destination: '/solusi', permanent: true },
      { source: '/solusi/properti', destination: '/solusi', permanent: true },
      { source: '/solusi/digitalisasi-bisnis', destination: '/solusi', permanent: true },
      { source: '/solusi/umkm', destination: '/solusi', permanent: true },
      { source: '/solusi/hospitality', destination: '/solusi/booth-pameran', permanent: true },
      { source: '/solusi/tingkatkan-penjualan', destination: '/solusi', permanent: true },
      { source: '/solusi/pengalaman-imersif', destination: '/solusi/booth-pameran', permanent: true },
      { source: '/solusi/otomasi-operasional', destination: '/solusi', permanent: true },
      { source: '/solusi/pengalaman-imersif-event', destination: '/solusi/booth-pameran', permanent: true },
      { source: '/solusi/gamifikasi-wahana-wisata', destination: '/solusi/wahana-wisata', permanent: true },
      { source: '/solusi/sistem-penerimaan-kampus', destination: '/solusi', permanent: true },
      { source: '/solusi/virtual-showroom-properti', destination: '/solusi', permanent: true },
      { source: '/solusi/digitalisasi-operasional-bisnis', destination: '/solusi', permanent: true },
      { source: '/solusi/profil-digital-otoritas-tinggi', destination: '/solusi', permanent: true },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/:key([a-f0-9]{32}).txt',
        destination: '/api/indexnow/key?key=:key',
      },
    ]
  },

  output: 'standalone',
}

export default nextConfig

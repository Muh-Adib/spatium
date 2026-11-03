/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Standalone output keeps the Docker runtime image small.
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig

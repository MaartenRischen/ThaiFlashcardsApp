/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Remove GitHub Pages specific settings
  basePath: '',
  trailingSlash: true,
  webpack: (config) => {
    return config;
  },
  // Enable standalone output
  output: 'standalone',
  experimental: {
    // Enable SWC minification
    swcMinify: true,
  },
}

module.exports = nextConfig 
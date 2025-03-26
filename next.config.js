/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Remove GitHub Pages specific settings
  basePath: '',
  trailingSlash: true,
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 
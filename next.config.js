/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  output: 'export',
  webpack: (config) => {
    return config;
  }
}

module.exports = nextConfig 
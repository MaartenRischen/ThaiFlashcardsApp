/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  // Make sure the basePath matches your GitHub repository name
  basePath: process.env.GITHUB_ACTIONS ? '/ThaiFlashcardsApp' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/ThaiFlashcardsApp/' : '',
  webpack: (config) => {
    return config;
  },
  // Ensure trailingSlash is enabled for static export
  trailingSlash: true,
}

module.exports = nextConfig 
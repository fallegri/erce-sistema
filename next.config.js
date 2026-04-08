/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  // Security: disable x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig

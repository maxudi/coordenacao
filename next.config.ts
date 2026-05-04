import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Gera output standalone para Docker (inclui server.js auto-suficiente)
  output: 'standalone',
}

export default nextConfig

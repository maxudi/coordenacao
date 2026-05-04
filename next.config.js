/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera output standalone para Docker (inclui server.js auto-suficiente)
  output: 'standalone',
}

module.exports = nextConfig

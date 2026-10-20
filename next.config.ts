import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  experimental: { useTypeScriptCli: false },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'Content-Security-Policy', value: `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; connect-src 'self' https://*.supabase.co${process.env.NODE_ENV === 'development' ? ' ws:' : ''}` },
      ],
    }]
  },
}

export default nextConfig

import crypto from 'node:crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for react-grid-layout and react-resizable (CommonJS packages)
  transpilePackages: ['react-grid-layout', 'react-resizable'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Removed 'unsafe-inline' — it nullifies XSS protection.
              // 'strict-dynamic' allows Next.js internal scripts while blocking injected scripts.
              "script-src 'self' 'strict-dynamic' https://js.pusher.com",
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://sockjs-mt1.pusher.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Restrict CORS to same origin for API routes
  async rewrites() {
    return [];
  },

  // Log only in production
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;

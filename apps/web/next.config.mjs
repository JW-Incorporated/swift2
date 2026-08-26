import { securityHeaders } from './lib/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next must transpile them.
  transpilePackages: ['@swift2/shared', '@swift2/core'],
  images: {
    // YouTube poster thumbnails for the click-to-play music-video facade.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  // Security response headers (CSP, HSTS, frame-ancestors, ...). Policy and
  // the rationale for every directive live in lib/security-headers.mjs.
  //
  // enforceResourcePolicy: true — flipped 2026-08-26 (#1975). Production
  // /api/csp-report logs showed zero violations across a day of real traffic
  // (/, /vault/*, /privacy, /terms, /opengraph-image, /_next/image, /api/*)
  // after 14 days of Report-Only running since #1935, and app/ + components/
  // carry no HTML sink beyond the static JSON-LD block (guarded by
  // no-html-sink.test.ts, #3174). See security-headers.mjs's header comment
  // for what stays a host allowlist rather than an XSS control even enforced.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          dev: process.env.NODE_ENV !== 'production',
          enforceResourcePolicy: true,
        }),
      },
    ];
  },
};

export default nextConfig;

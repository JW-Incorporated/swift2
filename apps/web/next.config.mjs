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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({ dev: process.env.NODE_ENV !== 'production' }),
      },
    ];
  },
};

export default nextConfig;

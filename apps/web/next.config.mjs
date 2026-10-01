import { securityHeaders } from './lib/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next must transpile them.
  transpilePackages: ['@swift2/shared', '@swift2/core'],
  // /api/share-card reads its vendored fonts with fs at runtime (nft can't
  // see through the import.meta.url-relative path), so ship them explicitly.
  outputFileTracingIncludes: {
    '/api/share-card': ['./lib/longlive/share-fonts/**/*'],
  },
  images: {
    // YouTube poster thumbnails for the click-to-play music-video facade.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
  // Static security response headers. The dynamic nonce-based CSP is set by
  // proxy.ts before the App Router renders each page.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;

import { securityHeaders } from './lib/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next must transpile them.
  transpilePackages: ['@swift2/shared', '@swift2/core', '@swift2/ui'],
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
      // Self-hosted fonts are content-hashed (build-fonts.mjs): cache forever,
      // as next/font's own assets were.
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // The content bundle is public, static, cookie-less: the app's DOM host
      // (opaque `null` origin) reads it cross-origin. `*` only — never on /api
      // or HTML routes. No Vary/Allow-* (simple GETs need no preflight). The
      // loader reads no non-safelisted response header, so nothing is exposed.
      {
        source: '/content/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
};

export default nextConfig;

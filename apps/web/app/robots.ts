import type { MetadataRoute } from 'next';

// Closes the #653 gap (Nils, 2026-07-15; still open as of 07-21 recheck):
// robots.txt was a 404 in production, so crawlers had no explicit
// permission/sitemap pointer at all.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /api/* and /vault/* are JSON endpoints (feedback submission, the
      // Supabase-backed vault API), not user-facing pages — nothing worth
      // indexing there.
      disallow: ['/api/', '/vault/'],
    },
    sitemap: 'https://www.longlivets.com/sitemap.xml',
  };
}

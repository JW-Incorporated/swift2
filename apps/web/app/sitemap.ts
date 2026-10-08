import type { MetadataRoute } from 'next';
import { legalSitemapEntries } from '@/lib/longlive/legal';

// Closes the #653 gap (Nils, 2026-07-15; still open as of 07-21 recheck):
// sitemap.xml was a 404 in production.
//
// Deliberately lists only the one real URL: the whole experience (eras,
// threads, individual moments) is client-rendered behind `/` with
// `?item=`/`?lens=`/`?era=` query-param deep links (docs/longlive-
// experience.md), not real per-surface routes a crawler can discover and
// index separately. Listing those query-param variants here would be
// dishonest — Next serves the identical shell HTML for all of them before
// client hydration, so they'd read as duplicate content, not distinct
// pages. Giving individual eras/moments their own real, server-rendered,
// uniquely-titled URLs is a genuinely separate, larger project (see the
// still-open architecture gap in docs/architecture.md re: the Vault),
// not a sitemap-config fix.
//
// The legal pages (#800) ARE real, server-rendered, uniquely-titled routes, so
// they belong here — but only once counsel has approved them. While they are
// drafts they render `noindex`, and listing a `noindex` URL in the sitemap is
// exactly the contradictory signal the comment above is careful to avoid. The
// entries appear automatically when `LEGAL_STATUS` flips to `'approved'`.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.longlivets.com/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...legalSitemapEntries().map((entry) => ({
      url: entry.url,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];
}

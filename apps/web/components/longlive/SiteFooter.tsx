'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/longlive/format';
import { contentGeneratedAt } from '@/lib/longlive/freshness';
import { LEGAL_LINKS } from '@/lib/longlive/legal';
import { SOCIAL_LINKS, type SocialLink } from '@/lib/longlive/social';

// Official brand glyphs, drawn as plain 24×24 paths so they inherit the era
// palette via currentColor instead of shipping brand-colored assets.
const SOCIAL_ICONS: Record<SocialLink['id'], string> = {
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  tiktok:
    'M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
};

export function SiteFooter() {
  // Content-freshness label ("Vault refreshed 3 days ago"). Computed after
  // mount — relative time depends on the visitor's clock, so rendering it
  // during SSR would risk a hydration mismatch (same pattern as the scrubber
  // hint flag). Null (no stamp in the committed fallback module, or an
  // unparseable one) simply renders nothing.
  const [freshness, setFreshness] = useState<string | null>(null);
  useEffect(() => {
    setFreshness(formatRelativeTime(contentGeneratedAt(), Date.now()));
  }, []);

  return (
    <footer className="border-t border-[color:var(--era-line)] px-5 py-10 pb-28 text-center">
      <p className="font-era text-lg font-semibold">Long Live</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
        An independent, fan-made journey through the eras. Not affiliated with,
        endorsed by, or connected to Taylor Swift or her representatives. All
        narratives are widely-discussed fan interpretations, not confirmed fact.
      </p>
      {freshness && (
        <p className="mt-4 text-[11px] tracking-wide text-[color:var(--era-ink-soft)] opacity-80">
          Vault refreshed {freshness}
        </p>
      )}
      {/* #800: the legal pages must be reachable from every page, or they may
          as well not exist. Next <Link> (not a bare <a>) so the client router
          handles it like any other in-app navigation. */}
      <nav
        aria-label="Legal"
        className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
      >
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[color:var(--era-ink-soft)] underline underline-offset-4 transition-opacity hover:text-[color:var(--era-ink)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Long Live on social media" className="mt-5 flex items-center justify-center gap-1">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Long Live on ${link.label}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--era-ink-soft)] opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px]">
              <path d={SOCIAL_ICONS[link.id]} />
            </svg>
          </a>
        ))}
      </nav>
    </footer>
  );
}

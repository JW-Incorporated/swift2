'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/longlive/format';
import { contentGeneratedAt } from '@/lib/longlive/freshness';

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
    </footer>
  );
}

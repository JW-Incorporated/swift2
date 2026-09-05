'use client';

import { Star } from 'lucide-react';
import type { ContentItem } from '@swift2/experience';

const LABEL: Record<'defining' | 'notable', string> = {
  defining: 'Career-defining',
  notable: 'Career highlight',
};

/**
 * Explicit visual marker for `item.significance` (docs/decisions.md,
 * 2026-07-20). The feed-tier system (`assignFeedTiers`) guarantees layout
 * weight but gives no textual/iconic signal a scrolling user can actually
 * read — especially for 'notable' items, which land on the same plain
 * 'media' tier as any ordinary photo-bearing item and were otherwise
 * indistinguishable from it. 'defining' renders filled (it already gets the
 * hero tier too — this reinforces it, doesn't replace it); 'notable' renders
 * one visual step down, an outlined pill, same grammar as the existing
 * "Unconfirmed" chip in `MomentMeta`.
 */
export function SignificanceBadge({
  significance,
  size = 'card',
}: {
  significance: NonNullable<ContentItem['significance']>;
  /** 'card' matches the compact feed-chip scale; 'detail' is a touch larger
   * for the moment-detail header, where it's the only chip on the line. */
  size?: 'card' | 'detail';
}) {
  const defining = significance === 'defining';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-widest',
        size === 'detail' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]',
        defining
          ? 'text-[color:var(--era-accent-fg)]'
          : 'border text-[color:var(--era-accent-text)]',
      ].join(' ')}
      style={
        defining ? { backgroundColor: 'var(--era-accent)' } : { borderColor: 'var(--era-accent)' }
      }
    >
      <Star
        className={size === 'detail' ? 'h-3.5 w-3.5' : 'h-3 w-3'}
        aria-hidden
        fill={defining ? 'currentColor' : 'none'}
      />
      {LABEL[significance]}
    </span>
  );
}

'use client';

import { useMemo } from 'react';
import { EGG_NODES, getEra } from '@swift2/experience';
import { useReader } from '../../snapshot/context';
import { hasShareableProgress, summarizeProgress } from '../lib/share-card-params';
import { useProgress } from '../store';
import { ShareImageMenu } from '../era/ShareImageMenu';

/**
 * The "Your Long Live" entry point (W9): once a visitor has opened, saved or
 * decoded anything, offer a personal "My Eras" card built from their own
 * localStorage progress. Only the top eras and bucketed counts ever reach the
 * card URL — never ids of what they read. The share link deep-links to their
 * top era (`?era=`). Renders nothing until progress hydrates and is non-empty.
 */
export function YourLongLiveCard() {
  const { progress, hydrated } = useProgress();
  const q = useReader();
  const summary = useMemo(
    () =>
      summarizeProgress(progress, {
        itemEra: (id) => q.getContentItem(id)?.eraId,
        eggEra: (id) => EGG_NODES.find((n) => n.id === id)?.eraId,
      }),
    [q, progress],
  );
  const topId = summary.eras[0];
  if (!hydrated || !hasShareableProgress(progress) || !topId) return null;
  const top = getEra(topId);

  return (
    <section
      aria-labelledby="your-long-live-title"
      className="era-card mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
    >
      <div className="min-w-0">
        <h3
          id="your-long-live-title"
          className="font-[family-name:var(--era-font)] text-lg font-semibold text-[color:var(--era-ink)]"
        >
          Your Long Live
        </h3>
        <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">
          Turn your journey through {top.shortName} and beyond into a card to share.
        </p>
      </div>
      <ShareImageMenu
        target={{ kind: 'era', eraId: top.id }}
        source={{
          eras: summary.eras,
          moments: summary.moments,
          eggs: summary.eggs,
          favorites: summary.favorites,
        }}
        label="Make my card"
        align="left"
      />
    </section>
  );
}

'use client';

// Split out of MomentDetail.tsx (R20). The "where next" panels at the foot of
// a moment: its hidden clue, its Clue Web trail, the threads it belongs to,
// and the authored moment-to-moment "Keep reading" rail.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, Route } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import {
  resolveMotifTrail,
  resolveRelatedMoments,
  type MotifTarget,
  type RelatedMoment,
} from '@/lib/longlive/related';
import {
  autoFocalPoint,
  focalPointOf,
  getEra,
  getThread,
  primaryImageRef,
  type ContentItem,
  type LensId,
} from '@swift2/experience';
import { isRemoteUrl } from './MomentLightbox';

export function MomentLinks({ item }: { item: ContentItem }) {
  const { openItem } = useAppActions();
  const [revealed, setRevealed] = useState(false);

  // Reset the clue reveal whenever a new item opens.
  useEffect(() => {
    setRevealed(false);
  }, [item]);

  // Clue Web trail this moment cross-links to (via relatedIds), if any.
  // Resolution is best-effort: no resolvable target simply means no link.
  const trail = resolveMotifTrail(item.relatedIds);
  // Moment -> moment cross-links, resolved separately: resolveMotifTrail
  // handles only motif:/egg: and returns null for `moment:` ids.
  const related = resolveRelatedMoments(item.relatedIds, item.id);

  return (
    <>
      {item.hiddenClue && (
        <div className="era-card mt-8 rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
            <Sparkles className="h-4 w-4" />
            Hidden clue
          </div>
          <p className="mt-2 text-[15px] italic leading-relaxed text-[color:var(--era-ink)]">
            “{item.hiddenClue.clue}”
          </p>
          {revealed ? (
            <div className="clue-reveal">
              <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
                {item.hiddenClue.payoff}
              </p>
              {/* Decoded — now hand the visitor the thread it belongs to. */}
              <ClueWebCta trail={trail} />
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="era-btn-ghost mt-4 rounded-full px-4 py-2 text-sm font-medium"
            >
              Decode it
            </button>
          )}
        </div>
      )}

      {/* A moment can cross-link into a Clue Web trail without carrying its
            own hidden clue — give it the same invitation as its own card. */}
      {!item.hiddenClue && trail && (
        <div className="era-card mt-8 rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
            <Route className="h-4 w-4" />
            Part of a bigger pattern
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
            This moment belongs to the “{trail.motif.label}” trail — {trail.motif.blurb}
          </p>
          <ClueWebCta trail={trail} />
        </div>
      )}

      {/* Era -> Thread, generalized beyond the Clue Web (issue #436): any
            moment tagged into a thread (via ContentItem.threadIds — today,
            Relationship/Fashion tags imply Love Story/Runway automatically)
            gets a "follow this thread" link. 'easter-eggs' is excluded here
            because a Clue Web cross-link already gets the richer, specific
            trail invitation above rather than a bare thread-home link. */}
      <FollowThreadsRow threadIds={item.threadIds} />

      {/* Moment -> moment cross-links. These were authored long before
            anything rendered them: MomentDetail only ever called
            resolveMotifTrail, which by design resolves `motif:`/`egg:` and
            returns null for everything else, so all 82 `moment:` ids in the
            seeds were inert. */}
      <RelatedMomentsRail related={related} onOpen={openItem} />
    </>
  );
}

/**
 * The moment → any thread it belongs to, generalized from the Clue-Web-only
 * motif trail above to `ContentItem.threadIds` generally (issue #436). Reuses
 * the same `openThread` pivot every era -> thread jump already uses.
 */
/**
 * "Keep reading" — the moment-to-moment cross-links a writer authored on this
 * item via `relatedIds`.
 *
 * These existed in the seeds long before anything rendered them: MomentDetail
 * resolved `relatedIds` only through resolveMotifTrail, which handles the
 * `motif:`/`egg:` namespaces and returns null for `moment:` ids. All 82
 * authored moment links were therefore invisible.
 *
 * Renders nothing when nothing resolves, so an item whose links all dangle
 * degrades to the previous behaviour rather than showing an empty shell.
 */
function RelatedMomentsRail({
  related,
  onOpen,
}: {
  related: RelatedMoment[];
  onOpen: (id: string) => void;
}) {
  if (related.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <ArrowRight className="h-4 w-4" />
        Keep reading
      </div>
      <ul className="mt-4 space-y-2">
        {related.map(({ item: target, eraId }) => {
          const targetEra = getEra(eraId);
          const thumb = primaryImageRef(target);
          return (
            <li key={target.id}>
              <button
                onClick={() => {
                  onOpen(target.id);
                  // Match the era → thread pivot: re-anchor a frame later, so
                  // the jump lands after this overlay's scroll lock lifts.
                  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-[color:var(--era-surface)]"
                style={{ borderColor: 'var(--era-line)' }}
              >
                {thumb && (
                  <Image
                    src={thumb.url}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized={isRemoteUrl(thumb.url)}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    style={{ objectPosition: focalPointOf(thumb) }}
                    onLoad={autoFocalPoint(thumb)}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-[color:var(--era-ink)]">
                    {target.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[color:var(--era-ink-soft)]">
                    {targetEra?.shortName ?? eraId}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)]" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FollowThreadsRow({ threadIds }: { threadIds: LensId[] | undefined }) {
  const { openThread } = useAppActions();
  const ids = (threadIds ?? []).filter((id) => id !== 'easter-eggs');
  if (ids.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <Route className="h-4 w-4" />
        Part of a bigger story
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
        This moment is part of {ids.length > 1 ? 'these threads' : 'a thread'} that cuts across
        eras.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ids.map((id) => {
          const meta = getThread(id);
          return (
            <button
              key={id}
              onClick={() => {
                openThread(id);
                // Same instant re-anchor every era → thread pivot uses (EraSection) —
                // deferred a frame so it lands after this overlay's scroll lock lifts.
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
              }}
              className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
              aria-label={`Follow the ${meta.title} thread`}
            >
              Follow {meta.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The moment → Clue Web jump. With a resolved trail (from relatedIds) it opens
 * the Clue Web directly on that motif's trail; without one it falls back to a
 * plain "Explore the Clue Web" invitation (Clue Web home) — never a dead link.
 */
function ClueWebCta({ trail }: { trail: MotifTarget | null }) {
  const { openClueWebTrail, openThread } = useAppActions();
  return (
    <button
      onClick={() => {
        if (trail) openClueWebTrail(trail.motifId);
        else openThread('easter-eggs');
        // Same instant re-anchor every era → thread pivot uses (EraSection) —
        // deferred a frame so it lands after this overlay's scroll lock lifts.
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      }}
      className="era-btn-ghost mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
      aria-label={
        trail ? `Follow the ${trail.motif.label} trail in the Clue Web` : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

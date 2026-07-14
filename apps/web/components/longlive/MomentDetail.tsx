'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, Share2, ArrowRight, Route, Heart } from 'lucide-react';
import {
  useAppState,
  useAppActions,
  useProgress,
  useProgressActions,
} from '@/lib/longlive/store';
import { getContentItem } from '@/lib/longlive/content';
import { getEra } from '@/lib/longlive/eras';
import { getThread } from '@/lib/longlive/lenses';
import { resolveMotifTrail, type MotifTarget } from '@/lib/longlive/related';
import { TAG_META } from '@/lib/longlive/tags';
import { eraStyle } from '@/lib/longlive/theme';
import { MomentVideo } from './MomentVideo';
import { extractYouTubeId } from '@swift2/shared';
import { ZoomableImage } from './ZoomableImage';
import { primaryImageRef, type Confidence, type ImageKind, type ImageRef, type LensId } from '@/lib/longlive/types';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

// At/above this tier a moment is established fact — no pill. Below it, a
// confidence pill renders so a claim never reads as unqualified fact.
const CONFIRMED_TIER: ReadonlySet<Confidence> = new Set(['official', 'confirmed_interview']);
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  official: 'Official',
  confirmed_interview: 'Confirmed',
  reputable_reporting: 'Reported',
  strong_fan_consensus: 'Fan consensus',
  plausible: 'Plausible',
  clowning: 'Clowning',
  disproven: 'Disproven',
  joke_meme: 'Joke / meme',
};

// Anything that isn't the real photo of THIS moment gets an explicit label —
// a stand-in must never read as the real thing. 'primary' renders no badge.
const IMAGE_KIND_BADGE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference',
  archival: 'Archival',
};
const IMAGE_KIND_NOTE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference — the real photo hasn’t surfaced yet.',
  archival: 'Archival.',
};

// Hotlinked gallery/hero urls bypass Next's image optimizer (whose
// remotePatterns allowlist covers only YouTube posters); local era art and
// curated assets keep the optimized path.
const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);

/** The little era-styled pill that marks a non-primary image. */
function ImageKindBadge({ kind }: { kind: Exclude<ImageKind, 'primary'> }) {
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[color:var(--era-ink-soft)]"
      style={{ borderColor: 'var(--era-line)', backgroundColor: 'var(--era-surface)' }}
    >
      {IMAGE_KIND_BADGE[kind]}
    </span>
  );
}

export function MomentDetail() {
  const { openItemId, share } = useAppState();
  const { closeItem, openShare } = useAppActions();
  const { progress } = useProgress();
  const { markMomentVisited, toggleFavorite } = useProgressActions();
  const [revealed, setRevealed] = useState(false);

  const item = openItemId ? getContentItem(openItemId) : undefined;

  // Opening a moment records it as visited (drives the era grid's seen dots
  // and the returning-user counts). Keyed on the resolved item so bad deep
  // links never record ghosts; marking is idempotent, so StrictMode's double
  // effect run is harmless.
  useEffect(() => {
    if (item) markMomentVisited(item.id);
  }, [item, markMomentVisited]);

  // Reset the clue reveal whenever a new item opens; lock body scroll.
  // Only if the id actually resolves — a stale/bad ?item= deep link
  // shouldn't lock scrolling on a modal that never renders.
  useEffect(() => {
    setRevealed(false);
    if (item) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [item]);

  // Close on Escape — but not while the share sheet is open on top of us;
  // that overlay owns Escape until it closes itself.
  useEffect(() => {
    if (!openItemId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) closeItem();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItemId, closeItem, share]);

  // Let the mobile back-swipe gesture close this pill instead of leaving the app.
  useBackDismiss(Boolean(item), closeItem);

  if (!item) return null;
  const era = getEra(item.eraId);
  const isFavorite = progress.favorites.has(item.id);
  // Clue Web trail this moment cross-links to (via relatedIds), if any.
  // Resolution is best-effort: no resolvable target simply means no link.
  const trail = resolveMotifTrail(item.relatedIds);
  // Hero = the primary image (else the first one); the rest form the gallery.
  // When even the hero is a stand-in (no primary exists) it gets the same
  // honest labeling the gallery uses.
  const hero: ImageRef | undefined = primaryImageRef(item);
  const heroUrl = hero?.url ?? '/placeholder.svg';
  const gallery = item.images.filter((img) => img !== hero);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
    >
      {/* Hero image */}
      <div className="relative h-[42vh] min-h-64 w-full">
        <Image
          src={heroUrl}
          alt={hero?.caption ?? ''}
          fill
          priority
          unoptimized={isRemoteUrl(heroUrl)}
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 20%, transparent), var(--era-bg))',
          }}
        />
        {/* A hero that isn't the real photo says so, right on the image.
            bottom-14 keeps it clear of the article, which overlaps the hero's
            bottom 2.5rem via -mt-10. */}
        {hero && hero.kind !== 'primary' && (
          <div className="absolute bottom-14 left-4 z-10 flex flex-wrap items-center gap-2">
            <ImageKindBadge kind={hero.kind} />
            <span className="text-xs text-[color:var(--era-ink-soft)]">
              {IMAGE_KIND_NOTE[hero.kind]}
              {hero.credit ? ` Credit: ${hero.credit}.` : ''}
            </span>
          </div>
        )}
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={() => toggleFavorite(item.id)}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart
              className="h-5 w-5"
              fill={isFavorite ? 'var(--era-accent)' : 'none'}
              style={isFavorite ? { color: 'var(--era-accent)' } : undefined}
            />
          </button>
          <button
            onClick={() => openShare({ kind: 'item', itemId: item.id })}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Share this moment"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={closeItem}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <article className="relative z-10 mx-auto -mt-10 max-w-2xl px-5 pb-24">
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          {era.name} · {item.dateLabel}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {item.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${TAG_META[t].hue} / 0.16)`,
                color: `hsl(${TAG_META[t].hue})`,
              }}
            >
              {TAG_META[t].label}
            </span>
          ))}
          {item.confidence && !CONFIRMED_TIER.has(item.confidence) && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[color:var(--era-ink-soft)]"
              style={{ borderColor: 'var(--era-line)' }}
            >
              {CONFIDENCE_LABEL[item.confidence]}
            </span>
          )}
        </div>

        <div className="mt-7 space-y-4 text-lg leading-relaxed text-[color:var(--era-ink)]">
          {item.body.map((para, i) => (
            <p key={i} className="text-pretty">
              {para}
            </p>
          ))}
        </div>

        {gallery.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
              Gallery
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {gallery.map((img, i) => (
                <figure
                  key={`${img.url}-${i}`}
                  className="era-card overflow-hidden rounded-2xl border"
                >
                  {/* Pinch/double-tap zoomable — the body-scroll lock above
                      breaks native browser zoom-and-pan, so the viewer drives
                      the gestures itself, scoped to this frame. */}
                  <ZoomableImage
                    src={img.url}
                    alt={img.caption ?? ''}
                    unoptimized={isRemoteUrl(img.url)}
                  />
                  <figcaption className="space-y-1.5 p-3">
                    {img.kind !== 'primary' && (
                      <div>
                        <ImageKindBadge kind={img.kind} />
                      </div>
                    )}
                    {img.kind === 'reference' && (
                      <p className="text-xs italic leading-relaxed text-[color:var(--era-ink-soft)]">
                        {IMAGE_KIND_NOTE.reference}
                      </p>
                    )}
                    {img.caption && (
                      <p className="text-sm leading-relaxed text-[color:var(--era-ink)]">
                        {img.caption}
                      </p>
                    )}
                    {img.credit && (
                      <p className="text-xs text-[color:var(--era-ink-soft)]">
                        Credit: {img.credit}
                      </p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {item.video && <MomentVideo video={item.video} />}

        {item.sources && item.sources.length > 0 && (
          <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
            {/* A source that is a YouTube link embeds as a click-to-play facade
                (poster thumbnail only until the reader opts in — no iframe loads
                on mount, so this stays cheap in the feed), reusing MomentVideo.
                The citation line below still lists every source for the record. */}
            {item.sources.map((s, i) => {
              const youtubeId = extractYouTubeId(s.url);
              return youtubeId ? (
                <MomentVideo
                  key={`src-vid-${s.url}-${i}`}
                  video={{ youtubeId, title: s.name }}
                  caption={s.name}
                  className="mb-4"
                />
              ) : null;
            })}
            {/* Footnote-scale, academic-text style — citations belong here on
                the expanded page, small, not competing with the article. */}
            <p className="text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
              {item.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
              {item.sources.map((s, i) => (
                <span key={`${s.url}-${i}`}>
                  {i > 0 && ', '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                  >
                    {s.name}
                  </a>
                </span>
              ))}
            </p>
          </div>
        )}

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
      </article>
    </div>
  );
}

/**
 * The moment → any thread it belongs to, generalized from the Clue-Web-only
 * motif trail above to `ContentItem.threadIds` generally (issue #436). Reuses
 * the same `openThread` pivot every era -> thread jump already uses.
 */
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
        This moment is part of {ids.length > 1 ? 'these threads' : 'a thread'} that cuts across eras.
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
        trail
          ? `Follow the ${trail.motif.label} trail in the Clue Web`
          : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

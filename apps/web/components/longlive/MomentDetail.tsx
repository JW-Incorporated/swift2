'use client';

import { Fragment, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Share2,
  ArrowRight,
  Route,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MessageCircleQuestion,
} from 'lucide-react';
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
import {
  isSubConfirmed,
  focalPointOf,
  primaryImageRef,
  type Confidence,
  type ImageKind,
  type ImageRef,
  type LensId,
  type RumorNote,
  type RumorStatus,
  type SubConfirmed,
} from '@/lib/longlive/types';
import { formatFullDate } from '@/lib/longlive/format';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

// A moment at/above CONFIRMED_TIER (types.ts) is established fact — no
// qualifier. Below it, the claim gets the UNMISSABLE banner below (not a
// subtle pill — replaced 2026-07-19): a bold label plus the reporting outlet
// and a one-line explainer, so a rumor can never visually pass as fact.
// Keyed by SubConfirmed (derived in types.ts from the same tuple as
// CONFIRMED_TIER), so moving a value across the tier is a compile error
// here, not a runtime undefined.
const CONFIDENCE_BANNER: Record<SubConfirmed, { label: string; blurb: string }> = {
  reputable_reporting: {
    label: 'Reported — not confirmed',
    blurb: 'Press reporting. Not confirmed by Taylor, her team, or an official source.',
  },
  strong_fan_consensus: {
    label: 'Rumor — unconfirmed',
    blurb: 'Widely believed by fans, but never confirmed.',
  },
  plausible: {
    label: 'Rumor — unconfirmed',
    blurb: 'A plausible but unconfirmed claim.',
  },
  clowning: {
    label: 'Rumor — unconfirmed',
    blurb: 'Fans are joking-but-hoping. Nothing here is confirmed.',
  },
  disproven: {
    label: 'Debunked',
    blurb: 'This claim has been disproven.',
  },
  joke_meme: {
    label: 'Joke / meme — not a real claim',
    blurb: 'Circulating as a joke, not as fact.',
  },
};

// Per-rumor status badges for the "What's rumored" section. 'unconfirmed' is
// the loud default; a resolved rumor keeps its entry with an honest badge.
const RUMOR_STATUS_BADGE: Record<RumorStatus, string> = {
  unconfirmed: 'Rumor — unconfirmed',
  partially_confirmed: 'Partially confirmed',
  confirmed: 'Since confirmed',
  debunked: 'Debunked',
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

/**
 * The unmissable sub-confirmed banner: a full-width, bordered strip directly
 * under the title. Deliberately NOT the quiet pill treatment confirmed
 * moments get — a rumored moment must read as rumored at a glance, on the
 * era's own tokens (no hard-coded colors, per docs/longlive-experience.md §6).
 */
function ConfidenceBanner({ confidence, outlet }: { confidence: Confidence; outlet?: string }) {
  if (!isSubConfirmed(confidence)) return null;
  const banner = CONFIDENCE_BANNER[confidence];
  return (
    <div
      role="note"
      aria-label={`${banner.label}${outlet ? `, per ${outlet}` : ''}`}
      className="mt-5 rounded-xl border-2 border-dashed p-4"
      style={{
        borderColor: 'var(--era-accent)',
        backgroundColor: 'color-mix(in srgb, var(--era-accent) 8%, var(--era-surface))',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {banner.label}
        {outlet && (
          <span className="normal-case tracking-normal text-[color:var(--era-ink-soft)]">
            · per {outlet}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        {banner.blurb}
      </p>
    </div>
  );
}

/**
 * The "What's rumored" section — attributed, dated, reported-but-unconfirmed
 * claims, structurally and visually separate from the confirmed narrative
 * above it (dashed borders + its own labeled header + a standing disclaimer;
 * the pill language mirrors the dossier meaning tiers, where dashed = not
 * confirmed). Rumors must never blend into confirmed facts.
 */
function RumorSection({ rumors }: { rumors: RumorNote[] }) {
  return (
    <section
      aria-label="What's rumored — unconfirmed reports"
      className="mt-10 rounded-2xl border-2 border-dashed p-5"
      style={{ borderColor: 'var(--era-accent)' }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <MessageCircleQuestion className="h-4 w-4 shrink-0" />
        What&apos;s rumored
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        Reported claims that have <strong>not</strong> been confirmed by Taylor, her team, or an
        official source — each one attributed to who reported it, and dated. Treat everything below
        as a rumor unless its badge says otherwise.
      </p>
      <ol className="mt-4 space-y-3">
        {rumors.map((r, i) => (
          <li
            // Two rumors can legitimately share a url (one roundup piece
            // reporting several claims), so the key needs the index.
            key={`${r.url}-${i}`}
            className="rounded-xl border border-dashed p-4"
            style={{
              borderColor: 'var(--era-line)',
              backgroundColor: 'var(--era-surface)',
              // A debunked rumor stays on record but visibly recedes.
              opacity: r.status === 'debunked' ? 0.75 : undefined,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={
                  r.status === 'unconfirmed'
                    ? {
                        border: '1px dashed var(--era-accent)',
                        color: 'var(--era-accent)',
                      }
                    : {
                        border: '1px solid var(--era-line)',
                        color: 'var(--era-ink-soft)',
                      }
                }
              >
                {RUMOR_STATUS_BADGE[r.status]}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[color:var(--era-ink-soft)] underline underline-offset-2 hover:text-[color:var(--era-ink)]"
              >
                Reported by {r.reportedBy} · {formatFullDate(r.reportedOn)}
              </a>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
              {r.claim}
            </p>
            {r.note && (
              <p className="mt-1.5 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
                {r.note}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

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

// One full-width photo woven into the article body, with its honest labeling
// (kind badge / reference note), caption, and credit. Same figure the old
// trailing gallery used, now placed inline between paragraphs (#XYZ v1).
function MomentFigure({ img, onOpen }: { img: ImageRef; onOpen: () => void }) {
  return (
    <figure className="era-card overflow-hidden rounded-2xl border">
      {/* Tap to open the full-screen zoomable viewer (#525 follow-up); the
          inline crop respects the image's focal point. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="View photo full screen"
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
      >
        <Image
          src={img.url}
          alt={img.caption ?? ''}
          fill
          unoptimized={isRemoteUrl(img.url)}
          className="object-cover"
          style={{ objectPosition: focalPointOf(img) }}
        />
      </button>
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
          <p className="text-sm leading-relaxed text-[color:var(--era-ink)]">{img.caption}</p>
        )}
        {img.credit && (
          <p className="text-xs text-[color:var(--era-ink-soft)]">Credit: {img.credit}</p>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Full-screen photo viewer (#525 follow-up): the whole photo (object-contain),
 * pinch / double-tap zoom via ZoomableImage, and keyboard/arrow paging through
 * the moment's gallery. Owns Escape while open.
 */
function MomentLightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: ImageRef[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const img = images[index];
  const count = images.length;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);
  if (!img) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 detail-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <span className="text-xs text-white/60">{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="grid size-11 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <ZoomableImage
          key={img.url}
          src={img.url}
          alt={img.caption ?? ''}
          unoptimized={isRemoteUrl(img.url)}
          fit="contain"
          frameClassName="h-full w-full"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + count) % count)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % count)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
      {(img.caption || img.credit) && (
        <div className="shrink-0 px-6 py-3 text-center">
          {img.caption && <p className="text-sm leading-relaxed text-white/85">{img.caption}</p>}
          {img.credit && <p className="mt-0.5 text-xs text-white/50">Credit: {img.credit}</p>}
        </div>
      )}
    </div>
  );
}

export function MomentDetail() {
  const { openItemId, share } = useAppState();
  const { closeItem, openShare } = useAppActions();
  const { progress } = useProgress();
  const { markMomentVisited, toggleFavorite } = useProgressActions();
  const [revealed, setRevealed] = useState(false);
  // Index into item.images for the full-screen photo viewer, or null when closed.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const item = openItemId ? getContentItem(openItemId) : undefined;

  // Any time the moment changes, make sure the viewer is closed.
  useEffect(() => setLightboxIndex(null), [openItemId]);

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
      // While the full-screen viewer is open it owns Escape (closes itself).
      if (e.key === 'Escape' && !share && lightboxIndex === null) closeItem();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItemId, closeItem, share, lightboxIndex]);

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
  // The "What's confirmed" header and the RumorSection must appear/disappear
  // together — one flag guards both.
  const hasRumors = (item.rumors?.length ?? 0) > 0;
  const hero: ImageRef | undefined = primaryImageRef(item);
  const heroUrl = hero?.url ?? '/placeholder.svg';
  const gallery = item.images.filter((img) => img !== hero);

  // Weave the non-hero photos through the body paragraphs (#XYZ v1) instead of
  // a trailing "Gallery" block: each image lands after a paragraph, spread
  // evenly. With more images than paragraphs, later slots carry more than one.
  const inlineSlots: ImageRef[][] = item.body.map(() => []);
  gallery.forEach((img, k) => {
    const target = Math.min(
      item.body.length,
      Math.max(1, Math.round(((k + 1) * item.body.length) / (gallery.length + 1))),
    );
    inlineSlots[target - 1]?.push(img);
  });

  // Open the full-screen photo viewer at a given image (matched by identity).
  const openLightbox = (img: ImageRef) => setLightboxIndex(Math.max(0, item.images.indexOf(img)));

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
          style={{ objectPosition: focalPointOf(hero) }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 20%, transparent), var(--era-bg))',
          }}
        />
        {/* Tap the hero to open the full-screen viewer; the overlaid controls
            below sit later in the DOM, so they stay clickable on top. */}
        {hero && (
          <button
            type="button"
            onClick={() => openLightbox(hero)}
            aria-label="View photo full screen"
            className="absolute inset-0 cursor-zoom-in"
          />
        )}
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
            {/* currentColor, not accent: on the inverted .era-icon-btn (#525)
                the accent can vanish against the ink background (TTPD:
                #e8e8e8 on #ededed). Filled-vs-outline carries the state. */}
            <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
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
        </div>

        {/* Sub-confirmed confidence is a full banner (2026-07-19), replacing
            the old quiet pill — see CONFIDENCE_BANNER. Confirmed moments
            (no confidence / confirmed tier) render exactly as before. */}
        {item.confidence && (
          <ConfidenceBanner confidence={item.confidence} outlet={item.sources?.[0]?.name} />
        )}

        {/* With a rumor section below, the narrative gets an explicit
            "What's confirmed" header so the split is unmistakable. Without
            rumors the layout is unchanged. */}
        {hasRumors && (
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
            What&apos;s confirmed
          </h2>
        )}

        <div className="mt-7 space-y-6 text-lg leading-relaxed text-[color:var(--era-ink)]">
          {item.body.map((para, i) => (
            <Fragment key={i}>
              <p className="text-pretty">{para}</p>
              {inlineSlots[i].map((img, j) => (
                <MomentFigure key={`${img.url}-${j}`} img={img} onOpen={() => openLightbox(img)} />
              ))}
            </Fragment>
          ))}
          {/* No paragraphs to weave into — show the photos on their own. */}
          {item.body.length === 0 &&
            gallery.map((img, j) => (
              <MomentFigure key={`${img.url}-${j}`} img={img} onOpen={() => openLightbox(img)} />
            ))}
        </div>

        {item.video && <MomentVideo video={item.video} />}

        {hasRumors && item.rumors && <RumorSection rumors={item.rumors} />}

        {item.sources && item.sources.length > 0 && (
          <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
            {/* A source that is a YouTube link embeds as a click-to-play facade
                (poster thumbnail only until the reader opts in — no iframe loads
                on mount, so this stays cheap in the feed), reusing MomentVideo.
                The citation line below still lists every source for the record. */}
            {item.sources.map((s, i) => {
              const youtubeId = extractYouTubeId(s.url);
              // A source citing the moment's own video would render it twice.
              if (youtubeId === item.video?.youtubeId) return null;
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

      {lightboxIndex !== null && (
        <MomentLightbox
          images={item.images}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
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
        trail ? `Follow the ${trail.motif.label} trail in the Clue Web` : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

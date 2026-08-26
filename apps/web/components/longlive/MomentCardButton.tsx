'use client';

import Image from 'next/image';
import {
  Sparkles, ArrowUpRight, Heart, Shirt, Music, Mic2, ScrollText, AlertTriangle, Check,
  type LucideIcon,
} from 'lucide-react';
import { useProgress } from '@/lib/longlive/store';
import { SignificanceBadge } from './SignificanceBadge';
import { TAG_META } from '@/lib/longlive/tags';
import { TAG_COLORS } from '@/lib/longlive/tagBadges';
import { focalPointOf, hasRealPrimaryImage, isSubConfirmed, primaryImageRef } from '@/lib/longlive/types';
import type { ContentItem, ContentTag } from '@/lib/longlive/types';
import type { CardTier } from '@/lib/longlive/feed-tiers';
import { TIER_BODY } from '@/lib/longlive/card-chrome';
import { cn } from '@/lib/utils';

// Split out of EraSection.tsx (PLAN.md P3 step 15 — "EraSection.tsx must come
// DOWN, not up") — see MAP.md. `MomentCardButton`, `MomentMeta` and `TagRow`
// are the card body: the one <button> per tier that opens a moment's story
// detail, plus the meta row and tag badges every tier shares. Kept together
// because nothing outside `MomentCard.tsx` renders any of the three.

/** Date/tags/clue/seen row shared by every card tier. */
export function MomentMeta({
  item,
  seen,
  size = 'default',
}: {
  item: ContentItem;
  seen: boolean;
  size?: 'default' | 'compact';
}) {
  const hasClue = Boolean(item.hiddenClue);
  // Sub-confirmed moments carry their qualifier on the CARD, not just one
  // click later in the detail view — a rumor must never scroll by as fact
  // (rumor tier, 2026-07-19). 'disproven' gets its own word; every other
  // sub-confirmed value reads "Unconfirmed" at feed altitude.
  const unconfirmed = item.confidence && isSubConfirmed(item.confidence);
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={cn(
          'uppercase tracking-widest text-[color:var(--era-ink-soft)]',
          size === 'compact' ? 'text-[10px]' : 'text-xs',
        )}
      >
        {item.dateLabel}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {item.significance && size === 'default' && (
          <SignificanceBadge significance={item.significance} />
        )}
        {unconfirmed && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]"
            style={{ borderColor: 'var(--era-accent)' }}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {size === 'default' && (item.confidence === 'disproven' ? 'Debunked' : 'Unconfirmed')}
          </span>
        )}
        {hasClue && (
          <span className="clue-glint inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--era-accent-text)]">
            <Sparkles className="h-3 w-3" />
            {size === 'default' && 'Hidden clue'}
          </span>
        )}
        {seen && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            <Check className="h-3 w-3" aria-hidden />
            {size === 'default' && 'Seen'}
          </span>
        )}
        {size === 'default' && (
          <ArrowUpRight className="h-4 w-4 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
        )}
      </span>
    </div>
  );
}

/** One stable icon per content tag — the other half of the category badge
 * (paired with the fixed colors in lib/longlive/tagBadges). Reused by both
 * the card badge (TagRow) and the per-era filter chips above. */
const TAG_ICON: Record<ContentTag, LucideIcon> = {
  Music,
  Fashion: Shirt,
  Tour: Mic2,
  Relationship: Heart,
  Lore: ScrollText,
};

/**
 * Category badge row: icon + fixed-color filled pill, one per tag on this
 * item (content-framework doc §4 — icon+color, not the old era-accent-tinted
 * text label). Colors come from lib/longlive/tagBadges (era-independent), so
 * a category reads the same across every era's re-skin.
 */
export function TagRow({ tags }: { tags: ContentTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {tags.map((t) => {
        const Icon = TAG_ICON[t];
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: TAG_COLORS[t] }}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {TAG_META[t].label}
          </span>
        );
      })}
    </div>
  );
}

/** The card body — one <button> per tier, the feed's only route into the story
 * detail. Kept as its own component so `MomentCard` owns exactly one thing:
 * the relationship between that button and the play affordance beside it.
 *
 * Each tier's root className comes from TIER_BODY, which carries layout and
 * padding but deliberately NO surface/border/radius: the box belongs to the
 * wrapper in `MomentCard`, so that whatever renders beside this button renders
 * inside the same border (#2057). Drawing a second box here would put the
 * affordance back outside one of them.
 *
 * `hideImage` drops this button's photo block for either of the two reasons a
 * card's picture must not render (both decided by `feedCardImageHidden`): the
 * sibling `VideoPoster` is about to show the same frame (#2080), or the photo is
 * a still of a video this card does not play and has no control for (#2081).
 * Passed in rather than derived here because the decision needs the era's video
 * set and the #2057 ownership answer, neither of which a card can see. */
export function MomentCardButton({
  item,
  tier,
  hideImage,
  onOpen,
}: {
  item: ContentItem;
  tier: CardTier;
  hideImage: boolean;
  onOpen: () => void;
}) {
  const { progress } = useProgress();
  const seen = progress.moments.has(item.id);
  const hero = !hideImage && hasRealPrimaryImage(item) ? primaryImageRef(item) : undefined;

  // CHAPTER BREAK — rare (paced out in feed-tiers.ts), full-bleed image,
  // big serif title. Registers as an event specifically because it's rare.
  //
  // The image block below is conditional on `hero` (a real photo) — but the
  // tier itself is not: `significance: 'defining'` (docs/decisions.md,
  // 2026-07-18) guarantees this tier regardless of imagery, so a defining
  // item with no real photo yet must still get the bigger typography, not
  // silently fall through to the plain media-tier card below. Found in
  // review (2026-07-18) — the original version gated the whole branch on
  // `tier === 'hero' && hero`, which is correct for "should this look like
  // a photo hero" but wrong for "did significance actually change anything
  // for this item," which is the guarantee the feature makes.
  if (tier === 'hero') {
    return (
      <button onClick={onOpen} className={TIER_BODY.hero}>
        {/* Tallest image in the feed, at twice the width of any other card:
              16/9 across the full 2-column track is roughly 500px of picture,
              against ~270px for the half-width media card. */}
        {hero && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              style={{ objectPosition: focalPointOf(hero) }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, color-mix(in srgb, var(--era-surface) 88%, transparent), transparent 55%)',
              }}
            />
          </div>
        )}
        <div className="p-6 md:p-8">
          <MomentMeta item={item} seen={seen} />
          <h3 className="mt-2 font-[family-name:var(--era-font)] text-balance break-words text-3xl font-semibold leading-[1.1] sm:text-4xl">
            {item.title}
          </h3>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)]">
            {item.summary}
          </p>
          <TagRow tags={item.tags} />
        </div>
      </button>
    );
  }

  // DENSE ROW — routine, day-to-day items. Tight, subordinate, small
  // thumbnail if there's a real one. Several of these packed together make
  // the next full card read as an event by contrast.
  if (tier === 'chip') {
    return (
      <button onClick={onOpen} className={TIER_BODY.chip}>
        {hero && (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            <Image
              src={hero.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(hero.url)}
              className="object-cover"
              style={{ objectPosition: focalPointOf(hero) }}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <MomentMeta item={item} seen={seen} size="compact" />
          <h3 className="mt-0.5 truncate font-[family-name:var(--era-font)] text-[15px] font-semibold leading-snug">
            {item.title}
          </h3>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--era-ink-soft)] transition group-hover:text-[color:var(--era-accent)]" />
      </button>
    );
  }

  // BREATHER — deliberately no image (either none exists, or this card was
  // chosen to break up a run of image cards), but typographically chosen,
  // not a degraded fallback: bigger date, more air, a left accent rule.
  if (tier === 'text') {
    return (
      <button onClick={onOpen} className={TIER_BODY.text}>
        <MomentMeta item={item} seen={seen} />
        <h3 className="mt-2 break-words font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {item.summary}
        </p>
        <TagRow tags={item.tags} />
      </button>
    );
  }

  // WORKHORSE (media) — the default: contained image + text, at half the
  // hero's width so the hero reads as the event and this reads as the beat.
  return (
    <button onClick={onOpen} className={TIER_BODY.media}>
      {hero && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={hero.url}
            alt=""
            fill
            unoptimized={/^https?:\/\//.test(hero.url)}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            style={{ objectPosition: focalPointOf(hero) }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, color-mix(in srgb, var(--era-surface) 85%, transparent), transparent 50%)',
            }}
          />
        </div>
      )}
      <div className="p-4">
        <MomentMeta item={item} seen={seen} />
        <h3 className="mt-2 break-words font-[family-name:var(--era-font)] text-lg font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {item.summary}
        </p>
        <TagRow tags={item.tags} />
      </div>
    </button>
  );
}

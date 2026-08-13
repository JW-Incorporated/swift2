import type { CSSProperties } from 'react';
import type { CardTier } from './feed-tiers';

/**
 * Per-tier card CHROME for the era feed: which element draws the card's visual
 * box, what the card's own <button> is left holding, and where anything
 * rendered BESIDE that button sits inside the box.
 *
 * Why this split exists (issue #2057). The feed's play affordance has to be a
 * DOM sibling of the card's big <button> — nesting one interactive element in
 * another breaks screen readers — and #2055 implemented "sibling in the DOM" by
 * making it a sibling of the card's visual box too. So on a story card carrying
 * footage the play control rendered *outside and below* the card's border,
 * floating in the gap between cards; on an 830px-tall hero card at phone width
 * that put it a full screen below the headline, where it reads as "this card
 * has no video". Joey scrolled past four of them in a row.
 *
 * "Sibling in the DOM" and "outside the card's box" are separable, and this is
 * where they get separated: the BOX classes go on a wrapper <div>, the BODY
 * classes stay on the <button>, and the affordance renders in a FOOTER inside
 * the same wrapper. The button and the affordance stay siblings; the affordance
 * is now inside the border.
 *
 * The invariant that keeps the bug from coming back: the box is drawn exactly
 * once, by the wrapper — so no tier's BODY may carry surface/border/radius
 * classes of its own. card-chrome.test.ts locks that down.
 */

/**
 * Tier -> grid footprint (#1017 part 3).
 *
 * The span vocabulary is deliberately just TWO values: full-width and
 * half-width. A richer one (thirds, sixths, NYT-style) packs badly here
 * because this feed is strictly chronological. The usual fix for the holes a
 * mixed-span grid leaves is `grid-auto-flow: dense`, and that is NOT available
 * to us: dense packing pulls later items up into earlier gaps, which would
 * both break the newest-first reading order and scramble TimelineScrubber's
 * position<->date anchors (it measures `[data-ll-item]` tops and interpolates,
 * assuming they descend in date as they descend the page).
 *
 * With only 1-cell and 2-cell spans, every half-width card pairs cleanly with
 * its neighbour and the only hole possible is a single trailing half-cell in
 * front of a full-width card — which reads as deliberate editorial air rather
 * than a broken layout.
 *
 * Below `md` this map is inert: the grid is a single column, so every card is
 * full width and the tiers separate on height and internal density instead.
 */
export const TIER_SPAN: Record<CardTier, string> = {
  // The event. Twice the width of everything around it, and the tallest image
  // in the feed — dominance you cannot miss while scrolling past.
  hero: 'md:col-span-2',
  // The workhorse. Half width, so a hero beside it is unmistakably bigger.
  media: 'md:col-span-1',
  // Compact dense row; two sit side by side in the space of one media card.
  chip: 'md:col-span-1',
  // Pure typography breather, no image.
  text: 'md:col-span-1',
};

/** The card's visual box: surface, border, radius, image clipping. On the
 * WRAPPER, never on the button — see the module comment. */
export const TIER_BOX: Record<CardTier, string> = {
  hero: 'era-card overflow-hidden rounded-2xl border',
  media: 'era-card overflow-hidden rounded-2xl border',
  // The breather's identity is its left accent rule rather than a full border.
  text: 'era-card rounded-2xl border-l-4',
  chip: 'era-card rounded-xl border',
};

/** Inline styles that belong to the box (only the breather's accent rule). */
export const TIER_BOX_STYLE: Record<CardTier, CSSProperties | undefined> = {
  hero: undefined,
  media: undefined,
  text: { borderLeftColor: 'var(--era-accent)' },
  chip: undefined,
};

/** What the card's own <button> keeps: layout, padding, hover group. Deliberately
 * no surface/border/radius — the wrapper owns those. */
export const TIER_BODY: Record<CardTier, string> = {
  // hero/media put their padding on an inner div, under a full-bleed image.
  hero: 'group block w-full text-left transition',
  media: 'group block w-full text-left transition',
  text: 'group block w-full py-4 pl-5 pr-5 text-left transition',
  chip: 'group flex w-full items-center gap-3 px-3 py-2 text-left transition',
};

/** The strip inside the box, below the button, that holds the play affordance.
 * Matches each tier's horizontal padding so the affordance lines up with the
 * card's text instead of looking bolted on. */
export const TIER_FOOTER: Record<CardTier, string> = {
  hero: 'px-6 pb-6 pt-0 md:px-8 md:pb-8',
  media: 'px-4 pb-4 pt-0',
  text: 'pb-4 pl-5 pr-5 pt-0',
  chip: 'px-3 pb-3 pt-0',
};

/** Classes that DRAW a box. No tier's BODY may contain one of these — if it
 * does, the card has two boxes and the affordance is outside one of them.
 * (`border-l-4` is deliberately included: it is the breather tier's box.) */
export const BOX_DRAWING_CLASSES = ['era-card', 'border', 'border-l-4', 'rounded'] as const;

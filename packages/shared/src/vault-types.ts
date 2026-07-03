// Vault (time-machine) domain types. Portable, zero I/O — shared by web now and
// Expo later. Shapes are adapted from the sibling Orbit project's era/outfit/
// album model so its authored content ports over cleanly.

/**
 * Per-era visual identity. Stepping into an era re-skins the whole surface to
 * this palette. Ported from Orbit's `EraTheme`.
 */
export interface EraTheme {
  /** Page background. */
  bg: string;
  /** Card / panel surface. */
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  /** Accent for highlights, hovers, markers. */
  accent: string;
  /** Hero band gradient — pure mood, never copyrighted art. */
  heroGradient: string;
  /** Small uppercase label over the hero title. */
  eyebrow: string;
}

/** An era of Taylor's public life, ordered along the timeline. */
export interface Era {
  slug: string;
  /** Era display name, e.g. "The Midnights era". */
  title: string;
  /** Album title the era centers on. */
  album: string;
  /** ISO date (YYYY-MM-DD) — era window start. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) — era window end. */
  endDate: string;
  /** Timeline order, ascending. */
  order: number;
  theme: EraTheme;
  /** Hotlinked cover image URL, or null. Never rehosted. */
  coverImageUrl: string | null;
}

export const MILESTONE_TYPES = ['album_release', 'tour'] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

/** A wavetop event rendered as a marker in the expanded timeline (not a snap target in v1). */
export interface Milestone {
  id: string;
  eraSlug: string;
  type: MilestoneType;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

/** Categories a month's dated items fall into (from the v1 spec). */
export const VAULT_CATEGORIES = [
  'sighting',
  'fashion',
  'relationship',
  'tour',
  'business',
  'music',
  'release',
] as const;
export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export function isVaultCategory(value: string): value is VaultCategory {
  return (VAULT_CATEGORIES as readonly string[]).includes(value);
}

/**
 * One line in the always-resident month index (Tier 0): enough to render a
 * timeline marker + preview card. Titles/snippets/links/metadata only — no
 * article bodies, images are hotlinked URLs.
 */
export interface MonthItem {
  id: string;
  eraSlug: string;
  /** Full year, e.g. 2022. */
  year: number;
  /** 1–12. */
  month: number;
  category: VaultCategory;
  title: string;
  /** Short preview snippet — not an article body. */
  snippet: string;
  /** Hotlink to the source, or null. */
  sourceUrl: string | null;
  /** Hotlinked thumbnail URL, or null. Never rehosted. */
  thumbnailUrl: string | null;
}

export interface MomentSource {
  outlet: string;
  url: string;
}

export interface MomentPhoto {
  /** Hotlinked photo URL — never rehosted. */
  url: string;
  credit: string | null;
}

/**
 * The on-demand detail (Tier 1) behind a single month item: extended context
 * plus linked sources and hotlinked photos.
 */
export interface Moment {
  monthItemId: string;
  /** Extended editorial context — still metadata, never a rehosted article body. */
  context: string;
  sources: MomentSource[];
  photos: MomentPhoto[];
}

export interface YearMonth {
  year: number;
  month: number;
}

// View-agnostic math for the Loupe scrubber. Turns the reader's vertical scroll
// position into a *continuous* month index across the whole timeline (so the
// scrubber can drift smoothly, not just snap per era) and back again (so a drag
// can drive the scroll — the two-way coupling). No React, no per-frame
// allocation in the hot path; the scrubber calls these inside its rAF loop.
//
// The era-only *snap* target is derived here too, but the authoritative era
// ordering / snap semantics live in `@swift2/shared` (`vault-nav`); this module
// only adds the smooth position mapping the web gesture needs.
import type { Era, Milestone, MonthItem } from '@swift2/shared';
import { eraTimelineMonths, orderedEras } from '@swift2/shared';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** The detector line (fraction down the viewport) that defines "focused". */
export const DETECTOR = 0.2;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** One rendered month in the flattened, cross-era timeline. */
export interface TimelineMonth {
  key: string;
  eraIndex: number;
  eraSlug: string;
  album: string;
  year: number;
  month: number;
  /** "Jan 2022" */
  label: string;
  /** "Jan" */
  monthShort: string;
  accent: string;
  /** True for the first rendered month of its era. */
  isEraFirst: boolean;
  /** '💿' | '🎤' when a milestone lands this month, else null. */
  milestoneGlyph: string | null;
}

/** Per-era rollup used to map a scroll fraction ↔ a continuous month index. */
export interface EraMeta {
  index: number;
  slug: string;
  album: string;
  title: string;
  accent: string;
  bg: string;
  /** Rendered month count for this era (>= 1 for a stable mapping). */
  monthCount: number;
  /** Cumulative month index at this era's first month. */
  startFloat: number;
}

export interface ScrubberModel {
  months: TimelineMonth[];
  eraMetas: EraMeta[];
  /** Total continuous length of the timeline in month units. */
  totalMonths: number;
}

/**
 * Flatten the eras into the same content-bearing months the reader actually
 * renders (empty months are dropped there too), tagging era-firsts and
 * milestones. Mirroring the reader's month filter keeps the scrubber lined up
 * with the page.
 */
export function buildModel(
  eras: readonly Era[],
  monthItems: readonly MonthItem[],
  milestones: readonly Milestone[],
): ScrubberModel {
  const ordered = orderedEras(eras);
  const months: TimelineMonth[] = [];
  const eraMetas: EraMeta[] = [];
  let cursor = 0;

  ordered.forEach((era, eraIndex) => {
    const items = monthItems.filter((it) => it.eraSlug === era.slug);
    const ms = milestones.filter((m) => m.eraSlug === era.slug);
    const msByKey = new Map<string, Milestone>();
    for (const m of ms) {
      const d = new Date(m.date);
      if (!Number.isNaN(d.getTime())) {
        msByKey.set(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`, m);
      }
    }
    const itemKeys = new Set(items.map((it) => `${it.year}-${it.month}`));

    const contentMonths = eraTimelineMonths(era, items, ms).filter(({ year, month }) => {
      const key = `${year}-${month}`;
      return itemKeys.has(key) || msByKey.has(key);
    });

    const startFloat = cursor;
    contentMonths.forEach(({ year, month }, i) => {
      const key = `${year}-${month}`;
      const ms2 = msByKey.get(key);
      months.push({
        key: `${era.slug}:${key}`,
        eraIndex,
        eraSlug: era.slug,
        album: era.album,
        year,
        month,
        label: `${MONTH_NAMES[month - 1] ?? '?'} ${year}`,
        monthShort: MONTH_NAMES[month - 1] ?? '?',
        accent: era.theme.accent,
        isEraFirst: i === 0,
        milestoneGlyph: ms2 ? (ms2.type === 'tour' ? '🎤' : '💿') : null,
      });
    });

    const monthCount = Math.max(1, contentMonths.length);
    eraMetas.push({
      index: eraIndex,
      slug: era.slug,
      album: era.album,
      title: era.title,
      accent: era.theme.accent,
      bg: era.theme.bg,
      monthCount,
      startFloat,
    });
    cursor += monthCount;
  });

  return { months, eraMetas, totalMonths: Math.max(1, cursor) };
}

/** The era index a section covers at the detector line. */
export function activeEraIndex(scrollEl: HTMLElement, sections: (HTMLElement | null)[]): number {
  const line = scrollEl.scrollTop + scrollEl.clientHeight * DETECTOR;
  let idx = 0;
  for (let i = 0; i < sections.length; i += 1) {
    const el = sections[i];
    if (el && el.offsetTop <= line) idx = i;
  }
  return idx;
}

/**
 * Continuous month index (float) at the current scroll position: era start plus
 * the fraction scrolled through that era's on-screen section. Smooth across the
 * whole timeline — the value the passive scrubber follows frame to frame.
 */
export function readMonthFloat(
  scrollEl: HTMLElement,
  sections: (HTMLElement | null)[],
  metas: EraMeta[],
): number {
  if (metas.length === 0) return 0;
  const line = scrollEl.scrollTop + scrollEl.clientHeight * DETECTOR;
  const i = activeEraIndex(scrollEl, sections);
  const top = sections[i]?.offsetTop ?? 0;
  const nextTop = sections[i + 1]?.offsetTop ?? scrollEl.scrollHeight;
  const span = Math.max(1, nextTop - top);
  const frac = clamp((line - top) / span, 0, 1);
  const meta = metas[i]!;
  return meta.startFloat + frac * meta.monthCount;
}

/** The era index containing a continuous month float. */
export function eraIndexAtMonthFloat(metas: EraMeta[], mf: number): number {
  if (metas.length === 0) return 0;
  for (let i = metas.length - 1; i >= 0; i -= 1) {
    if (mf >= metas[i]!.startFloat) return i;
  }
  return 0;
}

/** The era index whose first month is nearest a continuous month float (snap target). */
export function nearestEraStart(metas: EraMeta[], mf: number): number {
  if (metas.length === 0) return 0;
  let nearest = 0;
  let best = Infinity;
  for (const m of metas) {
    const d = Math.abs(mf - m.startFloat);
    if (d < best) {
      best = d;
      nearest = m.index;
    }
  }
  return nearest;
}

/**
 * Inverse of `readMonthFloat`: the scrollTop that would place a given month
 * float at the detector line. Used to drive the page from a scrubber drag.
 */
export function scrollTopForMonthFloat(
  scrollEl: HTMLElement,
  sections: (HTMLElement | null)[],
  metas: EraMeta[],
  mf: number,
): number {
  if (metas.length === 0) return 0;
  const i = eraIndexAtMonthFloat(metas, mf);
  const meta = metas[i]!;
  const localFrac = clamp((mf - meta.startFloat) / meta.monthCount, 0, 1);
  const top = sections[i]?.offsetTop ?? 0;
  const nextTop = sections[i + 1]?.offsetTop ?? scrollEl.scrollHeight;
  return top + localFrac * (nextTop - top) - scrollEl.clientHeight * DETECTOR;
}

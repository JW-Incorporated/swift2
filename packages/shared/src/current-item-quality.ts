// Publish gate (Content fix 3/6, docs/proposals/2026-08-23-knowledge-engine.md
// §3 "nothing goes live without an image and good copy"). Portable, zero I/O
// — a pure predicate over a `CurrentItem`-shaped value, reused at BOTH
// write time (`apps/worker/src/extract/write-knowledge.ts`, to hold a row
// with a reason instead of marking it servable) and read time (every path
// that selects current items for display: `packages/core/src/knowledge/
// client.ts`'s `getCurrentItems`/`getRecentItems`, and
// `packages/experience/src/current-feed.ts`'s `currentFeedEntries`), so a
// failing item can never reach the feed through any caller — not just the
// one write-time guard.
//
// Every threshold this gate checks lives in the single exported
// `CURRENT_ITEM_QUALITY_THRESHOLDS` constant below (the card's "tune numbers
// in one exported constant" instruction) — change the bar in one place.

import { evaluateCurrentItemWriting } from './current-item-writing.ts';
import { factGrounding } from './current-item-attribution.ts';
import { IMAGE_HOST_ALLOWLIST, SCOPED_IMAGE_HOST_ALLOWLIST } from './current-item-image-hosts.ts';
export { IMAGE_HOST_ALLOWLIST, SCOPED_IMAGE_HOST_ALLOWLIST, type ScopedImageHost } from './current-item-image-hosts.ts';


/** Every tunable number/word-floor this gate checks — change the bar in
 * exactly one place. `summaryMinSentences`/`summaryMinChars` and
 * `detailMinWords` are the card's "2+ sentences / ~160+ chars" / "~60+
 * words" floors. */
export const CURRENT_ITEM_QUALITY_THRESHOLDS = {
  summaryMinSentences: 2,
  summaryMinChars: 160,
  detailMinWords: 60,
} as const;

/** Body floor for rows written by the two-pass engine (facts != null). */
export const V2_DETAIL_MIN_WORDS = 120;

/** One named reason a row failed the gate — `writeCurrentItem` persists
 * this as the hold reason so the next worker cycle's re-enrichment pass
 * (Cards 1-2) and any human triage knows exactly what to fix. Ordered by
 * check precedence in `evaluateCurrentItemQuality` (first failing check
 * wins; a row can fail more than one check, but only the first is
 * reported — same "don't partially report" posture as `screenAll`'s
 * redline screen, which also reports one verdict per row). */
export const QUALITY_HOLD_REASONS = [
  'missing_headline',
  'missing_image',
  'image_host_not_allowlisted',
  'summary_too_short',
  'detail_too_short',
  'writing_quality',
  'redline_failed',
] as const;
export type QualityHoldReason = (typeof QUALITY_HOLD_REASONS)[number];

/** The minimal shape this gate needs — a structural subset of
 * `CurrentItem` (not `CurrentItem` itself) so write-time callers can check
 * an `ExtractedCurrentItem` + candidate `imageUrl` + screen result BEFORE a
 * full `CurrentItem` row exists, and read-time callers can check the real
 * row as-is. */
export interface CurrentItemQualityInput {
  headline: string;
  summary: string;
  detail: string;
  imageUrl?: string;
  redlineOk: boolean;
  /** Pass-A fact list; non-null marks a row written by the two-pass engine (v2), whose copy also faces the writing checks. Legacy rows carry null/undefined. */
  facts?: readonly unknown[] | null;
  sources?: readonly { name?: string; url?: string }[];
}

export interface CurrentItemQualityResult {
  ok: boolean;
  /** Undefined when `ok` is true. */
  reason?: QualityHoldReason;
}

/** Rough sentence count: splits on `.`/`!`/`?` followed by whitespace or
 * end-of-string, drops empty fragments. Good enough for a length floor —
 * this is a publish GATE, not a grammar checker, so it deliberately doesn't
 * try to handle abbreviations ("Jan.") perfectly; a false negative here
 * just holds a row for one more enrichment cycle, never publishes a bad
 * one (fails closed either way). */
export function sentenceCount(text: string): number {
  // Linear single pass (no backtracking regex — CodeQL js/polynomial-redos
  // flagged `/[.!?]+(?:\s+|$)/` on long runs of '!'). A sentence ends at a
  // run of terminators that is followed by whitespace or end-of-string.
  const s = text.trim();
  if (!s) return 0;
  let count = 0;
  let hasContent = false;
  let i = 0;
  while (i < s.length) {
    const ch = s.charAt(i);
    if (ch === '.' || ch === '!' || ch === '?') {
      let j = i;
      while (j < s.length && (s.charAt(j) === '.' || s.charAt(j) === '!' || s.charAt(j) === '?')) j++;
      if (j === s.length || /\s/.test(s.charAt(j))) {
        if (hasContent) count++;
        hasContent = false;
      }
      i = j;
      continue;
    }
    if (!/\s/.test(ch)) hasContent = true;
    i++;
  }
  if (hasContent) count++;
  return count;
}

/** Word count: splits on whitespace, drops empty fragments. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Whether `url`'s hostname is on the image-host allowlist (bare host
 * match) or the scoped allowlist (host + path prefix match). Returns false
 * for an unparseable URL — never throws, same fail-closed posture as the
 * rest of this gate. */
export function isAllowlistedImageHost(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  if (IMAGE_HOST_ALLOWLIST.includes(host)) return true;
  return SCOPED_IMAGE_HOST_ALLOWLIST.some(
    (scoped) => scoped.host.toLowerCase() === host && parsed.pathname.startsWith(scoped.pathPrefix),
  );
}

/** The image half of the publish gate, shared by every card kind that must
 * carry media (`current_item` via `evaluateCurrentItemQuality`, `live_theory`
 * via its write/read paths) — one mechanism, one allowlist. */
export function evaluateImageUrl(
  imageUrl: string | null | undefined,
): { ok: true } | { ok: false; reason: 'missing_image' | 'image_host_not_allowlisted' } {
  if (!imageUrl) return { ok: false, reason: 'missing_image' };
  if (!isAllowlistedImageHost(imageUrl)) return { ok: false, reason: 'image_host_not_allowlisted' };
  return { ok: true };
}

/** Read-time defense in depth for `live_theory` rows: servable only with a
 * present, allowlisted image (legacy imageless rows are dropped). */
export function liveTheoryHasValidImage(theory: { imageUrl?: string | null }): boolean {
  return evaluateImageUrl(theory.imageUrl).ok;
}

/**
 * THE PUBLISH GATE. A `current_item` is servable only when ALL of:
 * headline present; `imageUrl` present AND allowlisted; `summary` >=
 * `summaryMinSentences` sentences AND >= `summaryMinChars` chars; `detail`
 * >= `detailMinWords` words; `redlineOk` true. Checked in that order —
 * the first failing check is the reported reason (never multiple reasons
 * at once, same single-verdict posture as the existing redline screen).
 */
export interface CurrentItemQualityThresholds {
  summaryMinSentences: number;
  summaryMinChars: number;
  detailMinWords: number;
}

export function evaluateCurrentItemQuality(
  item: CurrentItemQualityInput,
  thresholds: CurrentItemQualityThresholds = CURRENT_ITEM_QUALITY_THRESHOLDS,
): CurrentItemQualityResult {
  if (!item.headline || !item.headline.trim()) return { ok: false, reason: 'missing_headline' };
  const image = evaluateImageUrl(item.imageUrl);
  if (!image.ok) return image;
  if (
    sentenceCount(item.summary) < thresholds.summaryMinSentences ||
    item.summary.trim().length < thresholds.summaryMinChars
  ) {
    return { ok: false, reason: 'summary_too_short' };
  }
  const isV2 = item.facts != null;
  const detailMinWords = isV2 ? Math.max(thresholds.detailMinWords, V2_DETAIL_MIN_WORDS) : thresholds.detailMinWords;
  if (wordCount(item.detail) < detailMinWords) return { ok: false, reason: 'detail_too_short' };
  if (isV2) {
    // Stored rows carry no per-sentence citations; those are enforced by the worker before the write.
    const writing = evaluateCurrentItemWriting(
      { headline: item.headline, lead: item.summary, body: item.detail, sources: item.sources ?? [], ...factGrounding(item.facts) },
      { legacy: true },
    );
    if (!writing.ok) return { ok: false, reason: 'writing_quality' };
  }
  if (!item.redlineOk) return { ok: false, reason: 'redline_failed' };
  return { ok: true };
}

/** Convenience boolean form for read-time filtering (every current-item
 * selection path: `getCurrentItems`/`getRecentItems`/`currentFeedEntries`)
 * where callers only need the pass/fail, not the reason. */
export function passesCurrentItemQualityGate(
  item: CurrentItemQualityInput,
  thresholds: CurrentItemQualityThresholds = CURRENT_ITEM_QUALITY_THRESHOLDS,
): boolean {
  return evaluateCurrentItemQuality(item, thresholds).ok;
}

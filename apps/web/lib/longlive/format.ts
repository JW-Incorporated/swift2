/**
 * Small pure text/date formatting helpers shared across the LongLive UI.
 * No imports, no DOM — everything here is unit-testable in isolation.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Relative "3 days ago"-style label for an ISO timestamp, measured against
 * `nowMs`. Returns null for a missing/unparseable input so callers can simply
 * not render the label — never a crash, never a "NaN years ago". A timestamp
 * slightly in the future (clock skew between build machine and visitor) reads
 * as "just now".
 */
export function formatRelativeTime(iso: string | null | undefined, nowMs: number): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const diff = nowMs - then;
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return h === 1 ? '1 hour ago' : `${h} hours ago`;
  }
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'yesterday';
  if (days < 31) return `${days} days ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Truncates prose to at most `max` characters on a word boundary, appending a
 * single ellipsis. Used by the scrubber hover preview and share copy so a
 * summary reads as a teaser, not a wall of text.
 */
export function truncate(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  // Cut, then back up to the last word boundary (but never past the midpoint,
  // so one enormous word can't collapse the whole preview).
  let cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max / 2) cut = cut.slice(0, lastSpace);
  // Drop trailing punctuation that reads badly before an ellipsis.
  cut = cut.replace(/[\s,;:.—–-]+$/, '');
  return `${cut}…`;
}

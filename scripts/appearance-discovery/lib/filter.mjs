// Taylor-relevance filter — deterministic, documented in channels.mjs.
// Pure: no I/O, no dates read from the clock (the caller passes `now`).

const TAYLOR_SWIFT = /taylor\s+swift/i;
// Capital-S "Swift" as a whole word. \b keeps "Swiftie(s)" and any suffix out;
// requiring the capital keeps prose adjectives ("a swift reaction") out.
const SWIFT_WORD = /\bSwift\b/;

/**
 * Why this entry is relevant, or null when it is not.
 * Rules (first match wins — see channels.mjs for the rationale):
 *   'all-uploads'   — channel.allUploads (Taylor's own channel)
 *   'taylor-swift'  — "taylor swift" in the TITLE (case-insensitive)
 *   'swift-title'   — word "Swift" in the TITLE (capitalised, word-boundaried)
 *
 * TITLE ONLY, never the description — see channels.mjs. The first live dry run
 * proved the description is unusable on exactly the channels we watch.
 */
export function matchRule(entry, channel) {
  if (channel?.allUploads) return 'all-uploads';
  if (TAYLOR_SWIFT.test(entry.title)) return 'taylor-swift';
  if (SWIFT_WORD.test(entry.title)) return 'swift-title';
  return null;
}

/**
 * True when `published` falls within the freshness window. Anything older than
 * `maxAgeDays` is not "new" — it predates the watch (the backfill lane owns
 * history), so filing it would re-litigate the past every time a channel is
 * added. Unparseable dates are OUT: a video we cannot date cannot be placed
 * "forever going forward".
 */
export function isFresh(published, now, maxAgeDays) {
  const t = Date.parse(published);
  if (Number.isNaN(t)) return false;
  const age = (now - t) / 86_400_000;
  return age >= 0 ? age <= maxAgeDays : age >= -1; // tolerate ≤1 day of clock skew
}

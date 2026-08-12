// X's "weighted" tweet-length rule, extracted from check-drafts.mjs
// (2026-08-11, PR #1924 integration) so BOTH length gates share one
// implementation: the draft-time quality checker (check-drafts.mjs, runs on
// the files a PR touches) and the CI schema gate (lib/queue-schema.mjs via
// validate-queue.mjs, runs on everything in social/queue/ inside the
// required `build` job). Two independent ports of this rule would drift, and
// a drifted length rule is exactly how eleven X posts died on an unexplained
// 403 — see check-drafts.mjs's `length` rule family and docs/decisions.md
// (2026-08-11, Tree entry) for the full diagnosis.
//
// Pure (no fs, no network, no imports) on purpose.

// twitter-text (X's own open-sourced counting library) shortens every
// autolinked URL to a t.co link of exactly this length, regardless of the
// original URL's actual length.
export const WEIGHTED_URL_LENGTH = 23;

// Matches whatever X will autolink into a t.co link: an explicit http(s)://
// URL through to the next whitespace, OR a bare/naked domain with no scheme
// at all (this pipeline's own links are always written this way — e.g.
// `longlivets.com/?utm_source=x&utm_medium=social&utm_campaign=…` — and X's
// autolinker treats a recognizable domain the same as a full URL). The bare
// form requires one or more `label.` groups ending in a letters-only TLD
// (2-24 chars) that sits directly against the preceding dot with no space in
// between — the no-space requirement is deliberate cheap insurance against
// misreading ordinary sentence punctuation as a domain (e.g. "Mr. Smith" has
// a space after the period, so it never matches), plus an optional
// path/query/fragment glued on with no intervening space.
//
// This is a pragmatic approximation of twitter-text's real (considerably
// larger) valid-URL grammar — https://github.com/twitter/twitter-text — not
// a byte-for-byte port. It's sized to what this pipeline actually emits
// (bare longlivets.com links, generic http(s) links) rather than every edge
// case X's own matcher handles (IDN domains, obscure TLDs, IPv4 literals,
// etc.). If a future draft's link shape stops matching this regex, that's a
// bug to fix here, not a reason to hand-wave the length rule.
const AUTOLINK_URL_RE = /https?:\/\/\S+|\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,24}(?:\/\S*)?/gu;

// Characters X's counter weighs as 2 instead of 1 — emoji
// (Extended_Pictographic) and the CJK-family scripts twitter-text also
// upweights (Han covers Chinese/Kanji, plus Hiragana/Katakana/Hangul).
// Checked per Unicode code point (via the `for…of` loop in weightPlainText
// below), not per UTF-16 code unit, so a surrogate-pair emoji isn't
// accidentally counted twice over.
const WIDE_CHAR_RE = /\p{Extended_Pictographic}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

function weightPlainText(segment) {
  let total = 0;
  for (const ch of segment) total += WIDE_CHAR_RE.test(ch) ? 2 : 1;
  return total;
}

/**
 * X's "weighted" tweet length — approximates twitter-text's
 * unicodeCharacterCount + autolink-URL-collapsing algorithm
 * (https://github.com/twitter/twitter-text), NOT `body.length`. Every
 * autolinked URL (see AUTOLINK_URL_RE above) counts as exactly
 * WEIGHTED_URL_LENGTH (23) characters no matter how long it actually is;
 * most emoji and CJK-script characters count as 2 (see WIDE_CHAR_RE); every
 * other character counts as 1.
 *
 * Why this matters: `social/failed/`'s 11 X items (as of 2026-08-11) all had
 * a RAW body length of 294-373 characters and all failed with a generic 403
 * — X silently rejecting an over-280-weighted-length tweet on a non-premium
 * account. Nothing in this pipeline ever checked length against X's real
 * limit before now (a doc instruction — growth-draft.md's old "≤280
 * characters" — is not a check; see check-drafts.mjs's checkLength and
 * queue-schema.mjs's body rule for the actual gates).
 */
export function weightedTweetLength(body) {
  const text = String(body ?? '');
  let total = 0;
  let cursor = 0;
  AUTOLINK_URL_RE.lastIndex = 0;
  let match;
  while ((match = AUTOLINK_URL_RE.exec(text))) {
    total += weightPlainText(text.slice(cursor, match.index));
    total += WEIGHTED_URL_LENGTH;
    cursor = match.index + match[0].length;
  }
  total += weightPlainText(text.slice(cursor));
  return total;
}

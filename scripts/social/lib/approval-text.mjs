// Text helpers for the Discord approval post (scripts/social/approval-prompt.mjs).
// Split out of approval-prompt.mjs (Bots v2 W2) so that file stays under the
// repo's 300-line guideline; the injection-hardening helpers below moved
// VERBATIM — five review rounds went into them, do not loosen them.
import { neutralizeMentions } from '../../community/discord-delivery.mjs';

/** Discord's hard API limit for a webhook message's `content` (2,000
 * characters). Every message approval-prompt.mjs builds is guaranteed to fit
 * under it by construction — fields are TRUNCATED to fit, a message is never
 * chunked (Bots v2 C3: one approval = one message, so a ✅ or a reply can only
 * ever mean one thing). Enforced by approval-prompt.test.ts. */
export const DISCORD_MESSAGE_HARD_CAP = 2000;

export function escapeFences(text) {
  return String(text ?? '').replace(/```/g, '``​`');
}

/**
 * Round 3 fix (comprehensive audit, not a fifth ad-hoc patch): the ONE
 * shared helper for every dynamic, drafter-controlled field this builder
 * renders on a line of its own before the trusted trailing
 * `ref: PR #<n> · <sha> · <file|*>` line — rationale, pillar (via
 * campaign), why, singlePlatformReason, the lane/sourceRoutine and platform
 * fallbacks, a raw scheduledAt fallback. Any one of these left unsanitized is
 * the SAME hijack: a newline (or a Unicode line/paragraph separator —
 * U+2028/2029 are LineTerminators for JS's `\s` and for `^`/`$` in `/m`
 * regexes alike, same as `\n`) can plant a second, fake ref:-shaped line
 * earlier in the message, and the poll's REF_LINE_RE match could bind a
 * reaction to the WRONG scope.
 *
 * `String(value ?? '')` first — the critique exemption lets an approved
 * item's `critique` be completely malformed with zero CI findings, by
 * design, so a field is not guaranteed to be a string; a non-string value
 * must never throw and crash brief-building for the WHOLE PR.
 */
export function sanitizeInlineField(value) {
  const singleLine = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeFences(neutralizeMentions(singleLine));
}

/**
 * `body` (and nothing else) legitimately spans multiple lines — real
 * captions have paragraph breaks — so it can never go through
 * sanitizeInlineField's whitespace-collapse without breaking the product. It
 * renders wrapped in a ``` fence for a HUMAN reader, but the poll parses the
 * raw Discord message content string — backticks and all — so a fenced line
 * that happens to match `^ref: PR #\d+ · ...$` is exactly as parseable as an
 * unfenced one (round 3 audit finding). Neutralizes ONLY a line matching
 * that literal, distinctive prefix, leaving every other newline untouched.
 */
export function neutralizeRefLikeLines(text) {
  return String(text ?? '').replace(/^ref: PR #/gm, 'ref​: PR #');
}

/** `pillarOf` calls `campaign.startsWith(...)` on its argument BEFORE this
 * file's own sanitizer ever sees the *output* — a non-string, non-nullish
 * `campaign` (e.g. `campaign: 2026`) would throw inside pillarOf itself.
 * Preserves pillarOf's null-vs-unrecognized-prefix distinction. */
export function stringOrNull(value) {
  return value == null ? null : String(value);
}

/** The "YYYY-MM-DD HH:MM" stamp, formatted from the ALREADY-PARSED `Date`
 * (via `toISOString()`), never by slicing the raw `scheduledAt` (which
 * `Date` happily parses from a NUMBER, and a raw number has no `.slice`).
 * Only call after the `Number.isNaN(scheduled.getTime())` guard. */
export function compactUtcStamp(scheduled) {
  return scheduled.toISOString().slice(0, 16).replace('T', ' ');
}

/** `media`/`altText` are schema-expected arrays, but neither notify workflow
 * validates the manifest before this builder renders it. */
export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/** Truncates to at most `max` UTF-16 code units, never splitting a surrogate
 * pair, appending an ellipsis when anything was cut. `max <= 0` → ''. */
export function clip(text, max) {
  const s = String(text ?? '');
  if (max <= 0) return '';
  if (s.length <= max) return s;
  if (max === 1) return '…';
  let cut = s.slice(0, max - 1);
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Wraps a URL for a message that carries a deliberate image embed: `<…>`
 * stops Discord generating an extra link-preview embed (Bots v2 C6), and any
 * character that could break out of the wrapper or the line is
 * percent-encoded. */
export function angleUrl(url) {
  const safe = String(url ?? '').replace(/[<>\s|]/g, (c) => encodeURIComponent(c));
  return `<${safe}>`;
}

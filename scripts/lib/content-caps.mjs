// THE source of truth for content length caps.
//
// Why this file exists (incident, 2026-08-11):
// The same policy number was written out by hand in four places — the DB
// migrations, `scripts/validate-content.mjs`, `scripts/content-coverage.mjs`,
// and `scripts/content-engine/checkers/redlines.mjs`. On 2026-07-22 Wyatt
// raised the `moment.context` cap 2000 -> 4000 (founder decision, PR #1199 +
// supabase/migrations/20260722120000_moment_context_4000.sql) and three of the
// four moved. The fourth — the redlines checker — kept a flat
// `FIELD_FAIL_CHARS = 2000`, so Karen filed a P1 "oversized field" safety
// ticket for every context between 2000 and 4000 chars: content that is
// deliberately that long because the founder decided it should be allowed to
// be. A fixer then trimmed 31 marquee contexts back under 2000 to clear the
// ticket (commit 26e9a5b / PR #1727), destroying ~30.5k characters of
// deliberately-authored depth on the exact pages the 4000 raise was for. The
// depth engine writes long, the stale checker calls it a violation, the fixer
// truncates, repeat.
//
// So: every cap now lives here, once. Consumers import; nobody re-types a
// number. `scripts/lib/content-caps.test.ts` parses the migration SQL and
// fails if this table and the database ever disagree again.

// ---------------------------------------------------------------------------
// 1. DB CHECK caps — mirrored from Postgres. Authoritative for AUTHORING:
//    exceed one of these and the row is rejected on insert, so CI has to catch
//    it first. Keys are `<table>.<column>` exactly as the constraint names
//    them. Every entry is asserted against the migration SQL by the test.
// ---------------------------------------------------------------------------
export const DB_CAPS = Object.freeze({
  'month_item.snippet': 400,
  // Raised 2000 -> 4000 on 2026-07-22 by founder decision (Wyatt). Measured
  // rationale in the migration header: a 91-ledger depth push produced
  // BYTE-IDENTICAL marquee pages (MSG wedding, engagement, the 4.002M debut
  // week) because the field they would have grown into was already full.
  // 4000 is still a real limit — the field is a summary, not a rehosted
  // article body, which is what the original 2000 was protecting.
  'moment.context': 4000,
  'track_note.note': 400,
  'release.note': 400,
  'tour.note': 400,
  'theory.claim': 400,
  'theory.evidence': 2000,
  'video_work.summary': 400,
  'video_work.symbolism': 2000,
});

// Caps with no DB column behind them — policy decided in code review, listed
// here so they are still in one place and still greppable.
export const POLICY_CAPS = Object.freeze({
  // Audit §5 hard cap on a verbatim source excerpt (copyright).
  sourceExcerpt: 300,
  // Rumor prose (moment.rumors[].claim / .note / .resolution.note).
  rumorText: 400,
  // Shoppable-product alt text.
  productAltNote: 200,
  // Video easter-egg bullet.
  easterEgg: 400,
  // Tour show notes.
  showNote: 400,
});

// ---------------------------------------------------------------------------
// 2. The anti-dump ceiling — a DIFFERENT policy from the DB caps, and the one
//    that got confused.
//
//    `safety.redline` and `content-coverage` both ask "is this field an
//    article/statement dump?" — a copyright and safety question, not a length
//    preference. The signal is that someone pasted source text into our seed.
//    2000 chars of pasted body copy is a red line; 2000 chars of OUR OWN
//    editorial prose is not, and `moment.context` is our own prose. That is
//    exactly why the founder raise applies here and only here.
//
//    Rule: the anti-dump ceiling is 2000 for every field, EXCEPT where the
//    DB deliberately allows more for a field we author ourselves. It can
//    never be looser than the field's DB cap (the test asserts this), so this
//    checker can never green-light something the database will reject.
// ---------------------------------------------------------------------------
export const DUMP_CEILING_CHARS = 2000;

/**
 * Fields whose anti-dump ceiling is deliberately NOT the default 2000, keyed
 * `<corpus type>.<field>`. Anything not listed uses DUMP_CEILING_CHARS.
 */
const DUMP_CEILING_OVERRIDES = Object.freeze({
  // Founder decision 2026-07-22 — see DB_CAPS above and the migration header.
  // This is our own long-form editorial body text; length is not the dump
  // signal for it. The lyrics-block, verbatim-quote-span and private-data
  // detectors still apply to it unchanged, and those are the checks that
  // actually catch a paste.
  'moment.context': 4000,
});

/** Why a non-default ceiling is what it is — surfaced in reports so a future
 *  fixer sees the decision instead of re-litigating it. */
export const DUMP_CEILING_RATIONALE = Object.freeze({
  'moment.context':
    'moment.context is capped at 4000, not 2000 — founder decision (Wyatt, 2026-07-22, ' +
    'supabase/migrations/20260722120000_moment_context_4000.sql). It is our own editorial ' +
    'prose and is meant to be long on marquee pages. Do NOT trim it to 2000.',
});

/**
 * Anti-dump ceiling for one corpus field.
 * Accepts either the corpus field name (`context`, from
 * scripts/content-engine/lib/corpus.mjs) or the dotted label
 * (`moment.context`, used by content-coverage.mjs), and strips array indices
 * (`photos[0].caption` -> `photos.caption`).
 *
 * @param {string} type   corpus item type: moment|track|theory|video|tour|release
 * @param {string} field  field name or dotted label
 * @returns {number} max chars before the field reads as an article/body dump
 */
export function dumpCapFor(type, field) {
  return DUMP_CEILING_OVERRIDES[dumpKey(type, field)] ?? DUMP_CEILING_CHARS;
}

/** Rationale string for a field whose ceiling is non-default, else undefined. */
export function dumpCapRationale(type, field) {
  return DUMP_CEILING_RATIONALE[dumpKey(type, field)];
}

/** Normalized `<type>.<field>` key. Exported for the test. */
export function dumpKey(type, field) {
  const base = String(field ?? '')
    .replace(/\[\d+\]/g, '')
    .replace(new RegExp(`^${type}\\.`), '');
  return `${type}.${base}`;
}

// ---------------------------------------------------------------------------
// 3. Verbatim-quote caps — the other half of the anti-dump policy, and the
//    half that actually catches a paste regardless of field length.
// ---------------------------------------------------------------------------
/** A single quoted span this long is a statement/article dump. Hard fail. */
export const QUOTE_FAIL_CHARS = 600;
/** Reported for review, not failed. Longest real interview pull-quote: 422. */
export const QUOTE_WARN_CHARS = 300;

// ---------------------------------------------------------------------------
// 4. The FLOOR. Lives here so the two ends of the same field's range are read
//    together: a moment.context under this is reported as thin, over 4000 is
//    rejected. The whole point of the 2026-07-22 raise was that the marquee
//    pages had run out of room between them.
// ---------------------------------------------------------------------------
/** moment.context shorter than this is reported (never failed) as shallow. */
export const SHALLOW_CONTEXT_CHARS = 300;

/** Exported for the desync test: every distinct cap number this module owns. */
export const ALL_CAPS = Object.freeze({
  DB_CAPS,
  POLICY_CAPS,
  DUMP_CEILING_CHARS,
  DUMP_CEILING_OVERRIDES,
  QUOTE_FAIL_CHARS,
  QUOTE_WARN_CHARS,
});

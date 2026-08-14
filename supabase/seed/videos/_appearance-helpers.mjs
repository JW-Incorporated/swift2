// Shared authoring helpers for APPEARANCE video records (kind: interview |
// award_speech | speech | press_event). Files starting with "_" are ignored by
// the seed runner, the validator's loader and the sync script, so this is a
// library, never a seed file — but sibling seed files can import it (a relative
// sibling-seed import is the one import shape the inertness grammar allows).
//
// Why it exists: the 2026-08-12 appearance pass adds 19 records across 8 era
// files, and every one of them is the same shape — one oEmbed-verified upload
// on the channel that owns the footage, mirrored as the officialUrl, the media
// ref and the primary source. Hand-repeating that literal 19 times is exactly
// the drift risk CLAUDE.md rule 8 is about (one mistyped `rights` or a stale
// `accessed_at` and a record silently degrades).
//
// INERTNESS. Every file under supabase/seed — including this one — must pass
// scripts/check-content-inert.mjs, a positive grammar that proves an imported
// seed file can only build a constant. That bans member access, `new`, and
// notably ARRAY SPREAD, which is why `appearance()` takes its complete
// `sources` list rather than merging an upload citation into extras. Do not
// "simplify" that back into a spread: the fix would be an allowlist entry, and
// allowlisted files lose auto-merge and become human-review-only.
//
// PROVENANCE RULE, encoded here rather than trusted to authors: `officialUrl`
// is only ever the upload on the channel that OWNS the footage — the show, the
// network, the awards body, or the outlet that filmed it. A fan archive can be
// a timeline source; it can never be an appearance's officialUrl. Anything
// whose only surviving copy is a re-upload stays off the Videos rail entirely.

/** The date every URL below was re-verified against YouTube's oEmbed endpoint
 * (HTTP 200 + author_name matching the channel named on the record). */
export const VERIFIED_ON = '2026-08-12';

/**
 * The citation for the upload itself — always the FIRST entry of an
 * appearance's `sources`, and always the same id the record embeds.
 *
 * `sourceType: 'video'` (with a lower reliability) is for an uploader who
 * filmed the footage themselves but isn't the rights-holding broadcaster — a
 * journalist's own festival recording, say. It is never for a re-upload.
 */
export const upload = ({
  youtubeId,
  title,
  channel,
  sourceType = 'official',
  reliability = 5,
  note,
}) => ({
  source_url: `https://www.youtube.com/watch?v=${youtubeId}`,
  source_title: title,
  publisher: channel,
  source_type: sourceType,
  accessed_at: VERIFIED_ON,
  reliability_score: reliability,
  excerpt: null,
  notes: note ?? `official upload on ${channel}'s own channel — oEmbed-verified ${VERIFIED_ON}`,
});

/** A press citation backing the appearance — real reporting, never a YouTube
 * link dressed up as an outlet (see the independentOutlets() host-counting
 * trap noted in scripts/lib/sourcing-gate.mjs). */
export const pressSource = (source_url, source_title, publisher, notes) => ({
  source_url,
  source_title,
  publisher,
  source_type: 'reputable_press',
  accessed_at: VERIFIED_ON,
  reliability_score: 4,
  excerpt: null,
  notes,
});

/** A reference-work citation (Wikipedia et al) — lowest reliability tier. */
export const wikiSource = (source_url, source_title, notes) => ({
  source_url,
  source_title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: VERIFIED_ON,
  reliability_score: 2,
  excerpt: null,
  notes,
});

/**
 * Build one appearance record. `sources` is the COMPLETE citation list and its
 * first entry should be `upload(...)` for the same `youtubeId` (a test asserts
 * every appearance cites the video it embeds).
 *
 * @param {object} a
 * @param {string} a.slug          kebab, globally unique across videos/**
 * @param {'interview'|'award_speech'|'speech'|'press_event'} a.kind
 * @param {string} a.title         reader-facing title (not the upload's title)
 * @param {string} a.releasedOn    ISO YYYY-MM-DD of the appearance
 * @param {string} a.summary       <=400 chars, hook-voiced, sourced
 * @param {string} a.youtubeId     11-char id, oEmbed-verified on VERIFIED_ON
 * @param {string} a.channel       oEmbed's author_name — the REAL uploader
 * @param {string} [a.attribution] media credit line; defaults to the channel's
 *                                 own-channel phrasing
 * @param {object[]} a.sources     complete citation list, >=1 (hard rule)
 * @param {string[]} [a.tags]      authored topic ContentTags — ONLY where the
 *                                 record's own title/summary genuinely
 *                                 supports the topic; omit (never guess) when
 *                                 the record is too thin. Defaults to none.
 */
export const appearance = ({
  slug,
  kind,
  title,
  releasedOn,
  summary,
  youtubeId,
  channel,
  attribution,
  sources,
  tags = [],
}) => ({
  slug,
  kind,
  title,
  director: null,
  releasedOn,
  relatedSongs: [],
  summary,
  symbolism: null,
  easterEggs: [],
  officialUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  media: [
    {
      kind: 'oembed',
      rights: 'platform_tos',
      provider: 'youtube',
      post_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      oembed_fetched_at: VERIFIED_ON,
      attribution: attribution ?? `${channel} — official YouTube channel`,
    },
  ],
  sources,
  tags,
});

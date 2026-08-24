// Pure row builders: Vault seed data (already normalized by the existing
// sync-longlive-* generators) -> knowledge_doc / egg_ledger row shapes for
// scripts/sync-clown-knowledge.mjs (Stage 4, PLAN.md). No I/O here so these
// are directly unit-testable.

import { slugify } from './longlive-sync-shared.mjs';
import { symbolsIn } from './knowledge-symbols.mjs';

const SOURCE_TIER_BY_TYPE = {
  official: 'official',
  interview: 'official',
  reputable_press: 'established',
  chart_database: 'established',
  awards_database: 'established',
  fashion_database: 'established',
  wiki: 'established',
  fan_forum: 'fan',
  social: 'fan',
  video: 'established',
  image_source: 'established',
};
const TIER_RANK = { official: 3, established: 2, fan: 1 };

/**
 * Best `source_tier` across a doc's citations. Vault content is editorially
 * reviewed even when a per-source `type` wasn't recorded (many older
 * citations predate the 2026-07-08 provenance audit), so an unscored source
 * defaults to 'established' — never the raw-ingest-only 'unverified' tier,
 * which would misrepresent curated Vault material as unscreened.
 */
export function sourceTierFrom(sources) {
  let best = null;
  for (const s of sources ?? []) {
    const tier = SOURCE_TIER_BY_TYPE[s?.type];
    if (tier && (!best || TIER_RANK[tier] > TIER_RANK[best])) best = tier;
  }
  return best ?? 'established';
}

const RESOLVED_RUMOR_STATUSES = new Set(['confirmed', 'debunked']);

/** One `moment:*` knowledge_doc row from a normalized content-vault item (addItem()'s output). */
export function buildMomentDoc(item, eraId, lexicon) {
  const text = item.body.join('\n\n');
  const hasOpenRumor =
    Array.isArray(item.rumors) && item.rumors.some((r) => !RESOLVED_RUMOR_STATUSES.has(r?.status));
  return {
    id: `moment:${item.id}`,
    kind: 'moment',
    tier: 'vault',
    title: item.title,
    text,
    date: item.date,
    recency_date: item.date,
    open: hasOpenRumor,
    status: hasOpenRumor ? 'reported' : 'confirmed',
    source_tier: sourceTierFrom(item.sources),
    sources: item.sources ?? [],
    era_id: eraId,
    symbols: symbolsIn(`${item.title} ${text}`, lexicon),
    entities: [], // no entity field/extraction exists anywhere in the source schema
    expires_at: null,
    redline_ok: true, // Vault seed content already passed editorial/redline review before merge, unlike raw current-tier ingest
  };
}

/** One `track:*` knowledge_doc row from a normalized TrackNote (buildTrackGuide()'s output). */
export function buildTrackDoc(track, eraId, lexicon) {
  const text = [track.note, ...(track.discussion ?? [])].filter(Boolean).join('\n\n');
  const id = `track:${eraId}:${track.slug ?? slugify(track.title)}`;
  return {
    id,
    kind: 'track',
    tier: 'vault',
    title: track.title,
    text,
    date: track.facts?.releaseDate ?? null,
    recency_date: track.facts?.releaseDate ?? null,
    open: false,
    status: 'confirmed',
    source_tier: sourceTierFrom(track.sources),
    sources: track.sources ?? [],
    era_id: eraId,
    symbols: symbolsIn(`${track.title} ${text}`, lexicon),
    entities: [],
    expires_at: null,
    redline_ok: true,
  };
}

// Theory.outcome -> knowledge_doc.status: current_item's status vocabulary
// (rumor|reported|confirmed|debunked|faded) is the closest existing enum, so
// it's reused here for consistency rather than inventing a 6th vocabulary.
// `partially_confirmed`/`unfalsifiable` don't map cleanly onto that 5-value
// set — both land on 'reported' (settled-enough to report, not a clean
// confirm/debunk); `abandoned` lands on 'faded'. Documented, not guessed.
const STATUS_BY_OUTCOME = {
  confirmed: 'confirmed',
  partially_confirmed: 'reported',
  pending: 'rumor',
  debunked: 'debunked',
  abandoned: 'faded',
  unfalsifiable: 'reported',
};
const OPEN_OUTCOMES = new Set(['pending', 'partially_confirmed']);

/** One `theory:*`/`egg:*` knowledge_doc row from a normalized Theory (normalizeTheory()'s output). */
export function buildTheoryDoc(theory, eraId, lexicon) {
  const prefix = theory.kind === 'easter_egg' ? 'egg' : 'theory';
  const text = [theory.claim, theory.evidence].filter(Boolean).join('\n\n');
  return {
    id: `${prefix}:${eraId}:${theory.slug}`,
    kind: theory.kind,
    tier: 'vault',
    title: theory.title,
    text,
    date: null, // Theory carries no clean event-date field (PLAN.md ground-truth note)
    recency_date: null,
    open: OPEN_OUTCOMES.has(theory.outcome),
    status: STATUS_BY_OUTCOME[theory.outcome] ?? 'reported',
    source_tier: sourceTierFrom(theory.sources),
    sources: theory.sources ?? [],
    era_id: eraId,
    symbols: symbolsIn(`${theory.title} ${text}`, lexicon),
    entities: [],
    expires_at: null,
    redline_ok: true,
  };
}

// egg_ledger.mechanism is a required, fixed 12-value taxonomy that Theory
// rows don't carry directly. Best-effort keyword read of the theory's own
// claim+evidence text (grounded in what was actually written, never
// invented) — order matters, first match wins; unmatched text falls back to
// 'other' rather than a forced guess.
const MECHANISM_KEYWORDS = [
  ['website', ['website', 'vault', 'puzzle', 'google search']],
  ['wardrobe', ['wardrobe', 'wore', 'outfit', 'dress', 'gown']],
  ['color', ['color', 'colour', 'palette']],
  ['number', ['numerology', 'number']],
  ['caption', ['caption']],
  ['set_design', ['set design', 'stage design', 'staging']],
  ['lyric_callback', ['lyric']],
  ['merch', ['merch', 'merchandise']],
  ['countdown', ['countdown']],
  ['social_post', ['instagram', 'tweet', 'social post']],
  ['interview', ['interview', 'said on release day', 'told']],
];

export function mechanismFrom(text) {
  const hay = text.toLowerCase();
  for (const [mechanism, keywords] of MECHANISM_KEYWORDS) {
    if (keywords.some((k) => hay.includes(k))) return mechanism;
  }
  return 'other';
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// egg_ledger.hint_date is NOT NULL but Theory carries no event-date field at
// all (PLAN.md ground-truth note). The best real date available is the
// earliest `accessed_at` across the theory's own RAW sources (when the
// content author actually verified that citation) — a genuine timestamp
// already in the data, not a fabricated one. Falls back to the era's public
// start date (supabase/seed/eras-data.mjs) only when no source carries an
// accessed_at at all. `reveal_date` is left null throughout: the seed data
// has no separate confirmation-date field to draw one from, and forcing one
// would misrepresent precision this corpus doesn't have.
export function hintDateFrom(rawSources, eraStartDate) {
  const dates = (rawSources ?? [])
    .map((s) => s?.accessed_at)
    .filter((d) => typeof d === 'string' && ISO_DATE.test(d))
    .sort();
  return dates[0] ?? eraStartDate;
}

/**
 * One egg_ledger row from a normalized, `outcome==='confirmed'` easter-egg
 * Theory. `rawSources` is the theory's UN-normalized `sources` array (the
 * shared `sourcesFrom()` helper drops `accessed_at`, which `hintDateFrom`
 * needs) — pass the raw seed-file value, not `theory.sources`.
 */
export function buildEggLedgerRow(theory, rawSources, eraId, eraStartDate, lexicon) {
  const text = [theory.claim, theory.evidence].filter(Boolean).join('\n\n');
  const id = `egg:${eraId}:${theory.slug}`;
  return {
    id,
    // The theory's own knowledge_doc row documents both the hint and the
    // confirmation in one write-up; the source data has no separate
    // reveal-specific document to point reveal_doc_id at.
    hint_doc_id: id,
    reveal_doc_id: null,
    hint_date: hintDateFrom(rawSources, eraStartDate),
    reveal_date: null,
    mechanism: mechanismFrom(text),
    symbols: symbolsIn(`${theory.title} ${text}`, lexicon),
    era_id: eraId,
    confirmed: true, // by construction: only outcome==='confirmed' rows reach this builder
    outcome: theory.outcome,
    summary: theory.claim,
    sources: theory.sources ?? [],
  };
}

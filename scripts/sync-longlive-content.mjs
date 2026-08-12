#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/content-vault.generated.ts — the
// LongLive UI's static content layer (see docs/longlive-experience.md §9).
//
// Source of truth: the local supabase/seed/content/*.mjs files — the same
// files content PRs review and merge, so merged content is live on the next
// deploy with no credentials and no operational re-seed step (decision
// 2026-07-17; supersedes the 2026-07-08 DB-first order, which served stale
// content whenever the DB wasn't re-seeded). Runs at build time (wired as
// `prebuild` in apps/web/package.json), keeping the shipped UI fully static
// per the project's cost-discipline rule.
//
// Opt-in: set LONGLIVE_SYNC_SOURCE=db to read the live Supabase `month_item`
// table first instead (public/RLS-read creds as in apps/web/.env.local — see
// docs/dev-quickstart.md), with seed files as fallback. Only useful if the DB
// ever carries content the repo doesn't (none today). Same output shape
// either way.
//
// Hand-curated items in content.ts are untouched — this only produces the
// separate VAULT_RAW export that content.ts merges in alongside them.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  ROOT,
  SLUG_TO_ERA_ID,
  SOURCE_TYPE_LITERAL,
  esc,
  loadWebEnvLocal,
  preferDbSource,
  slugify,
  sourceLiteral,
  sourcesFrom,
  supabaseEnv,
} from './lib/longlive-sync-shared.mjs';

// slugify now lives in the dependency-free shared module (so the content-engine
// can import it without @supabase/supabase-js); re-exported here because
// validate-content.mjs and other callers import it from this file.
export { slugify };
// The 8 shared confidence values (mirrors THEORY_CONFIDENCE in
// packages/shared/src/vault-types.ts). Importing the theories generator only
// pulls its pure exports — its main() is guarded behind invokedDirectly.
import { CONFIDENCE_VALUES } from './sync-longlive-theories.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'content');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'content-vault.generated.ts');

// Same column list as packages/core/src/vault.ts's Tier 0 skeleton fetch —
// keep these in sync if that query changes.
const MONTH_ITEM_COLS = 'id,era_slug,year,month,day,category,title,snippet,source_url,thumbnail_url';
const TIER0_MAX_ROWS = 2000;

const CATEGORY_TO_TAG = {
  music: 'Music',
  fashion: 'Fashion',
  tour: 'Tour',
  relationship: 'Relationship',
  sighting: 'Lore',
  business: 'Lore',
  release: 'Music',
  video: 'Music',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const VALID_TAGS = new Set(['Music', 'Fashion', 'Tour', 'Relationship', 'Lore']);

// Keep in sync with LensId (apps/web/lib/longlive/types.ts). 'love-story' and
// 'fashion' don't need explicit opt-in — they're implied by the Relationship/
// Fashion tags via defaultThreadIdsForTags() in content.ts — but a seed item
// can still list them explicitly to be thorough; either way validation here
// just guards against typos.
const VALID_THREAD_IDS = new Set([
  'love-story',
  'fashion',
  'taylors-version',
  'easter-eggs',
  'hidden-clues',
  'the-proposal',
]);

/**
 * Full editorial body: split the Tier-1 `moment.context` into paragraphs so
 * the detail view shows real prose, not the summary sentence repeated. Falls
 * back to the summary only when there's genuinely no context.
 */
function bodyFrom(context, snippet) {
  if (typeof context === 'string' && context.trim()) {
    const paras = context
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paras.length) return paras;
  }
  return [snippet];
}

/** Category tag plus any already-valid ContentTags the item carries. */
function tagsFrom(category, tags) {
  const out = [CATEGORY_TO_TAG[category] ?? 'Lore'];
  for (const t of Array.isArray(tags) ? tags : []) {
    if (VALID_TAGS.has(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

/**
 * Explicit thread opt-ins from the seed row, validated against known LensIds.
 * The tag-based defaults (Relationship -> love-story, Fashion -> fashion)
 * are applied later, in content.ts's build() — not here — so hand-curated
 * and synced items go through identical default logic. Returns undefined
 * (field omitted) when the item has no explicit opt-in, same convention as
 * relatedIdsFrom.
 */
export function threadIdsFrom(threadIds) {
  if (!Array.isArray(threadIds)) return undefined;
  const out = threadIds.filter((t) => VALID_THREAD_IDS.has(t));
  return out.length ? out : undefined;
}

const VALID_SIGNIFICANCE = new Set(['defining', 'notable']);

/**
 * How major this event was (docs/decisions.md 2026-07-18) — an explicit
 * authoring judgment, validated against the same two values ContentItem
 * accepts (lib/longlive/types.ts). Returns undefined (field omitted, meaning
 * "routine") for anything else rather than guessing, same convention as
 * threadIdsFrom/relatedIdsFrom.
 */
export function significanceFrom(significance) {
  return VALID_SIGNIFICANCE.has(significance) ? significance : undefined;
}

/**
 * Shoppable products from the Tier-1 `moment.products` array (see Product in
 * apps/web/lib/longlive/types.ts): `[{ brand, item, retailer, url, price?,
 * inStock? }]`. Keeps only rows with all four required string fields and an
 * https url (same rule validate-content.mjs enforces loudly — keep the two in
 * sync so a validate-green row can never be silently dropped here, or vice
 * versa) — validate-content.mjs errors loudly on malformed rows, this
 * just guards the generated file against shipping broken JS. `price` must be
 * a non-empty string to carry; `inStock` carries ONLY an explicit false
 * (omitted/true both mean "purchasable when authored" and stay omitted, so
 * the generated file only marks the exceptional sold-out case). Returns
 * undefined (field omitted) when nothing valid remains, same convention as
 * imagesFrom/threadIdsFrom. Exported for unit tests.
 */
export function productsFrom(products) {
  if (!Array.isArray(products)) return undefined;
  const out = [];
  for (const p of products) {
    if (!p) continue;
    const required = [p.brand, p.item, p.retailer, p.url];
    if (!required.every((v) => typeof v === 'string' && v.trim())) continue;
    if (!/^https:\/\//.test(p.url)) continue;
    // Fail closed, same shape as the validator's hard error: isAlternative
    // only survives paired with a real altNote — an unexplained "Similar
    // style" pill would be worse than none (2026-07-20, docs/decisions.md).
    const hasAltNote = typeof p.altNote === 'string' && p.altNote.trim();
    const isAlternative = p.isAlternative === true && hasAltNote;
    out.push({
      brand: p.brand,
      item: p.item,
      retailer: p.retailer,
      url: p.url,
      price: typeof p.price === 'string' && p.price.trim() ? p.price : undefined,
      inStock: p.inStock === false ? false : undefined,
      isAlternative: isAlternative ? true : undefined,
      altNote: isAlternative ? p.altNote : undefined,
    });
  }
  return out.length ? out : undefined;
}

/**
 * How well-supported the item's central claim is (the 8 shared values —
 * ContentItem.confidence in apps/web/lib/longlive/types.ts). Below the
 * confirmed tier the UI renders the unmissable "Rumor — unconfirmed" /
 * "Reported — not confirmed" banner. Unknown values return undefined (field
 * omitted = confirmed fact, no banner) — the validator makes a typo a hard
 * error, same split as significanceFrom.
 */
export function confidenceFrom(confidence) {
  return CONFIDENCE_VALUES.has(confidence) ? confidence : undefined;
}

/** Mirrors RumorStatus in apps/web/lib/longlive/types.ts. */
export const RUMOR_STATUSES = new Set([
  'unconfirmed',
  'partially_confirmed',
  'confirmed',
  'debunked',
  // The honest end-state for a claim that was reported, never confirmed,
  // never denied, and went quiet (2026-07-20, docs/content-ops/rumor-pipeline.md).
  'faded',
]);

/** Mirrors RumorSourceTier in apps/web/lib/longlive/types.ts. */
export const RUMOR_SOURCE_TIERS = new Set(['official', 'established', 'tabloid', 'social']);

/**
 * Mirrors LocationSpecificity. No 'address' member on purpose — L3 is never
 * publishable at any provenance (privacy-redlines.md Never-OK #1).
 */
export const LOCATION_SPECIFICITY = new Set(['region', 'city', 'venue']);

/** Statuses whose claim is settled, and therefore need a citation to back it. */
export const RESOLVED_RUMOR_STATUSES = new Set(['confirmed', 'debunked']);

const RUMOR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalizes seed `moment.rumors` entries into the UI's RumorNote shape
 * (apps/web/lib/longlive/types.ts). Everything that keeps a rumor honest —
 * claim, reporting outlet, report date, status, link — is REQUIRED; an entry
 * missing any of them is dropped rather than guessed at (the theories
 * generator's rule). The validator makes those drops hard errors so they
 * can't pass CI silently. Returns undefined (field omitted) when nothing
 * valid remains. Exported for unit tests.
 */
export function rumorsFrom(rumors) {
  if (!Array.isArray(rumors)) return undefined;
  const out = [];
  for (const r of rumors) {
    if (!r || typeof r !== 'object') continue;
    const trim = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    const claim = trim(r.claim);
    const reportedBy = trim(r.reportedBy);
    const reportedOn = trim(r.reportedOn);
    const url = trim(r.url);
    if (!claim || !reportedBy || !url) continue;
    if (!reportedOn || !RUMOR_DATE_RE.test(reportedOn)) continue;
    if (!RUMOR_STATUSES.has(r.status)) continue;

    // A settled claim without a citation is just an opinion, so drop the
    // resolution rather than render "Since confirmed" backed by nothing. The
    // validator makes this a hard error so it cannot pass CI silently.
    let resolution;
    const res = r.resolution;
    if (res && typeof res === 'object') {
      const on = trim(res.on);
      const url2 = trim(res.url);
      const outlet = trim(res.outlet);
      if (on && RUMOR_DATE_RE.test(on) && url2 && outlet) {
        resolution = { on, url: url2, outlet, note: trim(res.note) };
      }
    }

    const lastCheckedOn = trim(r.lastCheckedOn);
    out.push({
      claim,
      reportedBy,
      reportedOn,
      status: r.status,
      url,
      note: trim(r.note),
      lastCheckedOn: lastCheckedOn && RUMOR_DATE_RE.test(lastCheckedOn) ? lastCheckedOn : undefined,
      resolution,
      sourceTier: RUMOR_SOURCE_TIERS.has(r.sourceTier) ? r.sourceTier : undefined,
      locationSpecificity: LOCATION_SPECIFICITY.has(r.locationSpecificity)
        ? r.locationSpecificity
        : undefined,
    });
  }
  return out.length ? out : undefined;
}

/** Allowed ImageRef.kind values (apps/web/lib/longlive/types.ts ImageKind). */
const IMAGE_KINDS = new Set(['primary', 'reference', 'archival']);

/**
 * Builds the ImageRef[] gallery for one item from its `thumbnail_url` (the
 * moment's real photo → kind 'primary', always first) plus the Tier-1
 * `moment.photos` JSON array (`[{url, credit}]` per the DB schema; a photo
 * may also carry an explicit `caption`/`kind` — unknown kinds default to
 * 'archival' so a stand-in never silently reads as the real photo). De-dupes
 * by url; when a photo repeats the thumbnail url its credit/caption are
 * merged into the primary instead of being dropped. Returns undefined (field
 * omitted) when there is no imagery at all — the engine's build() then falls
 * back to era art. Exported for unit tests.
 */
export function imagesFrom(thumbnailUrl, photos) {
  const byUrl = new Map();
  if (typeof thumbnailUrl === 'string' && thumbnailUrl.trim()) {
    byUrl.set(thumbnailUrl, { url: thumbnailUrl, kind: 'primary' });
  }
  for (const p of Array.isArray(photos) ? photos : []) {
    if (!p || typeof p.url !== 'string' || !p.url.trim()) continue;
    const credit = typeof p.credit === 'string' && p.credit.trim() ? p.credit : undefined;
    const caption = typeof p.caption === 'string' && p.caption.trim() ? p.caption : undefined;
    const focalPoint =
      typeof p.focalPoint === 'string' && p.focalPoint.trim() ? p.focalPoint.trim() : undefined;
    const existing = byUrl.get(p.url);
    if (existing) {
      existing.credit ??= credit;
      existing.caption ??= caption;
      existing.focalPoint ??= focalPoint;
    } else {
      byUrl.set(p.url, {
        url: p.url,
        credit,
        caption,
        kind: IMAGE_KINDS.has(p.kind) ? p.kind : 'archival',
        focalPoint,
      });
    }
  }
  const out = [...byUrl.values()];
  return out.length ? out : undefined;
}

/**
 * Namespaced cross-links (`motif:…`, `egg:…`, `moment:…`, `rel:…` — see
 * RelatedId in apps/web/lib/longlive/types.ts). Keep only well-formed
 * `<type>:<id>` strings; the UI additionally resolves each id against the
 * live datasets and drops anything unresolvable, so a stale link can never
 * render. Returns undefined (field omitted) when nothing valid remains.
 */
function relatedIdsFrom(relatedIds) {
  if (!Array.isArray(relatedIds)) return undefined;
  const out = relatedIds.filter(
    (r) => typeof r === 'string' && /^[a-z]+:.+/.test(r),
  );
  return out.length ? out : undefined;
}

/**
 * Valid `MilestoneKind` values — must stay in step with the union in
 * apps/web/lib/longlive/types.ts. `fandom` (2026-08-11) covers documented
 * fan-community events; see docs/proposals/2026-08-11-facebook-groups-signal.md.
 */
export const MILESTONE_KINDS = ['album', 'tour', 'life', 'business', 'award', 'fandom'];

/**
 * Era-timeline milestone marker. All three fields are required or the marker
 * is dropped — but a marker that was clearly *meant* to exist (it has an id
 * and a label) and only fails on an unrecognized `kind` now says so on stderr
 * instead of vanishing silently. That silent drop meant a typo'd or
 * not-yet-registered kind removed a milestone from the scrubber with no
 * signal anywhere; same failure shape as the auto-merge gate that logged and
 * exited 0 (docs/decisions.md, 2026-08-11). Still non-fatal: this script is
 * shared by every content PR, so a bad marker must not break the pipeline.
 */
function milestoneFrom(milestone, slug) {
  if (!milestone || typeof milestone !== 'object') return undefined;
  const { id, label, kind } = milestone;
  const named = typeof id === 'string' && id && typeof label === 'string' && label;
  if (!named) return undefined;
  if (!MILESTONE_KINDS.includes(kind)) {
    console.warn(
      `sync-longlive-content: DROPPED milestone "${id}" on "${slug}" — unrecognized kind ${JSON.stringify(kind)}. ` +
        `Expected one of: ${MILESTONE_KINDS.join(', ')}. Add it to MILESTONE_KINDS and to MilestoneKind in apps/web/lib/longlive/types.ts.`,
    );
    return undefined;
  }
  return { id, label, kind };
}

/** Appends one normalized item to byEra, de-duping ids within the era. */
export function addItem(
  byEra,
  seenIdsByEra,
  eraSlug,
  {
    year,
    month,
    day,
    category,
    title,
    snippet,
    context,
    sources,
    sourceUrl,
    thumbnailUrl,
    photos,
    slug,
    tags,
    threadIds,
    video,
    socialPost,
    relatedIds,
    significance,
    products,
    confidence,
    rumors,
    dateLabel: dateLabelOverride,
    hiddenClue,
    milestone,
    pullQuote,
  },
) {
  const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
  const seenIds = (seenIdsByEra[eraId] ??= new Set());

  const baseId = `vault-${eraId}-${slugify(title)}`;
  let id = baseId;
  let n = 2;
  while (seenIds.has(id)) {
    id = `${baseId}-${n++}`;
  }
  seenIds.add(id);

  // `day` is optional — most items are still only known to month precision.
  // When present (1-31, validated), the item gets a real calendar date and
  // dateLabel ("July 9, 2026"); otherwise falls back to the 1st of the month
  // for sort/positioning purposes only, with a month-level label ("July
  // 2026") so the UI never implies false day-precision.
  const validDay = Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
  const mm = String(month).padStart(2, '0');
  const dd = String(validDay ?? 1).padStart(2, '0');
  const date = `${year}-${mm}-${dd}`;
  // Editorial period labels ("Spring 2007", "Fall 2012") — an explicit
  // dateLabel on the seed row overrides the computed one. Added 2026-07-19
  // for the content.ts→seed migration: period moments carry representative
  // placeholder dates for sort position, and their labels deliberately avoid
  // implying day- or even month-precision nobody researched (#717).
  const dateLabel =
    typeof dateLabelOverride === 'string' && dateLabelOverride.trim()
      ? dateLabelOverride.trim()
      : validDay
        ? `${MONTHS[month - 1]} ${validDay}, ${year}`
        : `${MONTHS[month - 1]} ${year}`;

  const hasVideo =
    video && typeof video.youtubeId === 'string' && video.youtubeId && typeof video.title === 'string' && video.title;

  // A social post the moment is ABOUT (issue #1074). Shortcode + label are both
  // required or the whole field is dropped: a facade with no label is a blank
  // grey box, and a facade with no shortcode has nothing to open.
  const hasSocialPost =
    socialPost &&
    socialPost.platform === 'instagram' &&
    typeof socialPost.shortcode === 'string' &&
    /^[A-Za-z0-9_-]+$/.test(socialPost.shortcode) &&
    typeof socialPost.label === 'string' &&
    socialPost.label.trim();

  (byEra[eraId] ??= []).push({
    id,
    slug: typeof slug === 'string' && slug ? slug : undefined,
    date,
    dateLabel,
    title,
    summary: snippet,
    body: bodyFrom(context, snippet),
    tags: tagsFrom(category, tags),
    images: imagesFrom(thumbnailUrl, photos),
    sources: sourcesFrom(sources, sourceUrl),
    video: hasVideo ? { youtubeId: video.youtubeId, title: video.title } : undefined,
    socialPost: hasSocialPost
      ? {
          platform: socialPost.platform,
          shortcode: socialPost.shortcode,
          label: socialPost.label,
          ...(typeof socialPost.postedOn === 'string' && socialPost.postedOn
            ? { postedOn: socialPost.postedOn }
            : {}),
        }
      : undefined,
    // Hidden-clue payoffs (types.ts HiddenClue) — piped through for the
    // content.ts→seed migration (2026-07-19); both fields required or dropped.
    hiddenClue:
      hiddenClue && typeof hiddenClue.clue === 'string' && hiddenClue.clue.trim() && typeof hiddenClue.payoff === 'string' && hiddenClue.payoff.trim()
        ? { clue: hiddenClue.clue, payoff: hiddenClue.payoff }
        : undefined,
    // Era-timeline milestone marker (stage 2b): content.ts derives MILESTONES
    // from these. All three fields required (kind validated) or dropped.
    milestone: milestoneFrom(milestone, slug),
    // Thread-card pull-quote (stage 3): a caption/lyric/statement string.
    pullQuote: typeof pullQuote === 'string' && pullQuote.trim() ? pullQuote.trim() : undefined,
    relatedIds: relatedIdsFrom(relatedIds),
    threadIds: threadIdsFrom(threadIds),
    significance: significanceFrom(significance),
    products: productsFrom(products),
    confidence: confidenceFrom(confidence),
    rumors: rumorsFrom(rumors),
  });
}

/** Live source: the Supabase month_item table. Returns null if unreachable/unconfigured. */
async function fetchFromSupabase() {
  const env = supabaseEnv();
  if (!env) {
    console.log('sync-longlive-content: no Supabase env, falling back to local seed files.');
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('month_item')
    .select(MONTH_ITEM_COLS)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('id', { ascending: true })
    .limit(TIER0_MAX_ROWS);

  if (error) {
    console.warn(`sync-longlive-content: Supabase fetch failed (${error.message}), falling back to local seed files.`);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn('sync-longlive-content: Supabase returned 0 month_items, falling back to local seed files.');
    return null;
  }
  if (data.length >= TIER0_MAX_ROWS) {
    // A `.limit()` hit means this is a partial page, not the full table —
    // writing it as VAULT_RAW would silently ship truncated content. Treat
    // it as a failed live fetch (same as the runtime client's explicit cap
    // check in packages/core/src/vault.ts) and fall back to the complete
    // local seed files instead.
    console.warn(
      `sync-longlive-content: Supabase month_item hit the ${TIER0_MAX_ROWS}-row cap — result would be truncated, falling back to local seed files.`,
    );
    return null;
  }

  // Tier-1 detail (moment.context + sources + photos) in ONE query, mapped by
  // month_item_id. This is what stops the live site from showing the summary
  // repeated as its own body, and gives every moment its citations + gallery.
  const momentByItem = new Map();
  {
    const { data: moments, error: mErr } = await supabase
      .from('moment')
      .select('month_item_id,context,sources,photos');
    if (mErr) {
      console.warn(
        `sync-longlive-content: moment fetch failed (${mErr.message}); bodies fall back to summaries.`,
      );
    } else {
      for (const m of moments ?? []) momentByItem.set(m.month_item_id, m);
    }
  }

  const byEra = {};
  const seenIdsByEra = {};
  for (const row of data) {
    const m = momentByItem.get(row.id);
    addItem(byEra, seenIdsByEra, row.era_slug, {
      year: row.year,
      month: row.month,
      day: row.day,
      category: row.category,
      title: row.title,
      snippet: row.snippet,
      context: m?.context ?? null,
      sources: m?.sources ?? null,
      sourceUrl: row.source_url ?? null,
      thumbnailUrl: row.thumbnail_url ?? null,
      photos: m?.photos ?? null,
      // month_item has no slug/tags/video/related_ids/thread_ids column in
      // the DB — those live only in the seed files (see fetchFromLocalFiles).
      // Carrying them to live data needs a schema migration; tracked as a
      // follow-up in the PR. Category-based thread defaults (Relationship ->
      // love-story, Fashion -> fashion) still apply to live-fetched items,
      // since those derive from `tags` in content.ts's build(), not from
      // this explicit threadIds field — only the *explicit* opt-in for the
      // other four threads is unavailable on live data until that migration.
      // `significance` (2026-07-18) joins this same list: the column exists
      // in the migration (supabase/migrations/20260718150000_month_item_
      // significance.sql) but this SELECT isn't wired to read it yet — same
      // follow-up, not done here since the live site reads seed files first
      // anyway (docs/decisions.md, 2026-07-17).
      // `confidence` + `moment.rumors` (2026-07-19, the rumor tier) are also
      // seed-only until that migration lands — same follow-up list, but with
      // a sharper edge: losing them doesn't just degrade navigation, it
      // strips the "not confirmed" labels, so reported claims would render
      // as fact. Hence the loud warning below, not just this comment.
      // `products` (2026-07-19, shoppable links) also has no moment-table
      // column yet — seed-only, same follow-up bucket.
    });
  }

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`sync-longlive-content: loaded ${total} items from Supabase (live).`);
  console.warn(
    'sync-longlive-content: WARNING — the DB path carries no confidence/rumors columns yet, ' +
      'so a DB-sourced build STRIPS every "Reported — not confirmed" banner and "What\'s rumored" ' +
      'section; sub-confirmed claims would render as fact. Do not deploy a db-sourced vault ' +
      'until the month_item/moment migration lands (docs/decisions.md 2026-07-19).',
  );
  return byEra;
}

/**
 * Projects one seed `item` into the flat argument object addItem() expects,
 * resolving each field to its authored home. This is the CALLER link of the
 * chain — the one that has silently dropped a field five times now
 * (significance, moment cross-links, rumor lifecycle, socialPost, and #846's
 * `moment.video`): the type, normalizer, validator, serializer and UI were
 * all correct every time, and the vault still received nothing because this
 * projection never read the field. It's exported and pure specifically so a
 * test can feed it a seed-shaped item and assert the value survives to the
 * emitted source — a test on addItem()/buildOutputSource() alone cannot catch
 * a bug here, since those links already handle every field. Every optional
 * field authored at the moment level needs an explicit read below.
 */
export function seedItemToInput(item) {
  return {
    year: item.year,
    month: item.month,
    day: item.day ?? null,
    category: item.category,
    title: item.title,
    snippet: item.snippet,
    context: item.moment?.context ?? null,
    sources: item.moment?.sources ?? null,
    sourceUrl: item.sourceUrl ?? null,
    thumbnailUrl: item.thumbnailUrl ?? null,
    photos: item.moment?.photos ?? null,
    slug: item.slug ?? null,
    tags: item.tags ?? null,
    threadIds: item.threadIds ?? null,
    // Accepted at EITHER level, like relatedIds/socialPost below (#846): the
    // clip reads as item metadata to one author and as Tier-1 moment detail to
    // another. Reading only `item.video` here is exactly what silently dropped
    // the 3 real `moment.video` clips in the-life-of-a-showgirl.mjs (Fate of
    // Ophelia MV, Elizabeth Taylor supercut, the songwriting interview) — the
    // video type, addItem() and the serializer were all correct; this line was
    // the sole missing link.
    video: item.video ?? item.moment?.video ?? null,
    // Accepted at EITHER level, like relatedIds below: the post reads as
    // item metadata to one author and as Tier-1 moment detail to another.
    // Missing this line is what made the field vanish on first build —
    // the type, normalizer, validator, serializer and UI were all correct
    // and the vault still received nothing, because the CALLER never
    // passed it. Fourth time this repo has lost a field in exactly one
    // link of that chain.
    socialPost: item.socialPost ?? item.moment?.socialPost ?? null,
    // Cross-links may live on the item or its Tier-1 moment detail —
    // accept either so the content lane can pick the natural home.
    relatedIds: item.relatedIds ?? item.moment?.relatedIds ?? null,
    significance: item.significance ?? null,
    // Tier-1 detail like photos/sources — products live on the moment.
    products: item.moment?.products ?? null,
    // Like relatedIds, confidence/rumors are accepted at EITHER level —
    // confidence naturally reads as item metadata, rumors as Tier-1
    // moment detail, but a mixed-up placement must not fail open (a
    // silently-ignored honesty label is the worst outcome this feature
    // has). validate-content.mjs checks both spots the same way.
    confidence: item.confidence ?? item.moment?.confidence ?? null,
    rumors: item.moment?.rumors ?? item.rumors ?? null,
    // Editorial period labels + hidden-clue payoffs (stage-2a migration,
    // 2026-07-19) — item-level seed fields, piped to addItem's handling.
    dateLabel: item.dateLabel ?? null,
    hiddenClue: item.hiddenClue ?? null,
    milestone: item.milestone ?? null,
    pullQuote: item.pullQuote ?? null,
  };
}

/** Fallback source: the local supabase/seed/content/*.mjs files. */
async function fetchFromLocalFiles() {
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && f !== '_example.mjs');

  const byEra = {};
  const seenIdsByEra = {};

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, items } = mod.default;

    for (const item of items) {
      addItem(byEra, seenIdsByEra, item.eraSlug ?? eraSlug, seedItemToInput(item));
    }
  }

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`sync-longlive-content: loaded ${total} items from local seed files (source of truth).`);
  return byEra;
}

/**
 * Renders the full generated-file source from normalized byEra data. Pure
 * (no I/O) so a test can assert on the actual emitted text, not just the
 * intermediate objects addItem() builds — that gap (a field present on the
 * object but never given a `lines.push` line here) is exactly how
 * `significance` shipped silently broken on 2026-07-18: addItem() computed
 * it correctly, nothing emitted it into the file, and nothing caught that
 * until it was checked on the live site. Every optional field needs BOTH an
 * addItem() line AND a line here — there is no generic fallthrough
 * serialization.
 */
export function buildOutputSource(byEra) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-content.mjs from supabase/seed/content/**.');
  lines.push("// Re-run that script after content-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { Confidence, ContentTag, EraId, HiddenClue, ImageRef, LensId, MilestoneKind, Product, RumorNote, SocialPost } from './types';");
  lines.push('');
  // Freshness stamp — emitted ONLY during `prebuild` (the deploy build, where
  // npm sets npm_lifecycle_event=prebuild), never into the committed file.
  // Regenerating for commits, CI, or the check:generated guard leaves it out,
  // so the vault is byte-for-byte deterministic and parallel content PRs can't
  // collide on a per-run timestamp. In production, prebuild stamps the real
  // deploy time; contentGeneratedAt() (lib/longlive/freshness.ts) returns null
  // when the export is absent (dev/committed) and the UI just omits the label.
  if (process.env.npm_lifecycle_event === 'prebuild') {
    lines.push('/** Build-time freshness stamp — emitted only by prebuild (deploy). */');
    lines.push(`export const CONTENT_GENERATED_AT = ${esc(new Date().toISOString())};`);
    lines.push('');
  }
  lines.push('type VaultRawItem = {');
  lines.push('  id: string;');
  lines.push('  slug?: string;');
  lines.push('  date: string;');
  lines.push('  dateLabel: string;');
  lines.push('  title: string;');
  lines.push('  summary: string;');
  lines.push('  body: string[];');
  lines.push('  tags: ContentTag[];');
  lines.push('  images?: ImageRef[];');
  lines.push(`  sources?: ${SOURCE_TYPE_LITERAL}[];`);
  lines.push('  video?: { youtubeId: string; title: string };');
  lines.push('  socialPost?: SocialPost;');
  lines.push('  hiddenClue?: HiddenClue;');
  lines.push('  milestone?: { id: string; label: string; kind: MilestoneKind };');
  lines.push('  pullQuote?: string;');
  lines.push('  relatedIds?: string[];');
  lines.push('  threadIds?: LensId[];');
  lines.push("  significance?: 'defining' | 'notable';");
  lines.push('  products?: Product[];');
  lines.push('  confidence?: Confidence;');
  lines.push('  rumors?: RumorNote[];');
  lines.push('};');
  lines.push('');
  lines.push('export const VAULT_RAW: Partial<Record<EraId, VaultRawItem[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const it of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      id: ${esc(it.id)},`);
      if (it.slug) lines.push(`      slug: ${esc(it.slug)},`);
      lines.push(`      date: ${esc(it.date)},`);
      lines.push(`      dateLabel: ${esc(it.dateLabel)},`);
      lines.push(`      title: ${esc(it.title)},`);
      lines.push(`      summary: ${esc(it.summary)},`);
      lines.push(`      body: [${it.body.map(esc).join(', ')}],`);
      lines.push(`      tags: [${it.tags.map(esc).join(', ')}],`);
      if (it.images && it.images.length) {
        const imgs = it.images
          .map((im) => {
            const parts = [`url: ${esc(im.url)}`];
            if (im.credit) parts.push(`credit: ${esc(im.credit)}`);
            if (im.caption) parts.push(`caption: ${esc(im.caption)}`);
            parts.push(`kind: ${esc(im.kind)}`);
            if (im.focalPoint) parts.push(`focalPoint: ${esc(im.focalPoint)}`);
            return `{ ${parts.join(', ')} }`;
          })
          .join(', ');
        lines.push(`      images: [${imgs}],`);
      }
      if (it.sources && it.sources.length) {
        const srcs = it.sources.map(sourceLiteral).join(', ');
        lines.push(`      sources: [${srcs}],`);
      }
      if (it.video) {
        lines.push(`      video: { youtubeId: ${esc(it.video.youtubeId)}, title: ${esc(it.video.title)} },`);
      }
      // If you add a socialPost field, add it in BOTH the normalizer above and
      // here. Dropping the emit is the bug that has shipped three times in this
      // repo (significance, moment cross-links, rumor lifecycle) — every time
      // the type, normalizer, validator and UI were all correct and the page
      // still received nothing.
      if (it.socialPost) {
        const sp = it.socialPost;
        const parts = [
          `platform: ${esc(sp.platform)}`,
          `shortcode: ${esc(sp.shortcode)}`,
          `label: ${esc(sp.label)}`,
        ];
        if (sp.postedOn) parts.push(`postedOn: ${esc(sp.postedOn)}`);
        lines.push(`      socialPost: { ${parts.join(', ')} },`);
      }
      if (it.hiddenClue) {
        lines.push(`      hiddenClue: { clue: ${esc(it.hiddenClue.clue)}, payoff: ${esc(it.hiddenClue.payoff)} },`);
      }
      if (it.milestone) {
        lines.push(`      milestone: { id: ${esc(it.milestone.id)}, label: ${esc(it.milestone.label)}, kind: ${esc(it.milestone.kind)} },`);
      }
      if (it.pullQuote) {
        lines.push(`      pullQuote: ${esc(it.pullQuote)},`);
      }
      if (it.relatedIds && it.relatedIds.length) {
        lines.push(`      relatedIds: [${it.relatedIds.map(esc).join(', ')}],`);
      }
      if (it.threadIds && it.threadIds.length) {
        lines.push(`      threadIds: [${it.threadIds.map(esc).join(', ')}],`);
      }
      // Bug found live 2026-07-18 (docs/decisions.md): addItem() computed
      // this field correctly but the writer never had a line to emit it,
      // so every synced item's significance was silently dropped from the
      // generated file — msg-wedding never actually rendered as hero on
      // the live site despite being marked 'defining' in the seed. Every
      // optional field needs BOTH an addItem() line AND a writer line here;
      // there is no generic fallthrough serialization in this file.
      if (it.significance) {
        lines.push(`      significance: ${esc(it.significance)},`);
      }
      if (it.products && it.products.length) {
        const prods = it.products
          .map((p) => {
            const parts = [
              `brand: ${esc(p.brand)}`,
              `item: ${esc(p.item)}`,
              `retailer: ${esc(p.retailer)}`,
              `url: ${esc(p.url)}`,
            ];
            if (p.price) parts.push(`price: ${esc(p.price)}`);
            if (p.inStock === false) parts.push('inStock: false');
            if (p.isAlternative) parts.push('isAlternative: true');
            if (p.altNote) parts.push(`altNote: ${esc(p.altNote)}`);
            return `{ ${parts.join(', ')} }`;
          })
          .join(', ');
        lines.push(`      products: [${prods}],`);
      }
      if (it.confidence) {
        lines.push(`      confidence: ${esc(it.confidence)},`);
      }
      if (it.rumors && it.rumors.length) {
        lines.push('      rumors: [');
        for (const r of it.rumors) {
          const parts = [
            `claim: ${esc(r.claim)}`,
            `reportedBy: ${esc(r.reportedBy)}`,
            `reportedOn: ${esc(r.reportedOn)}`,
            `status: ${esc(r.status)}`,
            `url: ${esc(r.url)}`,
          ];
          if (r.note) parts.push(`note: ${esc(r.note)}`);
          // Lifecycle fields (2026-07-20). These were added to the type, the
          // normalizer, the validator and the UI on the same day — but NOT
          // here, so every one of them was silently dropped on the way to the
          // built vault and rendered nowhere. Same failure as the moment
          // cross-links: authored data that cannot reach the page. If you add
          // a RumorNote field, add it in BOTH rumorsFrom() and here.
          if (r.sourceTier) parts.push(`sourceTier: ${esc(r.sourceTier)}`);
          if (r.lastCheckedOn) parts.push(`lastCheckedOn: ${esc(r.lastCheckedOn)}`);
          if (r.locationSpecificity)
            parts.push(`locationSpecificity: ${esc(r.locationSpecificity)}`);
          if (r.resolution) {
            const res = [
              `on: ${esc(r.resolution.on)}`,
              `url: ${esc(r.resolution.url)}`,
              `outlet: ${esc(r.resolution.outlet)}`,
            ];
            if (r.resolution.note) res.push(`note: ${esc(r.resolution.note)}`);
            parts.push(`resolution: { ${res.join(', ')} }`);
          }
          lines.push(`        { ${parts.join(', ')} },`);
        }
        lines.push('      ],');
      }
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  await loadWebEnvLocal();
  const byEra = preferDbSource()
    ? ((await fetchFromSupabase()) ?? (await fetchFromLocalFiles()))
    : await fetchFromLocalFiles();

  const source = buildOutputSource(byEra);
  await writeFile(OUT_FILE, source, 'utf-8');

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`Synced ${total} items across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`);
}

// Only write output when invoked directly (`node scripts/sync-longlive-content.mjs`
// or the prebuild step) — importing this module in tests just pulls in the
// pure normalization functions above. Same guard as the other sync scripts.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

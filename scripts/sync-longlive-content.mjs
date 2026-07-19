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
  esc,
  loadWebEnvLocal,
  preferDbSource,
  sourcesFrom,
  supabaseEnv,
} from './lib/longlive-sync-shared.mjs';
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

// Exported so validate-content.mjs can compute the same vault ids this
// script generates, to check moment: relatedIds actually resolve (found in
// review, 2026-07-19 — a wrong eraId prefix here previously shipped silently,
// since relatedIds resolution is best-effort and never errors at runtime).
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

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
]);

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
    out.push({ claim, reportedBy, reportedOn, status: r.status, url, note: trim(r.note) });
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
    relatedIds,
    significance,
    confidence,
    rumors,
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
  const dateLabel = validDay
    ? `${MONTHS[month - 1]} ${validDay}, ${year}`
    : `${MONTHS[month - 1]} ${year}`;

  const hasVideo =
    video && typeof video.youtubeId === 'string' && video.youtubeId && typeof video.title === 'string' && video.title;

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
    relatedIds: relatedIdsFrom(relatedIds),
    threadIds: threadIdsFrom(threadIds),
    significance: significanceFrom(significance),
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
      // seed-only until that migration lands — same follow-up list.
    });
  }

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`sync-longlive-content: loaded ${total} items from Supabase (live).`);
  return byEra;
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
      addItem(byEra, seenIdsByEra, item.eraSlug ?? eraSlug, {
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
        video: item.video ?? null,
        // Cross-links may live on the item or its Tier-1 moment detail —
        // accept either so the content lane can pick the natural home.
        relatedIds: item.relatedIds ?? item.moment?.relatedIds ?? null,
        significance: item.significance ?? null,
        confidence: item.confidence ?? null,
        // Rumors are Tier-1 detail, so they live on the seed row's `moment`.
        rumors: item.moment?.rumors ?? null,
      });
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
  lines.push("import type { Confidence, ContentTag, EraId, ImageRef, LensId, RumorNote } from './types';");
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
  lines.push('  sources?: { name: string; url: string }[];');
  lines.push('  video?: { youtubeId: string; title: string };');
  lines.push('  relatedIds?: string[];');
  lines.push('  threadIds?: LensId[];');
  lines.push("  significance?: 'defining' | 'notable';");
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
        const srcs = it.sources.map((s) => `{ name: ${esc(s.name)}, url: ${esc(s.url)} }`).join(', ');
        lines.push(`      sources: [${srcs}],`);
      }
      if (it.video) {
        lines.push(`      video: { youtubeId: ${esc(it.video.youtubeId)}, title: ${esc(it.video.title)} },`);
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

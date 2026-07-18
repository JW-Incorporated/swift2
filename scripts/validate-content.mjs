// Validate Vault seed content against the DB constraints and the timeline model
// BEFORE it is seeded — CI runs this so a bad row can't reach prod (the seed
// scripts write straight to the shared Supabase project). Pure file check: no
// DB, no secrets.
//
//   npm run validate:content
//
// Checks each item in supabase/seed/content/*.mjs:
//   - eraSlug is a real era (from eras-data.mjs)
//   - year is an int; month is 1..12
//   - category is one of the month_item CHECK values
//   - title present; snippet <= 400 (DB CHECK); moment.context <= 2000 (DB CHECK)
//   - has at least one source (link-first model) ...................... WARN
//   - (year,month) falls within the era's month span so it renders ..... WARN
//     (matches monthsInEra(): inclusive of the partial start/end months)
//
// Also checks the non-month-scoped types (audit 2026-07-08 §4b) in
// supabase/seed/{releases,tours,theories,videos}/*.mjs:
//   - stable kebab slug, unique per type; known eraSlug
//   - enums (kind / confidence / outcome / source_type / media kind+rights)
//   - length caps mirroring the DB CHECKs (note/claim/summary <= 400,
//     evidence/symbolism <= 2000, source excerpt <= 300 — audit §5 hard cap)
//   - >= 1 source on EVERY record (hard rule for the new types) ....... ERROR
//   - theories: confidence + outcome REQUIRED so nothing renders as fact
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', 'supabase', 'seed');

// Keep in sync with the month_item.category CHECK constraint (migrations).
const CATEGORIES = new Set([
  'sighting',
  'fashion',
  'relationship',
  'tour',
  'business',
  'music',
  'release',
  'video',
]);

// Keep in sync with ContentItem.significance (apps/web/lib/longlive/types.ts)
// and the month_item.significance CHECK constraint (migrations). Found in
// review (2026-07-18): the sync script silently drops an unrecognized
// significance value to "routine" (defensive, correct for the generator),
// but with no validator check here that meant a typo like 'defineing'
// passed CI clean and silently lost the item's prominence — exactly the
// failure mode this field exists to prevent. This makes it a hard error.
const SIGNIFICANCE_VALUES = new Set(['defining', 'notable']);

// Keep in sync with packages/shared/src/vault-types.ts + the new-type
// migration CHECK constraints.
const RELEASE_KINDS = new Set(['album', 'rerecording', 'ep', 'deluxe', 'single', 'live']);
const VIDEO_KINDS = new Set([
  'music_video',
  'lyric_video',
  'short_film',
  'tour_film',
  'documentary',
  'performance',
]);
const THEORY_KINDS = new Set(['easter_egg', 'theory']);
const THEORY_CONFIDENCE = new Set([
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
]);
const THEORY_OUTCOMES = new Set([
  'confirmed',
  'partially_confirmed',
  'pending',
  'debunked',
  'abandoned',
  'unfalsifiable',
]);
const SOURCE_TYPES = new Set([
  'official',
  'interview',
  'reputable_press',
  'chart_database',
  'awards_database',
  'fashion_database',
  'fan_forum',
  'wiki',
  'social',
  'video',
  'image_source',
]);
const MEDIA_KINDS = new Set(['oembed', 'owned', 'hotlink_legacy']);
const MEDIA_RIGHTS = new Set(['platform_tos', 'licensed', 'hotlink_legacy']);

// Keep in sync with LensId (apps/web/lib/longlive/types.ts) and
// VALID_THREAD_IDS (sync-longlive-content.mjs). An unknown value here is
// always an authoring typo — sync-longlive-content.mjs silently drops
// unknown threadIds so a bad build doesn't ship broken JS, but that means a
// typo would otherwise fail closed (item just doesn't join the thread) with
// no signal. Catching it here as a hard error is what gives that signal.
const THREAD_IDS = new Set([
  'love-story',
  'fashion',
  'taylors-version',
  'easter-eggs',
  'hidden-clues',
  'the-proposal',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EXCERPT_CAP = 300; // audit §5 — hard cap on verbatim source excerpts

const monthIndex = (y, m) => y * 12 + (m - 1);

const { eras } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);
const eraSpan = new Map(
  eras.map((e) => [
    e.slug,
    {
      lo: monthIndex(+e.start_date.slice(0, 4), +e.start_date.slice(5, 7)),
      hi: monthIndex(+e.end_date.slice(0, 4), +e.end_date.slice(5, 7)),
    },
  ]),
);

const contentDir = join(seed, 'content');
let errors = 0;
let warnings = 0;
let checked = 0;

for (const file of readdirSync(contentDir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort()) {
  const mod = await import(pathToFileURL(join(contentDir, file)).href);
  const data = mod.default;
  const fileEra = data?.eraSlug;
  const rows = data?.items;
  if (!Array.isArray(rows)) {
    console.error(`ERROR ${file}: default export has no items[] array`);
    errors += 1;
    continue;
  }
  rows.forEach((it, i) => {
    checked += 1;
    const eraSlug = it.eraSlug ?? fileEra;
    const at = `${file}[${i}] "${String(it.title ?? '').slice(0, 42)}"`;
    const err = (msg) => {
      console.error(`ERROR ${at}: ${msg}`);
      errors += 1;
    };
    const warn = (msg) => {
      console.warn(`WARN  ${at}: ${msg}`);
      warnings += 1;
    };

    if (!eraSlug) err('missing eraSlug (not on item or file)');
    else if (!eraSpan.has(eraSlug)) err(`unknown eraSlug "${eraSlug}"`);
    if (!Number.isInteger(it.year)) err(`year is not an integer (${it.year})`);
    if (!(Number.isInteger(it.month) && it.month >= 1 && it.month <= 12))
      err(`month out of 1..12 (${it.month})`);
    if (!CATEGORIES.has(it.category))
      err(`category "${it.category}" not in ${[...CATEGORIES].join('|')}`);
    if (!it.title) err('missing title');
    if ((it.snippet ?? '').length > 400) err(`snippet ${it.snippet.length} > 400 (DB CHECK)`);
    if ((it.moment?.context ?? '').length > 2000)
      err(`moment.context ${it.moment.context.length} > 2000 (DB CHECK)`);

    if (!(it.sourceUrl || it.moment?.sources?.length > 0))
      warn('no sourceUrl and no moment.sources (link-first model)');

    if (it.threadIds != null) {
      if (!Array.isArray(it.threadIds)) err('threadIds must be an array');
      else
        for (const t of it.threadIds) {
          if (!THREAD_IDS.has(t))
            err(`threadIds contains unknown thread "${t}" — not in ${[...THREAD_IDS].join('|')}`);
        }
    }

    if (it.significance != null && !SIGNIFICANCE_VALUES.has(it.significance)) {
      err(
        `significance "${it.significance}" not in ${[...SIGNIFICANCE_VALUES].join('|')} — a typo here silently loses the item's prominence`,
      );
    }

    const span = eraSpan.get(eraSlug);
    if (span && Number.isInteger(it.year) && Number.isInteger(it.month)) {
      const mi = monthIndex(it.year, it.month);
      if (mi < span.lo || mi > span.hi)
        warn(
          `${it.year}-${String(it.month).padStart(2, '0')} is outside era "${eraSlug}" span — renders under its own section but check the date`,
        );
    }
  });
}

// ---------------------------------------------------------------------------
// Non-month-scoped types (releases / tours / theories / videos)
// ---------------------------------------------------------------------------

// Era slugs allowed on new-type records: the seeded eras plus eras the audit
// expects but that land in a separate rollout PR (the-life-of-a-showgirl in
// PR 2) — content for a pending era must not fail validation in this branch.
const PENDING_ERAS = new Set(['the-life-of-a-showgirl']);
const knownEra = (slug) => eraSpan.has(slug) || PENDING_ERAS.has(slug);

async function loadTypeDir(dirName, listKey) {
  const rows = [];
  let files;
  try {
    files = readdirSync(join(seed, dirName))
      .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
      .sort();
  } catch {
    return rows; // dir may not exist in older checkouts
  }
  for (const file of files) {
    const mod = await import(pathToFileURL(join(seed, dirName, file)).href);
    const data = mod.default;
    if (!Array.isArray(data?.[listKey])) {
      console.error(`ERROR ${dirName}/${file}: default export has no ${listKey}[] array`);
      errors += 1;
      continue;
    }
    for (const row of data[listKey])
      rows.push({ file: `${dirName}/${file}`, fileEra: data.eraSlug, row });
  }
  return rows;
}

function makeReporters(at) {
  return {
    err: (msg) => {
      console.error(`ERROR ${at}: ${msg}`);
      errors += 1;
    },
    warn: (msg) => {
      console.warn(`WARN  ${at}: ${msg}`);
      warnings += 1;
    },
  };
}

// Shared checks for slug/era/sources/media on a new-type record.
function checkCommon({ row, fileEra, file, err }, slugSeen) {
  checked += 1;
  const eraSlug = row.eraSlug ?? fileEra;
  if (!row.slug) err('missing slug (stable identity is required)');
  else if (!SLUG_RE.test(row.slug)) err(`slug "${row.slug}" is not kebab-case`);
  else if (slugSeen.has(row.slug))
    err(`duplicate slug "${row.slug}" (first seen in ${slugSeen.get(row.slug)})`);
  if (row.slug && !slugSeen.has(row.slug)) slugSeen.set(row.slug, file);
  if (!eraSlug) err('missing eraSlug (not on record or file)');
  else if (!knownEra(eraSlug)) err(`unknown eraSlug "${eraSlug}"`);
  if (!row.title) err('missing title');

  const sources = row.sources ?? [];
  if (!Array.isArray(sources) || sources.length === 0)
    err('no sources — every new-type record requires >= 1 source (hard rule)');
  for (const s of sources) {
    if (!s.source_url) err('source entry missing source_url');
    if (s.source_type != null && !SOURCE_TYPES.has(s.source_type))
      err(`source_type "${s.source_type}" not a known type`);
    if (
      s.reliability_score != null &&
      !(
        Number.isInteger(s.reliability_score) &&
        s.reliability_score >= 1 &&
        s.reliability_score <= 5
      )
    )
      err(`reliability_score ${s.reliability_score} out of 1..5`);
    if (s.accessed_at != null && !ISO_DATE_RE.test(s.accessed_at))
      err(`accessed_at "${s.accessed_at}" is not YYYY-MM-DD`);
    if ((s.excerpt ?? '').length > EXCERPT_CAP)
      err(`source excerpt ${s.excerpt.length} > ${EXCERPT_CAP} (audit §5 hard cap)`);
  }

  for (const m of row.media ?? []) {
    if (!MEDIA_KINDS.has(m.kind))
      err(`media kind "${m.kind}" not in ${[...MEDIA_KINDS].join('|')}`);
    if (!MEDIA_RIGHTS.has(m.rights))
      err(
        `media rights "${m.rights}" not in ${[...MEDIA_RIGHTS].join('|')} — every media ref needs a rights status`,
      );
    if (m.kind === 'oembed' && !m.post_url) err('oembed media entry missing post_url');
    if (m.kind === 'owned' && !(m.asset_path && m.license_ref))
      err('owned media entry missing asset_path/license_ref');
    if (m.kind === 'hotlink_legacy' && !m.url) err('hotlink_legacy media entry missing url');
  }
}

const capped = (err, label, text, cap) => {
  if ((text ?? '').length > cap) err(`${label} ${text.length} > ${cap}`);
};

// -- releases --
const releaseSlugs = new Map();
const releaseRows = await loadTypeDir('releases', 'releases');
for (const entry of releaseRows) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, releaseSlugs);
  if (!RELEASE_KINDS.has(row.kind))
    err(`kind "${row.kind}" not in ${[...RELEASE_KINDS].join('|')}`);
  if (!ISO_DATE_RE.test(row.releaseDate ?? ''))
    err(`releaseDate "${row.releaseDate}" is not YYYY-MM-DD`);
  capped(err, 'note', row.note, 400);
  if (row.tracklist != null && !Array.isArray(row.tracklist))
    err('tracklist must be an array of track titles');
  if (
    row.trackCount != null &&
    Array.isArray(row.tracklist) &&
    row.tracklist.length > 0 &&
    row.tracklist.length !== row.trackCount
  )
    err(`trackCount ${row.trackCount} != tracklist length ${row.tracklist.length}`);
}
for (const { row, file } of releaseRows) {
  if (row.parentReleaseSlug != null && !releaseSlugs.has(row.parentReleaseSlug)) {
    console.error(
      `ERROR ${file} "${row.slug}": parentReleaseSlug "${row.parentReleaseSlug}" is not a known release slug`,
    );
    errors += 1;
  }
}

// -- tours --
const tourSlugs = new Map();
for (const entry of await loadTypeDir('tours', 'tours')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, tourSlugs);
  if (!ISO_DATE_RE.test(row.openedOn ?? '')) err(`openedOn "${row.openedOn}" is not YYYY-MM-DD`);
  if (row.closedOn != null && !ISO_DATE_RE.test(row.closedOn))
    err(`closedOn "${row.closedOn}" is not YYYY-MM-DD`);
  capped(err, 'note', row.note, 400);
  capped(err, 'surpriseSongsNote', row.surpriseSongsNote, 400);
  for (const leg of row.legs ?? []) {
    if (!leg.name) err('leg missing name');
    if (!ISO_DATE_RE.test(leg.from ?? '') || !ISO_DATE_RE.test(leg.to ?? ''))
      err(`leg "${leg.name}" from/to must be YYYY-MM-DD`);
  }
  for (const show of row.shows ?? []) {
    const sAt = `show ${show.date ?? '?'}`;
    if (!ISO_DATE_RE.test(show.date ?? '')) err(`${sAt}: date is not YYYY-MM-DD`);
    if (!show.city || !show.venue) err(`${sAt}: needs city + venue (venue-level, past-tense only)`);
    capped(err, `${sAt} outfitNote`, show.outfitNote, 400);
    capped(err, `${sAt} setlistChange`, show.setlistChange, 400);
    if (show.confidence != null && !THEORY_CONFIDENCE.has(show.confidence))
      err(`${sAt}: confidence "${show.confidence}" not a known level`);
  }
}

// -- theories --
const theorySlugs = new Map();
for (const entry of await loadTypeDir('theories', 'theories')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, theorySlugs);
  if (!THEORY_KINDS.has(row.kind)) err(`kind "${row.kind}" not in ${[...THEORY_KINDS].join('|')}`);
  if (!row.claim) err('missing claim');
  capped(err, 'claim', row.claim, 400);
  capped(err, 'evidence', row.evidence, 2000);
  if (!THEORY_CONFIDENCE.has(row.confidence))
    err(
      `confidence "${row.confidence}" missing or not a known level — REQUIRED so speculation never renders as fact`,
    );
  if (!THEORY_OUTCOMES.has(row.outcome))
    err(`outcome "${row.outcome}" missing or not a known value — REQUIRED`);
  if (row.relatedSlugs != null && !Array.isArray(row.relatedSlugs))
    err('relatedSlugs must be an array');
}

// -- videos --
const videoSlugs = new Map();
for (const entry of await loadTypeDir('videos', 'videos')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, videoSlugs);
  if (!VIDEO_KINDS.has(row.kind)) err(`kind "${row.kind}" not in ${[...VIDEO_KINDS].join('|')}`);
  if (row.releasedOn != null && !ISO_DATE_RE.test(row.releasedOn))
    err(`releasedOn "${row.releasedOn}" is not YYYY-MM-DD`);
  capped(err, 'summary', row.summary, 400);
  capped(err, 'symbolism', row.symbolism, 2000);
  for (const egg of row.easterEggs ?? []) capped(err, 'easterEggs entry', egg, 400);
}

console.log(`\nvalidated ${checked} content item(s) — ${errors} error(s), ${warnings} warning(s)`);
if (errors > 0) process.exit(1);

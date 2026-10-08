// Content COVERAGE report + rights hard-gate for the Vault seed corpus.
// Companion to validate-content.mjs (row-level DB-constraint checks): this
// script reports editorial coverage (which eras/domains are thin or missing)
// and enforces the 2026-07-08 media & content sourcing policy hard lines.
// Pure file check: no DB, no secrets, no deps.
//
//   npm run content:coverage
//
// GAPS are REPORTED, never failed — missing eras, thin eras, unmodeled
// domains, weak sources, media without rights-status. The script exits
// nonzero ONLY on policy hard-fails CI must never let through:
//   - stored full lyrics (verse-like multi-line blocks in any text field)
//   - full article/statement dumps (any text field over its anti-dump ceiling
//     from scripts/lib/content-caps.mjs — 2000 chars by default, 4000 for
//     moment.context by founder decision — or a single verbatim quoted span
//     >= QUOTE_FAIL_CHARS)
//   - private-address / real-time-location / stalking data
//   - a content object without a stable identity (era slug / item natural
//     key / track natural key missing or duplicated)
//
// See docs/content/content-audit-2026-07-08.md for the thresholds' rationale.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  dumpCapFor,
  QUOTE_FAIL_CHARS,
  QUOTE_WARN_CHARS,
  SHALLOW_CONTEXT_CHARS,
} from './lib/content-caps.mjs';
import { runMain } from './lib/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', 'supabase', 'seed');

// ---------------------------------------------------------------------------
// Expectations (public record). Update when a new era/album/tour is announced.
// ---------------------------------------------------------------------------

// All 12 eras. `the-life-of-a-showgirl` (album released 2025-10-03) is the
// known-missing 12th era — expected here so the report shows the gap.
const EXPECTED_ERAS = [
  'debut',
  'fearless',
  'speak-now',
  'red',
  '1989',
  'reputation',
  'lover',
  'folklore',
  'evermore',
  'midnights',
  'tortured-poets',
  'the-life-of-a-showgirl',
];

// Released studio albums + re-recordings, matched against `album_release`
// milestone titles (substring, case-insensitive, longest pattern first so
// "Fearless (Taylor's Version)" doesn't satisfy "Fearless").
const EXPECTED_ALBUM_RELEASES = [
  "Fearless (Taylor's Version)",
  "Red (Taylor's Version)",
  "Speak Now (Taylor's Version)",
  "1989 (Taylor's Version)",
  'Taylor Swift',
  'Fearless',
  'Speak Now',
  'Red',
  '1989',
  'reputation',
  'Lover',
  'folklore',
  'evermore',
  'Midnights',
  'The Tortured Poets Department',
  'The Life of a Showgirl',
];

// Headline tours, matched against `tour` milestone titles (substring).
const EXPECTED_TOURS = [
  'Fearless Tour',
  'Speak Now World Tour',
  'The Red Tour',
  'The 1989 World Tour',
  'reputation Stadium Tour',
  'The Eras Tour',
];

// An era is "thin" below this Tier-0 item count, or with 3+ of the 7
// categories empty (both report-only; thresholds explained in the audit doc).
const THIN_ITEM_COUNT = 30;
const THIN_EMPTY_CATEGORIES = 3;

const CATEGORIES = ['music', 'release', 'fashion', 'tour', 'business', 'sighting', 'relationship'];

// Sources that never count as a strong citation on their own (fan wikis,
// aggregation boards). A record citing ONLY these is a weak-source record.
const WEAK_SOURCE_HOSTS = ['fandom.com', 'reddit.com', 'tumblr.com', 'pinterest.com'];

// Depth gate (2026-07-09 finding): sourcing alone doesn't mean a moment is
// worth clicking into. A record below this Tier-1 body length, or with no
// real photo (only a thumbnail/no photos array), reads as a caption, not
// coverage — flag it for a human depth pass rather than silently shipping
// it. Report-only, same as every other gate in this script; never a hard
// fail, since some moments genuinely don't have more to say (yet).

// ---------------------------------------------------------------------------
// Hard-fail detectors (2026-07-08 media policy)
// ---------------------------------------------------------------------------

// Lyrics dump: a verse-like block — 4+ newline-separated short lines. Pasted
// lyrics/poems arrive as multi-line template literals; editorial snippets are
// single-line prose.
function looksLikeLyricsBlock(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length >= 4 && lines.filter((l) => l.length > 0 && l.length < 60).length >= 4;
}

// Article/statement dump: any single verbatim quoted span >= QUOTE_FAIL_CHARS.
// (Today's longest sourced interview pull-quote is 422 chars; those are
// REPORTED at >= QUOTE_WARN_CHARS as excerpt-cap review items, not failed.)
function quotedSpans(text) {
  // Walk quote marks; odd-indexed segments sit inside a quoted span.
  const segs = text.split(/["“”]/);
  const spans = [];
  for (let i = 1; i < segs.length; i += 2) spans.push(segs[i]);
  return spans;
}

// Any single text field above its anti-dump ceiling is a body dump regardless
// of quoting. The ceilings themselves live in scripts/lib/content-caps.mjs —
// see `dumpCapFor` there and the incident note at the top of that file. They
// used to be re-typed in each consumer, which is how they desynced.

// Private-address / real-time-location / stalking data. Precise patterns
// only — editorial prose legitimately names streets ("Cornelia Street") and
// publications ("Wall Street Journal"), so the address pattern requires a
// leading house number that isn't a year and a suffix not followed by another
// proper noun (which indicates a publication/venue name, not an address).
const PRIVATE_DATA_PATTERNS = [
  {
    label: 'street address',
    re: /\b\d{1,5}\s+[A-Z][a-z]+\s+(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Lane|Ln\.|Boulevard|Blvd\.|Drive|Dr\.)(?!\s+[A-Z])\b/g,
    ok: (m) => /^(19|20)\d{2}\s/.test(m), // "2014 Wall Street ..." = a year, not a house number
  },
  { label: 'home address reference', re: /\bhome address\b/gi },
  { label: 'flight tracking', re: /\b(?:flight|jet) track(?:er|ing)\b/gi },
  { label: 'aircraft tail number', re: /\btail number\b/gi },
  { label: 'real-time location', re: /\b(?:is|was) (?:currently|right now) at\b/gi },
  { label: 'travel-pattern reference', re: /\b(?:travel pattern|usual route|regular route)s?\b/gi },
  // Interception-grade travel detail — banned at every provenance and tense.
  // The *fact* of travel at region level ("reportedly heading to the
  // Caribbean") is allowed and deliberately not matched.
  { label: 'flight number', re: /\bflight\s*(?:no\.?|number|#)\s*[A-Z]{0,3}\s*\d{1,4}\b/gi },
  { label: 'private-aviation log', re: /\b(?:jet|aircraft|plane)\s+(?:log|movement)s?\b/gi },
  // The tense-based 'future/planned whereabouts' pattern was REMOVED here on
  // 2026-07-20 (Wyatt) — see docs/content-ops/rumor-pipeline.md. It keyed on
  // the wrong axis: an announced tour date is future and venue-specific and
  // fine, while a past-tense street address is not. Specificity-vs-provenance
  // is the real rule, and it needs to read the place name, so it lives in the
  // agent pass (safety.redline candidates → `location-privacy`) rather than
  // in a CI regex that would block legitimate tour announcements.
];

function privateDataHits(text) {
  const hits = [];
  for (const p of PRIVATE_DATA_PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      if (p.ok && p.ok(m[0])) continue;
      hits.push(`${p.label}: "${m[0]}"`);
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Load the corpus
// ---------------------------------------------------------------------------

async function main() {
const { eras, milestones } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);

async function loadSeedDir(dir, listKey) {
  const out = [];
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  } catch {
    return { files: [], rows: out }; // dir may not exist yet (tracks/ has only the template)
  }
  for (const file of files) {
    const data = (await import(pathToFileURL(join(dir, file)).href)).default;
    for (const row of data?.[listKey] ?? []) out.push({ file, fileEra: data.eraSlug, row });
  }
  return { files, rows: out };
}

const content = await loadSeedDir(join(seed, 'content'), 'items');
const tracks = await loadSeedDir(join(seed, 'tracks'), 'tracks');
// Non-month-scoped types (audit §4b) — dirs may not exist in older checkouts.
const releases = await loadSeedDir(join(seed, 'releases'), 'releases');
const tours = await loadSeedDir(join(seed, 'tours'), 'tours');
const theories = await loadSeedDir(join(seed, 'theories'), 'theories');
const videos = await loadSeedDir(join(seed, 'videos'), 'videos');

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

const hardFails = [];
const byEra = new Map(); // slug -> { total, cats: Map }
const catTotals = new Map();
let zeroSource = 0;
let singleSource = 0;
let weakOnlySource = 0;
let mediaRefs = 0;
let mediaNoRights = 0;
let photosNoCredit = 0;
let longExcerpts = 0;
let shallowContext = 0;
let noPhotos = 0;
const shallowItems = [];

const itemKeys = new Map();

for (const { file, fileEra, row: it } of content.rows) {
  const era = it.eraSlug ?? fileEra;
  const at = `${file} "${String(it.title ?? '').slice(0, 48)}"`;

  // -- stable identity (hard) --
  if (!era || !Number.isInteger(it.year) || !Number.isInteger(it.month) || !it.title) {
    hardFails.push(`${at}: missing stable identity (needs eraSlug + year + month + title)`);
  } else {
    const key = `${era}|${it.year}|${it.month}|${it.title}`;
    if (itemKeys.has(key)) hardFails.push(`${at}: duplicate natural key (same era/year/month/title as ${itemKeys.get(key)})`);
    else itemKeys.set(key, file);
  }

  // -- coverage tallies --
  if (era) {
    if (!byEra.has(era)) byEra.set(era, { total: 0, cats: new Map() });
    const e = byEra.get(era);
    e.total += 1;
    e.cats.set(it.category, (e.cats.get(it.category) ?? 0) + 1);
  }
  catTotals.set(it.category, (catTotals.get(it.category) ?? 0) + 1);

  // -- sources --
  const urls = [...new Set([it.sourceUrl, ...(it.moment?.sources ?? []).map((s) => s.url)].filter(Boolean))];
  if (urls.length === 0) zeroSource += 1;
  else if (urls.length === 1) singleSource += 1;
  if (urls.length > 0 && urls.every((u) => WEAK_SOURCE_HOSTS.some((h) => u.includes(h)))) weakOnlySource += 1;

  // -- media / rights-status --
  const media = [...(it.thumbnailUrl ? [{ url: it.thumbnailUrl, credit: null, kind: 'thumbnail' }] : []), ...(it.moment?.photos ?? [])];
  for (const m of media) {
    mediaRefs += 1;
    if (!m.rights) mediaNoRights += 1; // proposed field; nothing carries it yet
    if (m.kind !== 'thumbnail' && !m.credit) photosNoCredit += 1;
  }

  // -- depth: shallow body text and/or no real photo --
  const contextLen = (it.moment?.context ?? '').length;
  const hasRealPhoto = (it.moment?.photos ?? []).length > 0;
  const isShallow = contextLen < SHALLOW_CONTEXT_CHARS;
  if (isShallow) shallowContext += 1;
  if (!hasRealPhoto) noPhotos += 1;
  if (isShallow || !hasRealPhoto) {
    shallowItems.push({
      era,
      title: it.title,
      contextLen,
      hasRealPhoto,
      sources: urls.length,
    });
  }

  // -- policy hard-fails on every text field --
  for (const [field, text] of [
    ['title', it.title],
    ['snippet', it.snippet],
    ['moment.context', it.moment?.context],
  ]) {
    if (!text) continue;
    if (looksLikeLyricsBlock(text)) hardFails.push(`${at} [${field}]: verse-like multi-line block — looks like stored lyrics`);
    const cap = dumpCapFor('moment', field);
    if (text.length > cap) hardFails.push(`${at} [${field}]: ${text.length} chars — article/body dump (> ${cap})`);
    for (const span of quotedSpans(text)) {
      if (span.length >= QUOTE_FAIL_CHARS) hardFails.push(`${at} [${field}]: verbatim quoted span of ${span.length} chars (>= ${QUOTE_FAIL_CHARS}) — statement/article dump`);
      else if (span.length >= QUOTE_WARN_CHARS) longExcerpts += 1;
    }
    for (const hit of privateDataHits(text)) hardFails.push(`${at} [${field}]: private/location data — ${hit}`);
  }
}

// Track guide sweep (same identity + policy gates).
const trackKeys = new Map();
const trackEras = new Set();
for (const { file, fileEra, row: t } of tracks.rows) {
  const era = t.eraSlug ?? fileEra;
  const at = `${file} "${String(t.trackTitle ?? '').slice(0, 48)}"`;
  if (!era || !t.trackTitle) hardFails.push(`${at}: missing stable identity (needs eraSlug + trackTitle)`);
  else {
    const key = `${era}|${t.trackTitle}`;
    if (trackKeys.has(key)) hardFails.push(`${at}: duplicate track (same era + title as ${trackKeys.get(key)})`);
    else trackKeys.set(key, file);
    trackEras.add(era);
  }
  const text = t.note ?? '';
  if (looksLikeLyricsBlock(text)) hardFails.push(`${at} [note]: verse-like multi-line block — looks like stored lyrics`);
  const noteCap = dumpCapFor('track', 'note');
  if (text.length > noteCap) hardFails.push(`${at} [note]: ${text.length} chars — body dump (> ${noteCap})`);
  for (const hit of privateDataHits(text)) hardFails.push(`${at} [note]: private/location data — ${hit}`);
}

// New-type sweep (releases / tours / theories / videos): same stable-identity
// + policy gates, keyed by slug instead of natural key. Also counts
// rights-aware media refs and hard-fails any theory without its REQUIRED
// confidence + outcome labels (un-labeled speculation must never ship).
function sweepTyped(name, rows, textFieldsOf) {
  const slugs = new Map();
  for (const { file, fileEra, row } of rows) {
    const era = row.eraSlug ?? fileEra;
    const at = `${file} "${String(row.title ?? row.slug ?? '').slice(0, 48)}"`;
    if (!era || !row.slug) hardFails.push(`${at}: missing stable identity (needs eraSlug + slug)`);
    else if (slugs.has(row.slug)) hardFails.push(`${at}: duplicate ${name} slug (also in ${slugs.get(row.slug)})`);
    else slugs.set(row.slug, file);

    const urls = [...new Set((row.sources ?? []).map((s) => s.source_url ?? s.url).filter(Boolean))];
    if (urls.length === 0) zeroSource += 1;
    else if (urls.length === 1) singleSource += 1;

    for (const m of row.media ?? []) {
      mediaRefs += 1;
      if (!m.rights) mediaNoRights += 1;
    }
    for (const s of row.sources ?? []) {
      const ex = s.excerpt ?? '';
      if (ex.length >= QUOTE_WARN_CHARS) longExcerpts += 1;
    }

    for (const [field, text] of textFieldsOf(row)) {
      if (!text) continue;
      if (looksLikeLyricsBlock(text)) hardFails.push(`${at} [${field}]: verse-like multi-line block — looks like stored lyrics`);
      const cap = dumpCapFor(name, field); // `name` is the corpus type: release|tour|theory|video
      if (text.length > cap) hardFails.push(`${at} [${field}]: ${text.length} chars — article/body dump (> ${cap})`);
      for (const span of quotedSpans(text)) {
        if (span.length >= QUOTE_FAIL_CHARS) hardFails.push(`${at} [${field}]: verbatim quoted span of ${span.length} chars (>= ${QUOTE_FAIL_CHARS}) — statement/article dump`);
        else if (span.length >= QUOTE_WARN_CHARS) longExcerpts += 1;
      }
      for (const hit of privateDataHits(text)) hardFails.push(`${at} [${field}]: private/location data — ${hit}`);
    }
  }
  return slugs;
}

sweepTyped('release', releases.rows, (r) => [
  ['title', r.title],
  ['note', r.note],
]);
sweepTyped('tour', tours.rows, (r) => [
  ['title', r.title],
  ['note', r.note],
  ['surpriseSongsNote', r.surpriseSongsNote],
  ...(r.shows ?? []).flatMap((s, i) => [
    [`shows[${i}].outfitNote`, s.outfitNote],
    [`shows[${i}].setlistChange`, s.setlistChange],
  ]),
]);
sweepTyped('theory', theories.rows, (r) => [
  ['title', r.title],
  ['claim', r.claim],
  ['evidence', r.evidence],
]);
for (const { file, row } of theories.rows) {
  if (!row.confidence || !row.outcome) {
    hardFails.push(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 48)}": theory without confidence+outcome — un-labeled speculation must never ship`);
  }
}
sweepTyped('video', videos.rows, (r) => [
  ['title', r.title],
  ['summary', r.summary],
  ['symbolism', r.symbolism],
  ...(r.easterEggs ?? []).map((e, i) => [`easterEggs[${i}]`, e]),
]);

// Era skeleton identity (hard).
const eraSlugs = new Set();
for (const e of eras) {
  if (!e.slug) hardFails.push(`eras-data.mjs: era "${e.title ?? '?'}" has no slug`);
  else if (eraSlugs.has(e.slug)) hardFails.push(`eras-data.mjs: duplicate era slug "${e.slug}"`);
  else eraSlugs.add(e.slug);
}

// ---------------------------------------------------------------------------
// Coverage vs expectations
// ---------------------------------------------------------------------------

const missingEras = EXPECTED_ERAS.filter((s) => !eraSlugs.has(s));
const unexpectedEras = [...eraSlugs].filter((s) => !EXPECTED_ERAS.includes(s));

function matchTitles(expected, titles) {
  const remaining = [...titles];
  const missing = [];
  for (const name of [...expected].sort((a, b) => b.length - a.length)) {
    const i = remaining.findIndex((t) => t.toLowerCase().includes(name.toLowerCase()));
    if (i === -1) missing.push(name);
    else remaining.splice(i, 1);
  }
  return missing;
}

const albumTitles = milestones.filter((m) => m.type === 'album_release').map((m) => m.title);
const tourTitles = milestones.filter((m) => m.type === 'tour').map((m) => m.title);
const missingAlbums = matchTitles(EXPECTED_ALBUM_RELEASES, albumTitles);
const missingTours = matchTitles(EXPECTED_TOURS, tourTitles);

// New-type coverage vs the same public-record expectations.
const missingReleaseRecords = matchTitles(EXPECTED_ALBUM_RELEASES, releases.rows.map(({ row }) => row.title));
const missingTourRecords = matchTitles(EXPECTED_TOURS, tours.rows.map(({ row }) => row.title));
const countEras = (rows) => new Set(rows.map(({ row, fileEra }) => row.eraSlug ?? fileEra).filter(Boolean)).size;

const thinEras = [];
for (const slug of EXPECTED_ERAS) {
  const e = byEra.get(slug);
  if (!e) continue; // missing entirely — listed above, not "thin"
  const emptyCats = CATEGORIES.filter((c) => !(e.cats.get(c) > 0));
  if (e.total < THIN_ITEM_COUNT || emptyCats.length >= THIN_EMPTY_CATEGORIES) {
    thinEras.push({ slug, total: e.total, emptyCats });
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log('CONTENT COVERAGE — Vault seed corpus');
console.log('====================================\n');

console.log(`Eras:        ${eraSlugs.size}/${EXPECTED_ERAS.length} present${missingEras.length ? ` — MISSING: ${missingEras.join(', ')}` : ''}`);
if (unexpectedEras.length) console.log(`             unexpected era slugs (update EXPECTED_ERAS?): ${unexpectedEras.join(', ')}`);
console.log(`Albums:      ${albumTitles.length}/${EXPECTED_ALBUM_RELEASES.length} release milestones${missingAlbums.length ? ` — MISSING: ${missingAlbums.join(', ')}` : ''}`);
console.log(`Tours:       ${tourTitles.length}/${EXPECTED_TOURS.length} tour milestones${missingTours.length ? ` — MISSING: ${missingTours.join(', ')}` : ''}`);
console.log(`Songs:       ${tracks.rows.length} track notes across ${trackEras.size}/${EXPECTED_ERAS.length} era track guides${trackEras.size === 0 ? ' — track guide UNSTARTED (only the _example template exists)' : ''}`);
console.log(`Releases:    ${releases.rows.length} release records — ${EXPECTED_ALBUM_RELEASES.length - missingReleaseRecords.length}/${EXPECTED_ALBUM_RELEASES.length} expected albums covered${missingReleaseRecords.length ? ` — MISSING: ${missingReleaseRecords.join(', ')}` : ''}`);
console.log(`Tour recs:   ${tours.rows.length} tour records — ${EXPECTED_TOURS.length - missingTourRecords.length}/${EXPECTED_TOURS.length} expected tours covered${missingTourRecords.length ? ` — MISSING: ${missingTourRecords.join(', ')}` : ''}`);
console.log(`Videos:      ${videos.rows.length} video works across ${countEras(videos.rows)} eras${videos.rows.length === 0 ? ' — UNSTARTED' : ''}`);
console.log(`Theories:    ${theories.rows.length} easter-egg/theory records across ${countEras(theories.rows)} eras${theories.rows.length === 0 ? ' — UNSTARTED' : ''} (all require confidence+outcome)`);
console.log('');

console.log(`${pad('era', 24)}${num('items', 6)}  ${CATEGORIES.map((c) => pad(c.slice(0, 5), 6)).join('')}`);
console.log('-'.repeat(24 + 6 + 2 + CATEGORIES.length * 6));
for (const slug of EXPECTED_ERAS) {
  const e = byEra.get(slug);
  const cells = CATEGORIES.map((c) => pad(e?.cats.get(c) ?? 0, 6)).join('');
  const mark = !e ? '  << MISSING' : thinEras.some((t) => t.slug === slug) ? '  << thin' : '';
  console.log(`${pad(slug, 24)}${num(e?.total ?? 0, 6)}  ${cells}${mark}`);
}
const cells = CATEGORIES.map((c) => pad(catTotals.get(c) ?? 0, 6)).join('');
console.log('-'.repeat(24 + 6 + 2 + CATEGORIES.length * 6));
console.log(`${pad('total', 24)}${num(content.rows.length, 6)}  ${cells}\n`);

if (thinEras.length) {
  console.log('Thin eras (report-only):');
  for (const t of thinEras) {
    const why = [t.total < THIN_ITEM_COUNT ? `${t.total} < ${THIN_ITEM_COUNT} items` : null, t.emptyCats.length >= THIN_EMPTY_CATEGORIES ? `empty: ${t.emptyCats.join(', ')}` : null].filter(Boolean);
    console.log(`  ${pad(t.slug, 24)}${why.join('; ')}`);
  }
  console.log('');
}

console.log('Source coverage (report-only):');
console.log(`  records with 0 sources:             ${zeroSource}`);
console.log(`  records with a single source:       ${singleSource}`);
console.log(`  records with only weak sources:     ${weakOnlySource}  (${WEAK_SOURCE_HOSTS.join(', ')})`);
console.log(`  verbatim excerpts >= ${QUOTE_WARN_CHARS} chars:      ${longExcerpts}  (review against the proposed ${QUOTE_WARN_CHARS}-char excerpt cap)`);
console.log('');
console.log('Media rights-status (report-only):');
console.log(`  media references (thumbs + photos): ${mediaRefs}`);
console.log(`  missing rights-status field:        ${mediaNoRights}  (pre-policy hotlinks; field proposed in the 2026-07-08 audit)`);
console.log(`  detail photos without credit:       ${photosNoCredit}`);
console.log('');

console.log('Depth (report-only — 2026-07-09 gate, see §A2 of the content depth audit):');
console.log(`  items with < ${SHALLOW_CONTEXT_CHARS}-char body (moment.context): ${shallowContext} / ${content.rows.length}`);
console.log(`  items with no real photo (moment.photos empty):    ${noPhotos} / ${content.rows.length}`);
if (shallowItems.length) {
  console.log(`  Flagged items needing a depth pass (${shallowItems.length}):`);
  const byEraFlag = new Map();
  for (const s of shallowItems) {
    if (!byEraFlag.has(s.era)) byEraFlag.set(s.era, []);
    byEraFlag.get(s.era).push(s);
  }
  for (const [era, items] of [...byEraFlag].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    ${era} (${items.length}):`);
    for (const s of items) {
      const why = [s.contextLen < SHALLOW_CONTEXT_CHARS ? `body ${s.contextLen} chars` : null, !s.hasRealPhoto ? 'no photo' : null].filter(Boolean).join(', ');
      console.log(`      - "${String(s.title).slice(0, 60)}" — ${why} (${s.sources} source${s.sources === 1 ? '' : 's'})`);
    }
  }
}
console.log('');

if (hardFails.length) {
  console.error(`HARD FAIL — ${hardFails.length} policy violation(s):`);
  for (const f of hardFails) console.error(`  ✗ ${f}`);
  return 1;
}
console.log(
  `✓ no hard-fail conditions (lyrics dumps / article dumps / private-location data / unstable identity) across ` +
    `${content.rows.length} items + ${tracks.rows.length} track notes + ${releases.rows.length} releases + ` +
    `${tours.rows.length} tours + ${theories.rows.length} theories + ${videos.rows.length} videos`,
);
}

runMain(main, { name: 'content-coverage' });

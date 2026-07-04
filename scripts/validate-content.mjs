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
]);

const monthIndex = (y, m) => y * 12 + (m - 1);

const { eras } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);
const eraSpan = new Map(
  eras.map((e) => [
    e.slug,
    { lo: monthIndex(+e.start_date.slice(0, 4), +e.start_date.slice(5, 7)), hi: monthIndex(+e.end_date.slice(0, 4), +e.end_date.slice(5, 7)) },
  ]),
);

const contentDir = join(seed, 'content');
let errors = 0;
let warnings = 0;
let checked = 0;

for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
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
    if (!(Number.isInteger(it.month) && it.month >= 1 && it.month <= 12)) err(`month out of 1..12 (${it.month})`);
    if (!CATEGORIES.has(it.category)) err(`category "${it.category}" not in ${[...CATEGORIES].join('|')}`);
    if (!it.title) err('missing title');
    if ((it.snippet ?? '').length > 400) err(`snippet ${it.snippet.length} > 400 (DB CHECK)`);
    if ((it.moment?.context ?? '').length > 2000) err(`moment.context ${it.moment.context.length} > 2000 (DB CHECK)`);

    if (!(it.sourceUrl || it.moment?.sources?.length > 0)) warn('no sourceUrl and no moment.sources (link-first model)');

    const span = eraSpan.get(eraSlug);
    if (span && Number.isInteger(it.year) && Number.isInteger(it.month)) {
      const mi = monthIndex(it.year, it.month);
      if (mi < span.lo || mi > span.hi) warn(`${it.year}-${String(it.month).padStart(2, '0')} is outside era "${eraSlug}" span — renders under its own section but check the date`);
    }
  });
}

console.log(`\nvalidated ${checked} content item(s) — ${errors} error(s), ${warnings} warning(s)`);
if (errors > 0) process.exit(1);

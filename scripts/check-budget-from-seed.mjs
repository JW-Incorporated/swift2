// Assemble the Tier 0 payload straight from the seed files (no DB, no secrets)
// and check it against the budget — so CI catches payload regressions as
// content grows. This mirrors what GET /vault/tier0 serves: eras + milestones +
// the month index (month_item Tier 0 fields only; moments are Tier 1, excluded).
//
//   npm run check:budget:seed
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { evaluateTier0Budget } from '@swift2/shared';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', 'supabase', 'seed');

const { eras, milestones } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);

// Match the camelCase shapes the mappers produce (see packages/core/src/map.ts).
const erasOut = eras.map((e) => ({
  slug: e.slug,
  title: e.title,
  album: e.album,
  startDate: e.start_date,
  endDate: e.end_date,
  order: e.sort_order,
  theme: e.theme,
  coverImageUrl: e.cover_image_url ?? null,
}));

const milestonesOut = milestones.map((m, i) => ({
  // real rows carry a uuid; a placeholder is fine for a size proxy.
  id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
  eraSlug: m.era_slug,
  type: m.type,
  title: m.title,
  date: m.date,
}));

const contentDir = join(seed, 'content');
const monthItems = [];
let n = 0;
for (const f of readdirSync(contentDir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
  const data = (await import(pathToFileURL(join(contentDir, f)).href)).default;
  const fileEra = data.eraSlug;
  for (const it of data.items ?? []) {
    monthItems.push({
      id: `00000000-0000-0000-0000-${String(n++).padStart(12, '0')}`,
      eraSlug: it.eraSlug ?? fileEra,
      year: it.year,
      month: it.month,
      category: it.category,
      title: it.title,
      snippet: it.snippet ?? '',
      sourceUrl: it.sourceUrl ?? null,
      thumbnailUrl: it.thumbnailUrl ?? null,
    });
  }
}

const body = JSON.stringify({ version: 'seed', skeleton: { eras: erasOut, milestones: milestonesOut, monthItems } });
const parsedBytes = Buffer.byteLength(body, 'utf8');
const gzipBytes = gzipSync(body).length;
const r = evaluateTier0Budget({ gzipBytes, parsedBytes });

const kb = (v) => `${(v / 1024).toFixed(1)} KB`;
const pct = (v) => `${(v * 100).toFixed(1)}%`;
console.log(`Tier 0 assembled from seed: ${erasOut.length} eras, ${milestonesOut.length} milestones, ${monthItems.length} month items`);
console.log(`  gzipped: ${kb(r.gzipBytes)} / ${kb(r.gzipBudget)} budget  (${pct(r.gzipRatio)})`);
console.log(`  parsed:  ${kb(r.parsedBytes)} / ${kb(r.parsedBudget)} budget  (${pct(r.parsedRatio)})`);

if (!r.withinBudget) {
  console.error(`✗ OVER Tier 0 budget — gzip +${kb(r.overBy.gzipBytes)}, parsed +${kb(r.overBy.parsedBytes)}`);
  process.exit(1);
}
console.log('✓ within Tier 0 budget');

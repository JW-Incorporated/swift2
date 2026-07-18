// Seed Vault month_item + moment content from supabase/seed/content/*.mjs.
// The CONTENT track (Joey) only adds/edits data files in that folder; this
// runner (owned by the ENGINE track) loads them. Only this folder is loaded —
// e.g. supabase/seed/candidates/ is staging and is NOT seeded.
//
// A file may cover one era (export { eraSlug, items }) or many (each item
// carries its own eraSlug). Idempotent: every era a file touches is replaced
// wholesale on each run (moment rows cascade-delete with their month_item).
//
//   npm run db:seed:content
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'supabase', 'seed', 'content');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

// Files starting with "_" are templates/helpers, not real content.
const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
let items = 0;
let moments = 0;
try {
  for (const file of files) {
    const mod = await import(pathToFileURL(join(contentDir, file)).href);
    const data = mod.default ?? mod;
    const fileEra = data.eraSlug; // optional default era for the file
    const rows = data.items;
    if (!Array.isArray(rows)) {
      console.warn(`skipping ${file}: expected { items: [] } (optionally { eraSlug })`);
      continue;
    }
    // A file may cover one era (fileEra) or many (each item carries eraSlug).
    // Replace content for exactly the eras this file touches.
    const touched = [...new Set(rows.map((r) => r.eraSlug ?? fileEra).filter(Boolean))];
    for (const es of touched) {
      await client.query('delete from public.month_item where era_slug = $1', [es]);
    }
    for (const it of rows) {
      const eraSlug = it.eraSlug ?? fileEra;
      if (!eraSlug) {
        console.warn(`skipping an item in ${file}: no eraSlug`);
        continue;
      }
      const res = await client.query(
        `insert into public.month_item
           (era_slug, year, month, day, category, title, snippet, source_url, thumbnail_url, significance)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [
          eraSlug,
          it.year,
          it.month,
          it.day ?? null,
          it.category,
          it.title,
          it.snippet ?? '',
          it.sourceUrl ?? null,
          it.thumbnailUrl ?? null,
          // Found in review (2026-07-18): this INSERT predated the
          // significance column and was never updated when it was added —
          // the migration exists but nothing wrote to it, so every DB-seeded
          // row would have significance stuck at NULL regardless of what
          // the seed file said. Still not read anywhere live (seed files
          // are the source of truth, 2026-07-17 decision) — this closes the
          // write-side gap for whenever that changes.
          it.significance ?? null,
        ],
      );
      items += 1;
      if (it.moment) {
        const m = it.moment;
        await client.query(
          `insert into public.moment (month_item_id, context, sources, photos) values ($1,$2,$3,$4)`,
          [
            res.rows[0].id,
            m.context ?? '',
            JSON.stringify(m.sources ?? []),
            JSON.stringify(m.photos ?? []),
          ],
        );
        moments += 1;
      }
    }
  }
  console.log(
    `seeded content: ${items} month items, ${moments} moments from ${files.length} file(s)`,
  );
} catch (err) {
  console.error('CONTENT SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

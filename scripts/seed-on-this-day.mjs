// Seed Fun-notification on_this_day content from
// supabase/seed/on-this-day/*.mjs. Idempotent: replaces every row wholesale
// on each run (same pattern as scripts/seed-tracks.mjs / seed-lyrics.mjs).
//
//   npm run db:seed:on-this-day
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'seed', 'on-this-day');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const client = makeClient(connectionString);
await client.connect();
let count = 0;
try {
  // Wholesale replace — this table has no natural unique key across files
  // (a real future authoring flow could have two entries for the same
  // date), so unlike lyrics/tracks it's a full delete+reinsert rather than
  // an upsert-by-key.
  await client.query('delete from public.on_this_day');
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const pool = mod.default ?? mod.ON_THIS_DAY_STARTER_POOL;
    if (!Array.isArray(pool)) {
      console.warn(`skipping ${file}: expected an array of on_this_day rows`);
      continue;
    }
    for (const e of pool) {
      if (!e.month || !e.day || !e.text) {
        console.warn(`skipping malformed row in ${file}:`, e);
        continue;
      }
      await client.query(
        `insert into public.on_this_day (month, day, year, text, deep_link)
         values ($1,$2,$3,$4,$5)`,
        [e.month, e.day, e.year ?? null, e.text, e.deepLink ?? null],
      );
      count += 1;
    }
  }
  console.log(`seeded on_this_day: ${count} rows from ${files.length} file(s)`);
} catch (err) {
  console.error('ON_THIS_DAY SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

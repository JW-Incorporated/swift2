// Seed Vault tours from supabase/seed/tours/*.mjs.
// The CONTENT track (Joey) adds data files; this runner loads them.
// Idempotent: the tours table is replaced wholesale on each run.
//
//   npm run db:seed:tours
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'seed', 'tours');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

// Files starting with "_" are templates, not real content.
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
let count = 0;
try {
  await client.query('delete from public.tour');
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const { tours } = mod.default ?? mod;
    if (!Array.isArray(tours)) {
      console.warn(`skipping ${file}: expected { tours: [] }`);
      continue;
    }
    for (const t of tours) {
      await client.query(
        `insert into public.tour
           (slug, era_slug, title, opened_on, closed_on, legs, show_count,
            surprise_songs_note, shows, note, sources)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          t.slug,
          t.eraSlug,
          t.title,
          t.openedOn,
          t.closedOn ?? null,
          JSON.stringify(t.legs ?? []),
          t.showCount ?? null,
          t.surpriseSongsNote ?? null,
          JSON.stringify(t.shows ?? []),
          t.note ?? '',
          JSON.stringify(t.sources ?? []),
        ],
      );
      count += 1;
    }
  }
  console.log(`seeded tours: ${count} from ${files.length} file(s)`);
} catch (err) {
  console.error('TOUR SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

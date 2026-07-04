// Seed Vault track-guide notes from supabase/seed/tracks/*.mjs.
// The CONTENT track (Joey) adds one file per album/era; this runner (owned by
// the ENGINE track) loads them. Idempotent per era: a file owns its era_slug
// and its rows are replaced wholesale on each run.
//
//   npm run db:seed:tracks
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const tracksDir = join(here, '..', 'supabase', 'seed', 'tracks');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

// Files starting with "_" are templates, not real content.
const files = readdirSync(tracksDir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
let notes = 0;
try {
  for (const file of files) {
    const mod = await import(pathToFileURL(join(tracksDir, file)).href);
    const { eraSlug, tracks } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(tracks)) {
      console.warn(`skipping ${file}: expected { eraSlug, tracks: [] }`);
      continue;
    }
    await client.query('delete from public.track_note where era_slug = $1', [eraSlug]);
    for (const t of tracks) {
      await client.query(
        `insert into public.track_note
           (era_slug, track_title, track_number, note, source_url, sources)
         values ($1,$2,$3,$4,$5,$6)`,
        [eraSlug, t.trackTitle, t.trackNumber ?? null, t.note ?? '', t.sourceUrl ?? null, JSON.stringify(t.sources ?? [])],
      );
      notes += 1;
    }
  }
  console.log(`seeded track guide: ${notes} notes from ${files.length} file(s)`);
} catch (err) {
  console.error('TRACK SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

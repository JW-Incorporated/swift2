// Seed Fun-notification lyric pool from supabase/seed/lyrics/*.mjs.
// Idempotent: replaces every row wholesale on each run (same pattern as
// scripts/seed-tracks.mjs). `verified` stays whatever the seed file sets
// (see starter-pool.mjs's DRAFT caveat — the production dispatch job never
// sends an unverified row, see notification-fun.ts's requireVerified gate).
//
//   npm run db:seed:lyrics
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';
import { runMain } from './lib/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const lyricsDir = join(here, '..', 'supabase', 'seed', 'lyrics');

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
    return 1;
  }

  const files = readdirSync(lyricsDir)
    .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
    .sort();

  const client = makeClient(connectionString);
  await client.connect();
  let count = 0;
  try {
    await client.query('delete from public.lyrics');
    for (const file of files) {
      const mod = await import(pathToFileURL(join(lyricsDir, file)).href);
      const pool = mod.default ?? mod.LYRIC_STARTER_POOL;
      if (!Array.isArray(pool)) {
        console.warn(`skipping ${file}: expected an array of lyric rows`);
        continue;
      }
      for (const l of pool) {
        if (!l.slug || !l.song || !l.album || !l.lyric) {
          console.warn(`skipping malformed row in ${file}:`, l);
          continue;
        }
        await client.query(
          `insert into public.lyrics (slug, song, album, lyric, verified)
           values ($1,$2,$3,$4,$5)
           on conflict (slug) do update set song = excluded.song, album = excluded.album,
             lyric = excluded.lyric, verified = excluded.verified`,
          [l.slug, l.song, l.album, l.lyric, Boolean(l.verified)],
        );
        count += 1;
      }
    }
    console.log(`seeded lyric pool: ${count} rows from ${files.length} file(s)`);
  } finally {
    await client.end();
  }
}

runMain(main, { name: 'seed-lyrics' });

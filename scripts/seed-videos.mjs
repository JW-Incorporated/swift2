// Seed Vault video/visual-media works from supabase/seed/videos/*.mjs.
// The CONTENT track (Joey) adds one file per era; this runner loads them.
// Idempotent per era: a file owns its era_slug and its rows are replaced
// wholesale on each run (same pattern as seed-tracks.mjs).
//
//   npm run db:seed:videos
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'seed', 'videos');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

// Files starting with "_" are templates, not real content.
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const client = makeClient(connectionString);
await client.connect();
let count = 0;
try {
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const { eraSlug, videos } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(videos)) {
      console.warn(`skipping ${file}: expected { eraSlug, videos: [] }`);
      continue;
    }
    await client.query('delete from public.video_work where era_slug = $1', [eraSlug]);
    for (const v of videos) {
      await client.query(
        `insert into public.video_work
           (slug, era_slug, kind, title, director, released_on, related_songs,
            summary, symbolism, easter_eggs, official_url, media, sources)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          v.slug,
          v.eraSlug ?? eraSlug,
          v.kind,
          v.title,
          v.director ?? null,
          v.releasedOn ?? null,
          JSON.stringify(v.relatedSongs ?? []),
          v.summary ?? '',
          v.symbolism ?? null,
          JSON.stringify(v.easterEggs ?? []),
          v.officialUrl ?? null,
          JSON.stringify(v.media ?? []),
          JSON.stringify(v.sources ?? []),
        ],
      );
      count += 1;
    }
  }
  console.log(`seeded videos: ${count} from ${files.length} file(s)`);
} catch (err) {
  console.error('VIDEO SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

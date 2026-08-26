// Seed Vault video/visual-media works from supabase/seed/videos/*.mjs.
// The CONTENT track (Joey) adds one file per era; this runner loads them.
// Idempotent on slug (globally unique, video_work_slug_key): every video is
// upserted by slug rather than delete-then-insert per era, so moving a video
// to a different era file (e.g. commit 46a88202) can't collide with its own
// stale row from the old era. A slug that no longer appears in ANY file is
// deleted — that's the only case a row should disappear.
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
  const entries = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const { eraSlug, videos } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(videos)) {
      console.warn(`skipping ${file}: expected { eraSlug, videos: [] }`);
      continue;
    }
    for (const v of videos) entries.push({ v, eraSlug });
  }

  const currentSlugs = entries.map(({ v }) => v.slug);
  await client.query('delete from public.video_work where not (slug = any($1))', [currentSlugs]);

  for (const { v, eraSlug } of entries) {
    await client.query(
      `insert into public.video_work
         (slug, era_slug, kind, title, director, released_on, related_songs,
          summary, symbolism, easter_eggs, official_url, media, sources)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (slug) do update set
         era_slug = excluded.era_slug, kind = excluded.kind, title = excluded.title,
         director = excluded.director, released_on = excluded.released_on,
         related_songs = excluded.related_songs, summary = excluded.summary,
         symbolism = excluded.symbolism, easter_eggs = excluded.easter_eggs,
         official_url = excluded.official_url, media = excluded.media,
         sources = excluded.sources`,
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
  console.log(`seeded videos: ${count} from ${files.length} file(s)`);
} catch (err) {
  console.error('VIDEO SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

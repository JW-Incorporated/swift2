// Seed Vault canonical releases from supabase/seed/releases/*.mjs.
// The CONTENT track (Joey) adds data files; this runner loads them.
// Idempotent: the releases table is replaced wholesale on each run (the
// small canon lives in one dir, so wholesale replace keeps slugs stable).
//
//   npm run db:seed:releases
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'seed', 'releases');

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
  await client.query('delete from public.release');
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const { releases } = mod.default ?? mod;
    if (!Array.isArray(releases)) {
      console.warn(`skipping ${file}: expected { releases: [] }`);
      continue;
    }
    for (const r of releases) {
      await client.query(
        `insert into public.release
           (slug, era_slug, kind, title, release_date, label, track_count,
            parent_release_slug, tracklist, note, sources)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          r.slug,
          r.eraSlug,
          r.kind,
          r.title,
          r.releaseDate,
          r.label ?? null,
          r.trackCount ?? null,
          r.parentReleaseSlug ?? null,
          JSON.stringify(r.tracklist ?? []),
          r.note ?? '',
          JSON.stringify(r.sources ?? []),
        ],
      );
      count += 1;
    }
  }
  console.log(`seeded releases: ${count} from ${files.length} file(s)`);
} catch (err) {
  console.error('RELEASE SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

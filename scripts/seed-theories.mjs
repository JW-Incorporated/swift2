// Seed Vault easter eggs + theories from supabase/seed/theories/*.mjs.
// The CONTENT track (Joey) adds one file per era; this runner loads them.
// Idempotent per era: a file owns its era_slug and its rows are replaced
// wholesale on each run (same pattern as seed-tracks.mjs).
//
//   npm run db:seed:theories
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'supabase', 'seed', 'theories');

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
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const { eraSlug, theories } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(theories)) {
      console.warn(`skipping ${file}: expected { eraSlug, theories: [] }`);
      continue;
    }
    await client.query('delete from public.theory where era_slug = $1', [eraSlug]);
    for (const t of theories) {
      await client.query(
        `insert into public.theory
           (slug, era_slug, kind, title, claim, evidence, confidence, outcome,
            related_slugs, sources)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          t.slug,
          t.eraSlug ?? eraSlug,
          t.kind,
          t.title,
          t.claim ?? '',
          t.evidence ?? null,
          t.confidence,
          t.outcome,
          JSON.stringify(t.relatedSlugs ?? []),
          JSON.stringify(t.sources ?? []),
        ],
      );
      count += 1;
    }
  }
  console.log(`seeded theories: ${count} from ${files.length} file(s)`);
} catch (err) {
  console.error('THEORY SEED FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

// CI proof for scripts/migrate.mjs's unusual contract: every migration is
// applied in filename order on every run. PGlite keeps this check isolated
// from production while representative rows expose constraints that an older
// migration accidentally narrows on the next run.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { runMain } from './lib/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MIGRATIONS_DIR = join(here, '..', 'supabase', 'migrations');

// File -> exact PGlite incompatibility. Add an entry only after confirming
// real Postgres supports the migration and PGlite does not. Unknown failures
// are deliberately fatal, so a new migration can never be skipped silently.
export const PGLITE_SKIP_MIGRATIONS = new Map([
  // No current migrations need an exception.
]);

export const NEWS_SOURCE_TYPES = [
  'rss',
  'reddit',
  'x',
  'youtube',
  'bluesky',
  'google_news',
  'reddit_rss',
  'tumblr',
  'gnews',
  'site_diff',
];

export function listMigrations(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

function validateSkipList(files, skipList) {
  const known = new Set(files);
  for (const [file, reason] of skipList) {
    if (!known.has(file)) throw new Error(`PGlite skip-list entry does not exist: ${file}`);
    if (!reason.trim()) throw new Error(`PGlite skip-list entry needs a reason: ${file}`);
  }
}

async function prepareSupabaseStubs(db) {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid
      language sql stable as 'select null::uuid';
  `);
}

async function applyPass(db, migrationsDir, files, skipList, pass) {
  for (const file of files) {
    const skipReason = skipList.get(file);
    if (skipReason) {
      console.log(`skip ${file}: ${skipReason}`);
      continue;
    }

    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Migration ${file} failed on pass ${pass}: ${detail}`, { cause: error });
    }
  }
}

async function seedRepresentativeRows(db) {
  for (const sourceType of NEWS_SOURCE_TYPES) {
    await db.query(
      `insert into public.news_source (name, source_type, tier, config, is_enabled)
       values ($1, $2, 'established', '{}'::jsonb, false)`,
      [`migration-rerun-check-${sourceType}`, sourceType],
    );
  }
}

export async function checkMigrationsRerun({
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
  skipList = PGLITE_SKIP_MIGRATIONS,
} = {}) {
  const files = listMigrations(migrationsDir);
  validateSkipList(files, skipList);

  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await prepareSupabaseStubs(db);
    await applyPass(db, migrationsDir, files, skipList, 1);
    await seedRepresentativeRows(db);
    await applyPass(db, migrationsDir, files, skipList, 2);
  } finally {
    await db.close();
  }

  return { applied: files.length - skipList.size, skipped: skipList.size };
}

async function main() {
  const result = await checkMigrationsRerun();
  console.log(
    `Migration re-run check passed: ${result.applied} migration(s) applied twice, ${result.skipped} skipped.`,
  );
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'check-migrations-rerun.mjs';
if (invokedDirectly) runMain(main, { name: 'check-migrations-rerun' });

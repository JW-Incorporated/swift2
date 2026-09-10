// Apply every supabase/migrations/*.sql file in filename order against
// SUPABASE_DB_URL. Migrations are written to be idempotent (if-not-exists /
// drop-policy-if-exists), so re-running is safe.
//
//   node --env-file=apps/worker/.env scripts/migrate.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeClient } from './lib/pg.mjs';
import { runMain } from './lib/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'supabase', 'migrations');

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
    return 1;
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = makeClient(connectionString);
  await client.connect();
  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      process.stdout.write(`applying ${file} ... `);
      await client.query(sql);
      console.log('ok');
    }
    console.log(`\n${files.length} migration(s) applied.`);
  } finally {
    await client.end();
  }
}

runMain(main, { name: 'migrate' });

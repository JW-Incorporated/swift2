// Apply every supabase/migrations/*.sql file in filename order against
// SUPABASE_DB_URL. Migrations are written to be idempotent (if-not-exists /
// drop-policy-if-exists), so re-running is safe.
//
//   node --env-file=apps/worker/.env scripts/migrate.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'supabase', 'migrations');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    process.stdout.write(`applying ${file} ... `);
    await client.query(sql);
    console.log('ok');
  }
  console.log(`\n${files.length} migration(s) applied.`);
} catch (err) {
  console.error('\nMIGRATION FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

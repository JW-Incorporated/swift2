// One-off, no-psql-required check for whether pgvector is available on this
// project's Supabase plan (HUMAN-ACTIONS.md #14). Safe to run any time —
// `create extension if not exists` is a no-op if it's already installed.
//
//   node --env-file=apps/worker/.env scripts/check-pgvector.mjs
import { makeClient, describeConnection } from './lib/pg.mjs';
import { runMain } from './lib/cli.mjs';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  process.exit(1);
}

async function main() {
  const client = makeClient(connectionString);
  await client.connect();
  try {
    console.log(`connected to ${describeConnection(connectionString)}`);
    await client.query('create extension if not exists vector;');
    const { rows } = await client.query(
      "select extversion from pg_extension where extname = 'vector';",
    );
    if (rows.length) {
      console.log(`pgvector is available (version ${rows[0].extversion}).`);
    } else {
      console.log('pgvector extension not found after create attempt — check plan tier.');
    }
  } finally {
    await client.end();
  }
}

runMain(main, { name: 'check-pgvector' });

// Seed the Vault skeleton (eras + milestones) from supabase/seed/eras-data.mjs.
// Idempotent: eras upsert on slug; milestones are replaced wholesale each run
// (they carry generated ids, so re-running would otherwise duplicate them).
//
// DEPRECATED (OS-016, `docs/specs/2026-09-05-one-source-three-surfaces.md`
// §6 Phase 1): no code path outside `scripts/` reads the `era`/`milestone`
// tables any more — web (OS-014) and mobile (OS-015) both read the
// published content bundle instead. Removed from `db-seed.yml` and
// `docs/dev-quickstart.md`; kept runnable (and in
// `scripts/backup-restore-test.mjs`'s fixture build) only until the
// tables themselves are dropped, one release cycle out.
//
//   node --env-file=apps/worker/.env scripts/seed-eras.mjs
import { makeClient } from './lib/pg.mjs';
import { runMain } from './lib/cli.mjs';
import { eras, milestones } from '../supabase/seed/eras-data.mjs';

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
    return 1;
  }

  const client = makeClient(connectionString);
  await client.connect();
  try {
    for (const e of eras) {
      await client.query(
        `insert into public.era (slug, title, album, start_date, end_date, sort_order, theme, cover_image_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (slug) do update set
           title = excluded.title, album = excluded.album,
           start_date = excluded.start_date, end_date = excluded.end_date,
           sort_order = excluded.sort_order, theme = excluded.theme,
           cover_image_url = excluded.cover_image_url`,
        [e.slug, e.title, e.album, e.start_date, e.end_date, e.sort_order, JSON.stringify(e.theme), e.cover_image_url ?? null],
      );
    }

    // Replace milestones (no natural key; avoid dupes on re-run).
    await client.query('delete from public.milestone');
    for (const m of milestones) {
      await client.query(
        `insert into public.milestone (era_slug, type, title, date) values ($1,$2,$3,$4)`,
        [m.era_slug, m.type, m.title, m.date],
      );
    }

    const eraCount = (await client.query('select count(*)::int as n from public.era')).rows[0].n;
    const msCount = (await client.query('select count(*)::int as n from public.milestone')).rows[0].n;
    console.log(`seeded: ${eraCount} eras, ${msCount} milestones`);
  } finally {
    await client.end();
  }
}

runMain(main, { name: 'seed-eras' });

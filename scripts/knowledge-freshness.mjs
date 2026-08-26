#!/usr/bin/env node
// Knowledge engine — freshness SLO (PLAN.md Stage 12, proposal §7 eval
// bullet item 2): "max(updated_at) where tier='current' in knowledge_doc"
// should be < 24h.
//
// Uses the SAME `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` credential the
// worker already reads — already a real GitHub Actions secret pair
// (`news-worker.yml`), so this needs no new secret and no HUMAN-ACTIONS item.
//
// ZERO DEPENDENCIES ON PURPOSE (rewritten 2026-08-24). This used to
// `import { createWorkerDbClient } from '../apps/worker/src/db/client.ts'`,
// which pulls in `@supabase/supabase-js`. watchdog.yml runs this step with NO
// `npm ci` (it is deliberately dependency-free — see its header), so that
// import threw `ERR_MODULE_NOT_FOUND` at module-load time, BEFORE the graceful
// env-check below ever ran — the crash was reported as exit 1 → a false
// "current tier is stale" page every single day. A one-row freshness read has
// no business dragging in the whole worker DB client; it now hits the
// PostgREST REST endpoint directly with the built-in `fetch`, so it runs
// unchanged in the dependency-free watchdog and degrades to a clean skip
// (exit 2) whenever the table is absent (pre-migration) or the creds are
// unset — never a crash.
//
// REPORT, NOT A HARD FAIL (deliberate choice): a real ingestion cadence takes
// hours to prove itself out — the Current tier has ZERO rows (indeed no
// `knowledge_doc` table at all) until the Stage 1/2 migrations are applied
// (HUMAN-ACTIONS.md #14) and the extract stage runs at least once. Exit codes:
// 0 = fresh, 1 = genuinely stale, 2 = skip/no-data/no-table/no-creds (not an
// alarm). `watchdog.yml` maps 2 to "close the alert", so a pre-ingestion or
// pre-migration state never pages.
//
//   node scripts/knowledge-freshness.mjs
//   node scripts/knowledge-freshness.mjs --max-age-hours 24

/* global AbortSignal */

const ARGV = process.argv.slice(2);
function flagValue(name) {
  const eq = ARGV.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const i = ARGV.indexOf(`--${name}`);
  if (i !== -1 && ARGV[i + 1] && !ARGV[i + 1].startsWith('--')) return ARGV[i + 1];
  return null;
}
const MAX_AGE_HOURS = flagValue('max-age-hours') ? Number(flagValue('max-age-hours')) : 24;

// A schema-absent signal means the table/column isn't migrated yet — a
// pre-migration state (HUMAN-ACTIONS.md #14), not staleness. Same shape the
// worker treats as a degraded no-op.
function isSchemaAbsent(status, bodyText) {
  if (status === 404) return true;
  return /schema cache|does not exist|PGRST205|PGRST204|relation .* does not exist/i.test(bodyText);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(
      'knowledge-freshness: SKIPPING — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set ' +
        '(expected in apps/worker/.env locally, or the news-worker GitHub Actions secrets in CI). ' +
        'Nothing was queried.',
    );
    return 2;
  }

  const endpoint =
    `${url.replace(/\/$/, '')}/rest/v1/knowledge_doc` +
    '?select=updated_at&tier=eq.current&order=updated_at.desc&limit=1';

  let res;
  try {
    res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    console.log(`knowledge-freshness: SKIPPING — query request failed (${err.message}). Nothing to page on.`);
    return 2;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (isSchemaAbsent(res.status, body)) {
      console.log(
        "knowledge-freshness: SKIPPING — the knowledge_doc table (or its tier column) isn't present yet. " +
          'Expected until the Stage 1/2 migrations are applied (HUMAN-ACTIONS.md #14, `npm run db:migrate`). ' +
          'Not itself evidence of staleness.',
      );
      return 2;
    }
    console.log(`knowledge-freshness: SKIPPING — query returned HTTP ${res.status}: ${body.slice(0, 200)}`);
    return 2;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    console.log('knowledge-freshness: SKIPPING — could not parse the query response.');
    return 2;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.log(
      "knowledge-freshness: no tier='current' rows exist yet — expected until the extract stage has a live " +
        'ANTHROPIC_API_KEY (HUMAN-ACTIONS.md #13) and runs at least once. Not itself evidence of staleness.',
    );
    return 2;
  }

  const newest = new Date(data[0].updated_at);
  const ageHours = (Date.now() - newest.getTime()) / (1000 * 60 * 60);
  const fresh = ageHours <= MAX_AGE_HOURS;

  console.log(
    `knowledge-freshness: newest tier='current' row updated ${ageHours.toFixed(1)}h ago ` +
      `(${newest.toISOString()}), SLO ${MAX_AGE_HOURS}h — ${fresh ? 'OK' : 'STALE'}.`,
  );

  return fresh ? 0 : 1;
}

process.exitCode = await main();

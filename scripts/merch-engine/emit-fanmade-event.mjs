#!/usr/bin/env node
// Notifications Phase 5 producer seam for `fan_merch`
// (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§10) — mirrors
// emit-official-merch-event.mjs's Phase 2 seam exactly, one level up the
// authoring pipeline: author-catalogs.mjs's `authorFanmadeCatalog()`
// already computes the newly-authored fan-made catalog (curateCandidate()
// is the D3/E1/E2-gated detector), so this script consumes its
// `socialDraft` output the same way emit-official-merch-event.mjs consumes
// build-drop-draft.mjs's official one.
//
// UNLIKE official_merch, there is no scheduled GitHub Actions workflow
// invoking author-catalogs.mjs's fanmade lane today (see author-catalogs.mjs's
// header comment) — this script exists so that WHEN a founder or a future
// workflow runs the authoring CLI, the fan_merch notification fires
// automatically from the same authoring step, rather than requiring a
// second manual action. Degrades to a no-op (never fails the authoring
// run) when Supabase credentials are unset, matching every other producer
// in this repo.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { insertEvent } from '@swift2/core';
import { serviceClient } from '../lib/supabase.mjs';

const SITE_URL = 'https://www.longlivets.com';

export async function emitFanmadeEvent(socialDraft, { db, now = new Date() } = {}) {
  const products = Array.isArray(socialDraft?.products) ? socialDraft.products : [];
  if (products.length === 0) return { emitted: false, reason: 'no-products' };
  if (!db) return { emitted: false, reason: 'no-db-client' };

  const names = products.map((p) => String(p?.item ?? '').trim()).filter(Boolean);
  const lead = names[0] ?? 'new fan-made merch';
  const more = products.length > 1 ? ` (+${products.length - 1} more)` : '';
  // Deterministic on the exact URL SET being authored (not the calendar
  // day, unlike official_merch) — official_merch's detector only ever
  // reports genuinely NEW products per sync cycle, so a day-scoped key is
  // enough; authorFanmadeCatalog() re-emits its FULL curated catalog on
  // every run (it has no delta/added tracking the way the official-store
  // sync plan does), so the key must be scoped to the exact URL set to
  // avoid re-notifying on an unchanged re-run of the same curation.
  const urls = [...products]
    .map((p) => String(p?.url ?? ''))
    .sort()
    .join('|');
  const dedupeKey = `fan_merch:${urls}`;

  const result = await insertEvent(db, {
    category: 'fan_merch',
    title: 'New fan-made merch',
    body: `${lead}${more}`,
    deepLink: `${SITE_URL}/?current=merch`,
    dedupeKey,
    now,
  });
  return { emitted: !result.deduped, deduped: result.deduped, dedupeKey };
}

function supabaseAdmin() {
  return serviceClient();
}

async function main() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--social-draft');
  const socialDraftPath = idx >= 0 ? args[idx + 1] : null;
  if (!socialDraftPath) {
    throw new Error('usage: emit-fanmade-event.mjs --social-draft <path.json>');
  }
  const socialDraft = JSON.parse(await readFile(resolve(socialDraftPath), 'utf8'));
  const db = supabaseAdmin();
  if (!db) {
    console.log(
      'emit-fanmade-event: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — skipping (see SETUP_NOTIFICATIONS.md)',
    );
    return;
  }
  const result = await emitFanmadeEvent(socialDraft, { db });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Never fails the authoring run — a notification-event miss must not
    // block the catalog PR/write from landing (same stage-isolation
    // discipline every other producer in this repo follows).
    console.error(`emit-fanmade-event: ${error.message}`);
  });
}

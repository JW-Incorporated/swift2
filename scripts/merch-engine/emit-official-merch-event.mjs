#!/usr/bin/env node
// Notifications Phase 2 producer seam for `official_merch`
// (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§10) — this task's
// instruction to "map where each existing pipeline currently emits its
// detections and document the exact seam you're using".
//
// SEAM: `merch-official-sync.yml`'s `author` job already computes exactly
// this signal — `authorOfficialCatalog()`'s `socialDraft.products` (the
// newly-added products this sync cycle, per docs/SPEC.merch-autonomy.md
// §6.4 "a batch of genuinely new products = a drop") — and stages a
// social/queue draft from it via build-drop-draft.mjs. This script is
// invoked from the SAME workflow step, right after that draft is built,
// reading the SAME `.official-social-draft.json` artifact — no new
// detection logic, one insertEvent() call per new product batch (a single
// `official_merch` event per drop cycle, not one per product, matching
// how the drop is already presented as one social post).
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (same pair news-worker.yml
// already uses) as new secrets on this workflow — see SETUP_NOTIFICATIONS.md.
// Degrades to a no-op (not a workflow failure) when unset, matching every
// other unconfigured-credential path in this repo's notifications code.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { insertEvent } from '@swift2/core';
import { serviceClient } from '../lib/supabase.mjs';

const SITE_URL = 'https://www.longlivets.com';
const SHOP_ANCHOR = '#merch-new-drops';

export async function emitOfficialMerchEvent(socialDraft, { db, now = new Date() } = {}) {
  const products = Array.isArray(socialDraft?.products) ? socialDraft.products : [];
  if (products.length === 0) return { emitted: false, reason: 'no-products' };
  if (!db) return { emitted: false, reason: 'no-db-client' };

  const names = products.map((p) => String(p?.item ?? '').trim()).filter(Boolean);
  const lead = names[0] ?? 'new merch';
  const more = products.length > 1 ? ` (+${products.length - 1} more)` : '';
  const day = now.toISOString().slice(0, 10);
  // Deterministic per calendar day + product-id set — a re-run of the same
  // detect/author cycle for the same drop (workflow retry, manual dispatch)
  // must not double-notify; a genuinely new drop later the same day WOULD
  // get a distinct set of sourceIds and a fresh dedupe_key.
  const ids = [...products]
    .map((p) => String(p?.sourceId ?? ''))
    .sort()
    .join('|');
  const dedupeKey = `official_merch:${day}:${ids}`;

  const result = await insertEvent(db, {
    category: 'official_merch',
    title: 'New in the official store',
    body: `${lead}${more}`,
    deepLink: `${SITE_URL}/?utm_source=push&utm_medium=notification&utm_campaign=merch-drop${SHOP_ANCHOR}`,
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
    throw new Error('usage: emit-official-merch-event.mjs --social-draft <path.json>');
  }
  const socialDraft = JSON.parse(await readFile(resolve(socialDraftPath), 'utf8'));
  const db = supabaseAdmin();
  if (!db) {
    console.log(
      'emit-official-merch-event: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — skipping (see SETUP_NOTIFICATIONS.md)',
    );
    return;
  }
  const result = await emitOfficialMerchEvent(socialDraft, { db });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Never fails the workflow — a notification-event miss must not block
    // the actual catalog PR from landing (same stage-isolation discipline
    // every other producer in this repo follows).
    console.error(`emit-official-merch-event: ${error.message}`);
  });
}

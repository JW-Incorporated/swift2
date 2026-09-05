#!/usr/bin/env node
// E4 store-drop social draft — turns author-catalogs.mjs's `socialDraft`
// output (already restated from sync-official.mjs's verified plan, never
// re-derived from raw Shopify data) into the X + Instagram queue pair
// social/queue/*.json expects. Pure/testable, same split as
// scripts/appearance-discovery/lib/social-draft.mjs: this module only
// builds the JSON; the workflow step separately renders the designed card
// image via scripts/social/render-card.mjs and passes its site path in.
//
// R2 (docs/SPEC.merch-autonomy.md): restates only observed catalog
// metadata — item name, product URL, and item COUNT (a plain array length,
// not a guess) — never a claim about price, stock, or content the plan
// didn't carry. No AI-generated imagery is used as product photography
// (the card is a designed text/stat card, declared mediaKind "site-screen",
// never "photo" — see checkMedia in scripts/social/check-drafts.mjs).
//
// Campaign pairing (scripts/social/check-drafts.mjs's unconditional rule):
// every real campaign ships both an X and an Instagram item with the same
// `campaign` value, so this always returns both drafts together or neither.

import { weightedTweetLength } from '../social/lib/x-length.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';

const X_MAX_WEIGHTED = 280;
const SAFETY_MARGIN_WEIGHTED = 10;
// Store drops post as soon as they clear CI/PR review, but the pipeline's own
// PR-to-merge lag needs headroom before queue.mjs's 48h isStaleDue cutoff
// retires the item to social/failed/ unattempted (see the appearance-
// discovery fast lane's SCHEDULE_DELAY_MS for the same reasoning + the
// real incident that established this margin).
const SCHEDULE_DELAY_MS = 6 * 60 * 60 * 1000;

const SITE_URL = 'https://www.longlivets.com';
const SHOP_ANCHOR = '#merch-new-drops';

function sanitize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().replace(/"/g, "'");
}

/** Deterministic, stable across re-runs of the same drop: sorted sourceIds
 * joined and hashed, so a re-authored identical plan doesn't mint a new
 * campaign key and split into an orphaned duplicate pair. */
function dropKey(products) {
  const ids = [...products].map((p) => String(p?.sourceId ?? '')).sort();
  let hash = 2166136261;
  for (const id of ids.join('|')) hash = Math.imul(hash ^ id.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(36);
}

function shopUrl(utmSource) {
  return `${SITE_URL}/?utm_source=${utmSource}&utm_medium=social&utm_campaign=merch-drop${SHOP_ANCHOR}`;
}

/**
 * Builds the X + Instagram queue pair for one authored store-drop
 * `socialDraft` (author-catalogs.mjs's `{ type: 'merch-drop-draft',
 * products: [{ sourceId, item, url }] }`). Returns `null` when there are no
 * products — a plan with zero added/updated/discontinued rows authors no
 * catalog change and stages no draft, same as any other zero-diff run.
 *
 * `mediaPath` is the already-rendered card's site-relative path (e.g.
 * `/social/library/merch-drop-<run>.png`) — this module never renders
 * images itself, mirroring the appearance-discovery split between
 * buildSocialDraftPair (pure) and fetchAppearanceThumbnail (network/fs).
 */
export function buildMerchDropDraftPair(socialDraft, { mediaPath, now = new Date() } = {}) {
  const products = Array.isArray(socialDraft?.products) ? socialDraft.products : [];
  if (products.length === 0) return null;
  if (!mediaPath || typeof mediaPath !== 'string') {
    throw new Error('buildMerchDropDraftPair requires mediaPath (the rendered card\'s site path)');
  }

  const names = products.map((p) => sanitize(p?.item)).filter(Boolean);
  const count = products.length;
  const day = now.toISOString().slice(0, 10);
  const campaign = `merch-drop:${day}:${dropKey(products)}`;

  const xUrl = shopUrl('x');
  const igUrl = shopUrl('instagram');

  const lead = names[0] ?? 'new merch';
  const more = count > 1 ? ` (+${count - 1} more)` : '';
  let xBody = `restocked on the official store: ${lead}${more}. grab it before it's gone\n\n${xUrl}`;
  if (weightedTweetLength(xBody) > X_MAX_WEIGHTED - SAFETY_MARGIN_WEIGHTED) {
    // Fall back to the count-only phrasing rather than truncate a product
    // name mid-word — a trimmed item name would misstate what's observed.
    xBody = `${count} new item${count === 1 ? '' : 's'} just restocked on the official store. shop them\n\n${xUrl}`;
  }
  const measured = weightedTweetLength(xBody);
  if (measured > X_MAX_WEIGHTED) {
    throw new Error(`merch-drop X draft over X's weighted ${X_MAX_WEIGHTED}-char limit (${measured}): ${xBody}`);
  }

  const igNames = names.slice(0, 3).join(', ') + (count > 3 ? `, and ${count - 3} more` : '');
  const igBody =
    `new drops alert — the official store's shelf just moved. ${count} new item${count === 1 ? '' : 's'} in, ` +
    `starting with ${igNames || lead}.\n\n` +
    `we pull this list straight off the store's own catalog, so what you see here is exactly what's live — ` +
    `nothing curated, nothing added.\n\n` +
    `browse the whole new-drops shelf on the site\n\n${igUrl}`;

  const why =
    `Auto-drafted by the E4 official-store sync's authoring lane (scripts/merch-engine/author-catalogs.mjs's ` +
    `authorOfficialCatalog) from sync-official.mjs's diff plan — ${count} product${count === 1 ? '' : 's'} ` +
    `newly added this cycle (docs/SPEC.merch-autonomy.md §6.4: "a batch of genuinely new products = a drop"). ` +
    `Restates only observed catalog metadata (item name, product URL, count) per R2 — no price, stock, or ` +
    `content claim beyond what the verified plan carried. Media is a designed stat card (scripts/social/` +
    `render-card.mjs, variant thread), declared mediaKind "site-screen" — never presented as product photography.`;

  const scheduledAt = new Date(now.getTime() + SCHEDULE_DELAY_MS).toISOString();

  return {
    campaign,
    drafts: [
      {
        filename: `${day}-merch-drop-${dropKey(products)}-x.json`,
        item: { platform: 'x', body: xBody, scheduledAt, campaign, why },
      },
      {
        filename: `${day}-merch-drop-${dropKey(products)}-ig.json`,
        item: {
          platform: 'instagram',
          body: igBody,
          media: [mediaPath],
          mediaKind: 'site-screen',
          scheduledAt,
          campaign,
          why,
        },
      },
    ],
  };
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const socialDraftPath = option(args, '--social-draft');
  const mediaPath = option(args, '--media-path');
  const outDir = option(args, '--out-dir');
  if (!socialDraftPath || !mediaPath || !outDir) {
    throw new Error('usage: build-drop-draft.mjs --social-draft <plan.json> --media-path </social/library/x.png> --out-dir social/queue');
  }
  const socialDraft = JSON.parse(await readFile(resolve(socialDraftPath), 'utf8'));
  const result = buildMerchDropDraftPair(socialDraft, { mediaPath });
  if (!result) {
    console.log(JSON.stringify({ staged: false, reason: 'no products in socialDraft' }));
    return;
  }
  await mkdir(resolve(outDir), { recursive: true });
  for (const draft of result.drafts) {
    const target = resolve(outDir, draft.filename);
    await writeFile(target, `${JSON.stringify(draft.item, null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify({ staged: true, campaign: result.campaign, files: result.drafts.map((d) => d.filename) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(main, { name: 'build-drop-draft' });
}

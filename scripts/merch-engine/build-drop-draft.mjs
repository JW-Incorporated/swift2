#!/usr/bin/env node
// E4 store-drop side door — turns author-catalogs.mjs's `authorOfficialCatalog()`
// output (already restated from sync-official.mjs's verified plan, never
// re-derived from raw Shopify data) into `social/inbox/*.json` intent fact
// sheets (Tree Overhaul T6, 2026-09-12 — merch stops writing captions).
// Pure/testable, same split as scripts/appearance-discovery/lib/social-draft.mjs:
// this module only builds the JSON; the workflow step separately renders the
// designed card image via scripts/social/render-card.mjs and passes its site
// path in.
//
// R2 (docs/SPEC.merch-autonomy.md): restates only observed catalog
// metadata — item name, product URL, price/availability when the plan
// carried them, and item COUNT (a plain array length, not a guess) — never
// a claim about content the plan didn't carry. No AI-generated imagery is
// used as product photography (the card is a designed text/stat card,
// which the intent's `media` points at; Tree's own daily draft decides how
// to caption/declare it, this lane writes no caption at all).
//
// One intent per newly-added product (T6 spec's `facts` shape is singular —
// one item's name/price/availability — not a batched drop summary).

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { slugify } from '../lib/longlive-sync-shared.mjs';
import { validateIntent } from '../social/lib/inbox.mjs';
import { runMain } from '../lib/cli.mjs';

// merch lane deadline (T6 spec's Deadlines table): a drop stays newsworthy
// for about three days.
const MERCH_DEADLINE_MS = 72 * 60 * 60 * 1000;

function sanitize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().replace(/"/g, "'");
}

/** Strips a leading currency symbol/space from sync-official.mjs's
 * pre-formatted `price` string (e.g. "$58.00" -> "58.00") — the intent's
 * `facts.price` is a bare amount, `facts.currency` names the currency
 * separately. This store's price() helper always formats USD. */
function bareAmount(formatted) {
  return String(formatted ?? '').replace(/^[^0-9]+/, '').trim();
}

/**
 * Builds one `social/inbox/*.json` intent per newly-added product from
 * `authorOfficialCatalog()`'s catalog rows (full-field: `item`, `url`,
 * `price` when observed, `inStock`, `discoveredAt`). Returns `[]` when
 * there are no products — a plan with zero added rows authors no catalog
 * change and stages no intent, same as any other zero-diff run.
 *
 * `mediaPath` is the already-rendered card's site-relative path (e.g.
 * `/social/library/merch-drop-<run>.png`) — this module never renders
 * images itself. Every intent from the same run shares it: this lane's
 * only image asset is the one aggregate drop card, per-product photography
 * is out of scope here (PLAN.md T1 step 9 keeps card rendering unchanged).
 */
export function buildMerchDropIntents(products, { mediaPath, now = new Date() } = {}) {
  const rows = Array.isArray(products) ? products : [];
  if (rows.length === 0) return [];
  if (!mediaPath || typeof mediaPath !== 'string') {
    throw new Error('buildMerchDropIntents requires mediaPath (the rendered card\'s site path)');
  }

  const day = now.toISOString().slice(0, 10);
  const createdAt = now.toISOString();
  const deadline = new Date(now.getTime() + MERCH_DEADLINE_MS).toISOString();

  return rows.map((product) => {
    const name = sanitize(product?.item);
    const amount = bareAmount(product?.price);
    const facts = {
      name,
      ...(amount ? { price: amount, currency: 'USD' } : {}),
      availability: product?.inStock === false ? 'out of stock' : 'in stock',
      productUrl: product?.url,
      firstSeenAt: typeof product?.discoveredAt === 'string' ? product.discoveredAt : createdAt,
    };
    return {
      v: 1,
      id: `merch-${day}-${slugify(name)}`,
      source: 'merch-official-sync',
      lane: 'merch',
      createdAt,
      deadline,
      status: 'open',
      facts,
      media: [mediaPath],
      mediaCredit: 'Long Live merch-drop card, rendered from the official store listing',
      mediaSource: product?.url,
      altTextHint: `A Long Live store-drop card naming "${name}" as newly available on the official store.`,
      links: { pr: null, issue: null },
    };
  });
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
  const intentOutDir = option(args, '--intent-out');
  if (!socialDraftPath || !mediaPath || !intentOutDir) {
    throw new Error('usage: build-drop-draft.mjs --social-draft <plan.json> --media-path </social/library/x.png> --intent-out social/inbox');
  }
  const socialDraft = JSON.parse(await readFile(resolve(socialDraftPath), 'utf8'));
  const intents = buildMerchDropIntents(socialDraft?.products, { mediaPath });
  if (intents.length === 0) {
    console.log(JSON.stringify({ staged: false, reason: 'no products in socialDraft' }));
    return;
  }
  await mkdir(resolve(intentOutDir), { recursive: true });
  const files = [];
  for (const intent of intents) {
    const findings = validateIntent(intent);
    if (findings.length) throw new Error(`build-drop-draft: invalid intent for ${intent.id}: ${findings.join('; ')}`);
    const filename = `${intent.id}.json`;
    const target = resolve(intentOutDir, filename);
    await writeFile(target, `${JSON.stringify(intent, null, 2)}\n`, 'utf8');
    files.push(filename);
  }
  console.log(JSON.stringify({ staged: true, files }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(main, { name: 'build-drop-draft' });
}

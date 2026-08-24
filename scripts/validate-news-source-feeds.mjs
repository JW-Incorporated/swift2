#!/usr/bin/env node
// Validates every `rss`/`google_news` `news_source` seed migration's feed
// URL — PLAN.md Stage 1's "verify each like the 7/19 seed did" bar: HTTP
// 200, valid RSS/Atom, >=10 items, channel title/description confirming the
// Taylor-specific tag/topic/spotlight (not a general section feed). The 7/19
// seed did this by hand, once; codified here (CLAUDE.md rule 8 — second
// occurrence of a procedural task gets a script) so re-seeding or adding a
// feed later re-runs the same bar instead of a fresh ad-hoc curl session.
//
// Reads URLs straight out of the migration SQL (single source of truth —
// never hand-copy a feed list here and let it drift from what's actually
// seeded). Read-only, deterministic, network-dependent; not a CI gate (a
// feed can go down without that being this repo's bug) — a report a human
// or agent runs before adding/re-verifying a source.
//
// Usage:
//   node scripts/validate-news-source-feeds.mjs            # human-readable
//   node scripts/validate-news-source-feeds.mjs --json      # machine-readable

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const JSON_OUT = process.argv.includes('--json');
const TIMEOUT_MS = 15000;
const MIN_ITEMS = 10;
const USER_AGENT =
  'Mozilla/5.0 (compatible; LongLiveNewsSourceValidator/1.0; +https://longlivets.com)';

/* global AbortSignal */

/** Pulls every `('Name', 'rss'|'google_news', 'tier', '{"url":"..."}')` triple out of the seed migrations. */
function extractSeeds(sql) {
  const seeds = [];
  const rowRe =
    /\(\s*'((?:[^'\\]|\\.)*)',\s*'(rss|google_news)',\s*'(\w+)',\s*'(\{[^}]*\})'\s*\)/g;
  let m;
  while ((m = rowRe.exec(sql))) {
    const [, name, sourceType, tier, configJson] = m;
    let url;
    try {
      url = JSON.parse(configJson).url;
    } catch {
      continue;
    }
    if (url) seeds.push({ name: name.replace(/\\'/g, "'"), sourceType, tier, url });
  }
  return seeds;
}

async function loadAllSeeds() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const seeds = [];
  for (const file of files) {
    const text = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    for (const seed of extractSeeds(text)) seeds.push({ ...seed, file });
  }
  return seeds;
}

async function checkFeed(url) {
  const ac = AbortSignal.timeout(TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ac,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!(res.status >= 200 && res.status < 300)) {
      return { ok: false, status: res.status, reason: `HTTP ${res.status}` };
    }
    const body = await res.text();
    const itemCount = (body.match(/<item[\s>]/g) || []).length;
    // Everything before the first <item> is the <channel> block — title,
    // description, and link are all matched against just that slice so an
    // item's own content never counts as "the channel confirms the tag."
    const itemIdx = body.indexOf('<item');
    const channelBlock = itemIdx === -1 ? body : body.slice(0, itemIdx);
    const titleMatch = channelBlock.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = channelBlock.match(/<description>([\s\S]*?)<\/description>/);
    // Some feeds (e.g. NYT's collection feeds) carry a generic channel
    // title/description but a <link> that unambiguously names the
    // Taylor-specific spotlight/tag/topic page — that link counts too.
    const linkMatch = channelBlock.match(/<link>([\s\S]*?)<\/link>/);
    const channelText = `${titleMatch?.[1] ?? ''} ${descMatch?.[1] ?? ''}`;
    const looksTaylorScoped = /taylor/i.test(channelText) || /taylor/i.test(linkMatch?.[1] ?? '');
    if (itemCount < MIN_ITEMS) {
      return { ok: false, status: res.status, reason: `only ${itemCount} items (need >=${MIN_ITEMS})` };
    }
    if (!looksTaylorScoped) {
      return {
        ok: false,
        status: res.status,
        reason: `channel title/description does not mention Taylor: "${channelText.trim().slice(0, 80)}"`,
      };
    }
    return { ok: true, status: res.status, itemCount, channelText: channelText.trim().slice(0, 80) };
  } catch (err) {
    return { ok: false, status: null, reason: err.message };
  }
}

async function main() {
  const seeds = await loadAllSeeds();
  const results = [];
  for (const seed of seeds) {
    const result = await checkFeed(seed.url);
    results.push({ ...seed, ...result });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`Validated ${results.length} news_source feed(s):\n`);
    for (const r of results) {
      const status = r.ok ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${r.name} (${r.sourceType}, ${r.tier})`);
      console.log(`       ${r.url}`);
      console.log(
        r.ok
          ? `       ${r.itemCount} items, channel: "${r.channelText}"`
          : `       ${r.reason}`,
      );
    }
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed.`);
    if (failed.length > 0) {
      console.log(`Failed: ${failed.map((f) => f.name).join(', ')}`);
    }
  }

  process.exitCode = 0; // reporting tool, never a CI gate — a feed going down later isn't this repo's bug
}

main();

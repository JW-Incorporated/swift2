#!/usr/bin/env node
// Facebook export ingest (Community Engine plan
// docs/proposals/2026-09-06-community-engine-plan.md §2.4, Phase 1 card P1-3).
//
// Turns each saved "Webpage, Complete" export Joey uploads to the private
// `facebook-exports` Storage bucket (scripts/knowledge-fb-upload.mjs,
// HUMAN-ACTIONS.md #16) into:
//   1. one `fan_signal` row per group per export (reuses
//      apps/worker/src/sources/facebook-groups-parser.ts's
//      `parseFacebookExport` verbatim — same aggregate-only, redline-screened,
//      hashed-author draft the plan already specced for E4's fan_signal half);
//   2. `engagement_lead` rows, `platform='facebook'`, `kind='hot_thread'`,
//      `url=null`, one per surviving post, ranked by reactions+comments (§2.4
//      step 2) — `locator` is "<group name> — <first 80 chars of post text>"
//      so Joey can find the post again by scrolling the group himself
//      (private groups have no permalink this may store, per the schema
//      comment on `engagement_lead.locator`);
//   3. a shop-link side-output file (JSON) for E5's fan-merch widen (§3.5,
//      card P2-7) — any Etsy/Shopify/allowed-domain URL found in post text,
//      same `SHOP_DOMAIN_ALLOWLIST`/`SHOP_DOMAIN_SUFFIX_ALLOWLIST` E5 already
//      curates against (scripts/merch-engine/fanmade-sources.mjs). This
//      script only emits candidates — the same judged curation lane
//      (`curateCandidate` in fanmade-discovery.mjs) still gates anything
//      before it reaches a seed. Leads only, per §3.5: "the merch section
//      shows the shop, never the poster."
//
// GUARDRAILS (plan §6, non-negotiable):
// - No network to Facebook of any kind. Input is a file path/buffer Joey
//   already saved and uploaded by hand — this script never touches Facebook.
// - Every post is redline-screened before anything derived from it survives
//   (parseFacebookExport already does this for the fan_signal path; this
//   script re-screens per-post before building an engagement_lead or a
//   shop-link candidate, so a screened-out post contributes to NEITHER).
// - Hashed authors only; no raw post bodies ever reach an `engagement_lead`
//   row — `context` is our own truncated/summarized slice, `locator` is a
//   short excerpt already meant to be human-readable for Joey's own recall,
//   not a comment body being fed to an LLM downstream unscreened.
// - A Facebook engagement_lead never quotes or names a group member (§2.4
//   step 3) — the excerpt used for `locator`/`context` strips the author
//   entirely (parseFacebookExport's own `extractPostsFromHtml` already does
//   this: `withoutAuthorTag` before `text` is derived).
// - Idempotent: re-running against the same file must not duplicate leads.
//   `engagement_lead`'s own unique index
//   (platform, coalesce(thread_id, locator), kind) — see the P0-1 migration —
//   is the actual dedupe backstop; `on conflict do nothing` here just avoids
//   a noisy insert error on a legitimate re-run (e.g. a retried dispatch).
//
// Ranking (§2.4 step 2, "ranks posts by reactions+comments"): posts are
// ordered by `reactionCount + commentCount * 2` descending (same weighting
// facebook-groups-parser.ts's own heat formula already uses for
// MAX_REACTIONS_SIGNAL, kept consistent rather than inventing a second
// scale) before slicing to `--max-leads-per-group` (default 10, generous
// headroom under the Answerer's own per-run caps in §2.5 point 7).
//
//   node scripts/community/fb-export-ingest.mjs --group taylor-swifts-vault ~/Downloads/fb-taylor-swifts-vault-2026-09-07.html
//   node scripts/community/fb-export-ingest.mjs --group taylor-swifts-vault --dry-run <file>
//
// `--group` is the slug used in `community`/`locator` (matches
// `scripts/knowledge/fb-groups-checklist.mjs`'s `slug` and the
// `community_watchlist` seed's `facebook:<slug>` id). The human-readable
// name used in `locator` is looked up from that checklist by slug;
// `--group-name "Human Name"` overrides it for a group not yet in the
// checklist.
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (same as
// knowledge-fb-upload.mjs) unless --dry-run is set, in which case nothing is
// written and the computed rows print to stdout instead.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFacebookExport, extractPostsFromHtml } from '../../apps/worker/src/sources/facebook-groups-parser.ts';
import { screenTopic } from '@swift2/shared/redline';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { FB_GROUPS_CHECKLIST } from '../knowledge/fb-groups-checklist.mjs';

const MAX_LOCATOR_EXCERPT = 80;
const DEFAULT_MAX_LEADS_PER_GROUP = 10;

/** Resolves the human-readable group name for `locator`: explicit override,
 * then a lookup by slug in `scripts/knowledge/fb-groups-checklist.mjs`
 * (§2.4's checklist already carries `label` per group), falling back to the
 * slug itself for a group not yet added there. */
export function resolveGroupName(slug, { groupNameOverride, checklist = FB_GROUPS_CHECKLIST } = {}) {
  return groupNameOverride || checklist.find((g) => g.slug === slug)?.label || slug;
}

function parseArgs(argv) {
  const flags = { dryRun: false, group: null, maxLeadsPerGroup: DEFAULT_MAX_LEADS_PER_GROUP, files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--group') {
      flags.group = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === '--max-leads-per-group') {
      flags.maxLeadsPerGroup = Number(argv[i + 1]) || DEFAULT_MAX_LEADS_PER_GROUP;
      i += 1;
    } else if (arg === '--shop-links-out') {
      flags.shopLinksOut = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === '--group-name') {
      flags.groupName = argv[i + 1] ?? null;
      i += 1;
    } else if (!arg.startsWith('--')) {
      flags.files.push(arg);
    }
  }
  return flags;
}

/** Shop domains E5 already curates against — mirrored, not imported: this
 * file lives under scripts/community while the allowlist lives under
 * scripts/merch-engine, and importing across those trees would blur a real
 * ownership boundary (fan-merch curation owns its own allowlist; this file
 * only needs read access to the same values). If E5's allowlist changes,
 * update both — same convention as redline.ts's SEXUALIZATION_TERMS mirror. */
const SHOP_DOMAIN_ALLOWLIST = ['etsy.com', 'www.etsy.com', 'shop.app'];
const SHOP_DOMAIN_SUFFIX_ALLOWLIST = ['.myshopify.com'];
const URL_RE = /https?:\/\/[^\s)>\]"']+/g;

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isAllowedShopUrl(value) {
  const url = canonicalUrl(value);
  if (!url) return false;
  const hostname = new URL(url).hostname;
  return (
    SHOP_DOMAIN_ALLOWLIST.includes(hostname) ||
    SHOP_DOMAIN_SUFFIX_ALLOWLIST.some((suffix) => hostname.endsWith(suffix))
  );
}

/** Shop-link candidates found in screened post text — leads only (§3.5). */
export function shopLinksFromPosts(posts, { groupSlug }) {
  const found = [];
  for (const post of posts) {
    const urls = post.text.match(URL_RE) ?? [];
    for (const raw of urls) {
      const url = canonicalUrl(raw);
      if (url && isAllowedShopUrl(url)) {
        found.push({ url, groupSlug, discoveredVia: 'facebook-export' });
      }
    }
  }
  // Dedupe by url — the same shop link posted in multiple threads is one
  // candidate, not N.
  const byUrl = new Map();
  for (const item of found) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  return [...byUrl.values()];
}

/** First `MAX_LOCATOR_EXCERPT` chars of screened post text, used for both
 * `locator` (how Joey finds the post again) and `context` (our-words
 * summary, never a raw quote used downstream — see header). */
function excerpt(text) {
  return text.length > MAX_LOCATOR_EXCERPT ? `${text.slice(0, MAX_LOCATOR_EXCERPT)}…` : text;
}

/**
 * Builds the `engagement_lead` rows for one group's screened posts, ranked
 * by reactions+comments*2 descending (§2.4 step 2 weighting, matches
 * facebook-groups-parser.ts's own heat formula), capped at
 * `maxLeadsPerGroup`.
 */
export function engagementLeadsFromPosts(posts, { groupName, groupSlug, maxLeadsPerGroup = DEFAULT_MAX_LEADS_PER_GROUP }) {
  const ranked = [...posts].sort(
    (a, b) => b.reactionCount + b.commentCount * 2 - (a.reactionCount + a.commentCount * 2),
  );
  return ranked.slice(0, maxLeadsPerGroup).map((post) => {
    const short = excerpt(post.text);
    return {
      platform: 'facebook',
      community: `facebook:${groupSlug}`,
      kind: 'hot_thread',
      thread_id: null,
      url: null,
      locator: `${groupName} — ${short}`,
      title: null,
      context: short,
      relevance: null,
      matched_doc_ids: [],
      target_url: null,
      draft: null,
      draft_alt: null,
      link_included: null,
      status: 'new',
      redline_ok: true, // every post here already survived screenTopic (see ingestExport)
    };
  });
}

/**
 * Ingests one saved export file for one group. Pure aside from the
 * filesystem read the caller already did — takes `html` + group identity,
 * returns `{ fanSignal, engagementLeads, shopLinks, skippedRedlineCount }`.
 * Re-screens per-post (parseFacebookExport already screens internally for
 * the fan_signal aggregate; this recomputes the same screened set so the
 * lead/shop-link outputs never include a post the fan_signal path dropped).
 */
export function buildIngestResult(html, { groupSlug, groupName, exportedAt, maxLeadsPerGroup }) {
  const fanSignal = parseFacebookExport(html, { groupSlug, exportedAt });
  const allPosts = extractPostsFromHtml(html);
  const screenedPosts = allPosts.filter((post) => screenTopic(post.text) === null);
  const engagementLeads = engagementLeadsFromPosts(screenedPosts, {
    groupName,
    groupSlug,
    maxLeadsPerGroup,
  });
  const shopLinks = shopLinksFromPosts(screenedPosts, { groupSlug });
  return {
    fanSignal,
    engagementLeads,
    shopLinks,
    skippedRedlineCount: allPosts.length - screenedPosts.length,
  };
}

async function writeResult(supabase, result) {
  const { error: fanSignalError } = await supabase.from('fan_signal').insert(result.fanSignal);
  if (fanSignalError) throw new Error(`fan_signal insert failed: ${fanSignalError.message}`);

  // The dedupe backstop is a unique INDEX over an expression
  // (platform, coalesce(thread_id, locator), kind) — see the P0-1 migration
  // comment explaining why it's an index rather than a table constraint.
  // PostgREST's upsert `on_conflict` target inference only works against a
  // plain-column unique constraint, not an expression index, so a plain
  // `.insert()` + catching the resulting 23505 is the correct dedupe path
  // here (same pattern emit-official-youtube-event.mjs's insertEvent()
  // uses for its own dedupe_key unique constraint).
  let inserted = 0;
  let deduped = 0;
  for (const lead of result.engagementLeads) {
    const { error } = await supabase.from('engagement_lead').insert(lead);
    if (error?.code === '23505') {
      deduped += 1;
      continue;
    }
    if (error) throw new Error(`engagement_lead insert failed: ${error.message}`);
    inserted += 1;
  }
  return { fanSignalInserted: true, leadsInserted: inserted, leadsDeduped: deduped };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (!flags.group) {
    console.error('fb-export-ingest: usage: --group <slug> [--group-name "Human Name"] [--dry-run] [--max-leads-per-group N] <file.html> [more files...]');
    return 1;
  }
  if (flags.files.length === 0) {
    console.error('fb-export-ingest: no export files given.');
    return 1;
  }

  const supabase = flags.dryRun ? null : serviceClient();
  if (!flags.dryRun && !supabase) {
    console.error('fb-export-ingest: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env).');
    return 1;
  }

  const groupName = resolveGroupName(flags.group, { groupNameOverride: flags.groupName });
  let exitCode = 0;
  const allShopLinks = [];

  for (const filePath of flags.files) {
    let html;
    try {
      html = readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`fb-export-ingest: could not read ${filePath}: ${err.message}`);
      exitCode = 1;
      continue;
    }
    const result = buildIngestResult(html, {
      groupSlug: flags.group,
      groupName,
      exportedAt: new Date(),
      maxLeadsPerGroup: flags.maxLeadsPerGroup,
    });
    allShopLinks.push(...result.shopLinks);

    console.log(
      `fb-export-ingest: ${filePath} — ${result.fanSignal.volume} post(s) kept, ` +
        `${result.skippedRedlineCount} screened out, ${result.engagementLeads.length} lead(s), ` +
        `${result.shopLinks.length} shop-link candidate(s)`,
    );

    if (flags.dryRun) {
      console.log(JSON.stringify(result, null, 2));
      continue;
    }
    const written = await writeResult(supabase, result);
    console.log(
      `fb-export-ingest: wrote fan_signal + ${written.leadsInserted} engagement_lead row(s)` +
        (written.leadsDeduped ? ` (${written.leadsDeduped} already existed, skipped)` : ''),
    );
  }

  if (flags.shopLinksOut && allShopLinks.length > 0) {
    writeFileSync(flags.shopLinksOut, JSON.stringify(allShopLinks, null, 2));
    console.log(`fb-export-ingest: wrote ${allShopLinks.length} shop-link candidate(s) to ${flags.shopLinksOut}`);
  }

  return exitCode;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fb-export-ingest' });
}

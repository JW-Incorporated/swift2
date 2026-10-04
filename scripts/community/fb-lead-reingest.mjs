#!/usr/bin/env node
// Regenerates clean Facebook `engagement_lead` rows from the exports already
// saved in the private `facebook-exports` Storage bucket, after the #4885
// parser fix. The repair half of `fb-lead-scrub.mjs` — scrub deletes the
// contaminated rows, this re-creates them from the same source material with
// the fixed parser.
//
// WHY THIS EXISTS RATHER THAN `knowledge:fb-export`: the full export run
// (scripts/knowledge/fb-export-run.mjs) drives a real Chrome against
// Facebook from Joey's own Windows machine — it cannot run in CI or in a
// sandbox, and it is not needed here: the HTML the contaminated rows were
// derived from is already uploaded and unchanged. This script reads those
// files back and re-runs ONLY the lead half of the ingest.
//
// LEADS ONLY, DELIBERATELY. `fan_signal` is NOT re-inserted. Those rows hold
// aggregates only (volume/heat/our-words summary — never a name or an
// excerpt), so they were never contaminated; and `fan_signal` has no unique
// constraint, so re-inserting would silently duplicate a week's signal.
// Leads are protected by `engagement_lead`'s own dedupe index
// (platform, coalesce(thread_id, locator), kind), so a re-run is idempotent.
//
// SAFETY: dry-run is the DEFAULT. Nothing is written without `--apply`.
//
//   node scripts/community/fb-lead-reingest.mjs                 # dry run, prints the plan
//   node scripts/community/fb-lead-reingest.mjs --apply
//   node scripts/community/fb-lead-reingest.mjs --group the-swifties-society --apply
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (service-role: private
// bucket read + RLS'd table write, same pair as fb-export-ingest.mjs).

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { BUCKET } from '../knowledge-fb-upload.mjs';
import { FB_GROUPS_CHECKLIST } from '../knowledge/fb-groups-checklist.mjs';
import { engagementLeadsFromPosts, resolveGroupName } from './fb-export-ingest.mjs';
import { extractPostsFromHtml } from '../../apps/worker/src/sources/facebook-groups-parser.ts';
import { screenTopic } from '@swift2/shared/redline';

/** `fb-<slug>-<YYYY-MM-DD>.html` — the name knowledge-fb-upload.mjs stores. */
const EXPORT_NAME_RE = /^fb-(.+)-(\d{4}-\d{2}-\d{2})\.html$/;

/** Parses a stored export's object name back into `{ slug, date }`, or null. */
export function parseExportName(name) {
  const m = EXPORT_NAME_RE.exec(name);
  return m ? { slug: m[1], date: m[2] } : null;
}

/**
 * The newest stored export per group slug. One export per group per week is
 * the intended cadence (§4.7), and re-ingesting several weeks at once would
 * resurrect stale leads, so this picks only the latest file per slug.
 * `slugs` (when given) restricts the result to those groups.
 */
export function latestExportPerGroup(objects, { slugs = null } = {}) {
  const latest = new Map();
  for (const object of objects) {
    const parsed = parseExportName(object.name);
    if (!parsed) continue;
    if (slugs && !slugs.includes(parsed.slug)) continue;
    const current = latest.get(parsed.slug);
    if (!current || parsed.date > current.date) latest.set(parsed.slug, { ...parsed, name: object.name });
  }
  return [...latest.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function parseArgs(argv) {
  const flags = { apply: false, group: null, maxLeadsPerGroup: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--apply') flags.apply = true;
    else if (argv[i] === '--group') {
      flags.group = argv[i + 1] ?? null;
      i += 1;
    } else if (argv[i] === '--max-leads-per-group') {
      flags.maxLeadsPerGroup = Number(argv[i + 1]) || undefined;
      i += 1;
    }
  }
  return flags;
}

/** Re-derives one group's leads from stored export HTML with the fixed parser. */
export function leadsFromExportHtml(html, { slug, maxLeadsPerGroup }) {
  const groupName = resolveGroupName(slug);
  const allPosts = extractPostsFromHtml(html);
  const screened = allPosts.filter((post) => screenTopic(post.text) === null);
  const leads = engagementLeadsFromPosts(screened, {
    groupName,
    groupSlug: slug,
    ...(maxLeadsPerGroup ? { maxLeadsPerGroup } : {}),
  });
  return { leads, postCount: allPosts.length, screenedOut: allPosts.length - screened.length };
}

async function insertLeads(supabase, leads) {
  let inserted = 0;
  let deduped = 0;
  for (const lead of leads) {
    const { error } = await supabase.from('engagement_lead').insert(lead);
    // 23505 = the dedupe index already holds this lead (see header).
    if (error?.code === '23505') {
      deduped += 1;
      continue;
    }
    if (error) throw new Error(`engagement_lead insert failed: ${error.message}`);
    inserted += 1;
  }
  return { inserted, deduped };
}

/** Storage `list()` page size. The API caps a single page, so pages are walked. */
const LIST_PAGE_SIZE = 100;

/** Every object in the bucket, walking `list()`'s pages rather than assuming one. */
async function listAllExports(supabase) {
  const all = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: LIST_PAGE_SIZE, offset });
    if (error) throw new Error(`could not list "${BUCKET}": ${error.message}`);
    const page = data ?? [];
    all.push(...page);
    if (page.length < LIST_PAGE_SIZE) return all;
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const supabase = serviceClient();
  if (!supabase) {
    console.error('fb-lead-reingest: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env).');
    return 1;
  }

  const slugs = flags.group ? [flags.group] : FB_GROUPS_CHECKLIST.map((g) => g.slug);
  const objects = await listAllExports(supabase);

  const exports_ = latestExportPerGroup(objects ?? [], { slugs });
  if (exports_.length === 0) {
    console.log(`fb-lead-reingest: no stored exports found in "${BUCKET}" for the requested group(s) — nothing to re-ingest.`);
    return 0;
  }
  console.log(`fb-lead-reingest: ${exports_.length} stored export(s) to re-ingest (newest per group).`);

  let totalInserted = 0;
  let totalDeduped = 0;
  for (const item of exports_) {
    const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(item.name);
    if (downloadError) {
      console.error(`fb-lead-reingest: could not download ${item.name}: ${downloadError.message}`);
      continue;
    }
    const html = typeof blob.text === 'function' ? await blob.text() : Buffer.from(await blob.arrayBuffer()).toString('utf8');
    const { leads, postCount, screenedOut } = leadsFromExportHtml(html, {
      slug: item.slug,
      maxLeadsPerGroup: flags.maxLeadsPerGroup,
    });
    console.log(
      `  ${item.name}: ${postCount} post(s) parsed, ${screenedOut} screened out, ${leads.length} lead(s)`,
    );
    if (!flags.apply) continue;
    const { inserted, deduped } = await insertLeads(supabase, leads);
    totalInserted += inserted;
    totalDeduped += deduped;
    console.log(`    wrote ${inserted} lead(s)${deduped ? ` (${deduped} already existed, skipped)` : ''}`);
  }

  if (!flags.apply) {
    console.log('fb-lead-reingest: dry run (default) — pass --apply to write these leads.');
    return 0;
  }
  console.log(
    `fb-lead-reingest: inserted ${totalInserted} engagement_lead row(s)` +
      (totalDeduped ? `, ${totalDeduped} already existed` : '') + '.',
  );
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fb-lead-reingest' });
}

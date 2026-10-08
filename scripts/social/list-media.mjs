#!/usr/bin/env node
// Instagram media audit — lists every post actually live on the linked IG
// business account (not just what this repo's social/posted/ log thinks
// happened, which can drift: a post here doesn't record whether a human
// later deleted it, and Instagram's Content Publishing API has no delete
// operation at all — see scripts/social/delete-media.mjs's header). Flags
// likely duplicates so a founder can hand-delete them in the app.
//
// Run by hand via .github/workflows/social-audit.yml (workflow_dispatch
// only — this is an audit tool, never scheduled). Requires the same
// IG_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID secrets social-poster.yml uses.
//
// Usage: IG_ACCESS_TOKEN=... IG_BUSINESS_ACCOUNT_ID=... node scripts/social/list-media.mjs
//   Prints a Markdown report to stdout. If REPORT_PATH is set, also writes
//   the report there (what the workflow uses to hand the body to `gh issue`).

import { writeFile } from 'node:fs/promises';
import { GRAPH_VERSION } from './lib/platforms.mjs';

const FIELDS = 'id,caption,permalink,timestamp,media_url,media_type';

// A duplicate is flagged on either of two DISJOINT signals:
//   - Two captions share an identical first PREFIX_LEN-char prefix but then
//     DIVERGE — the "same draft, edited tail" case (a re-post authored from
//     the same source text with a tweak). No time bound: an 80-char verbatim
//     match this specific is essentially never a coincidence, however far
//     apart the posts landed.
//   - Two captions are IDENTICAL in full, within DUPLICATE_WINDOW_HOURS of
//     each other — the "accidentally posted twice" case. Time-bound on
//     purpose: a short caption/catchphrase ("new era, who dis?") CAN be a
//     deliberate callback reused much later, which shouldn't read as a
//     scheduling mistake just because the text matches.
const PREFIX_LEN = 80;
const DUPLICATE_WINDOW_HOURS = 24;

/** Paginates graph.facebook.com/{ver}/{igUserId}/media until `paging.next` runs out. */
export async function fetchAllMedia({ igUserId, accessToken, fetchImpl = fetch, graphVersion = GRAPH_VERSION }) {
  let url = `https://graph.facebook.com/${graphVersion}/${igUserId}/media?fields=${FIELDS}&access_token=${encodeURIComponent(accessToken)}`;
  const all = [];
  let guard = 0;
  while (url) {
    if (++guard > 500) throw new Error('list-media: pagination exceeded 500 pages — probably a paging.next loop, aborting.');
    const res = await fetchImpl(url);
    const body = await res.json();
    if (!res.ok) throw new Error(`IG media list failed (${res.status}): ${JSON.stringify(body)}`);
    all.push(...(body.data ?? []));
    url = body.paging?.next ?? null;
  }
  return all;
}

/**
 * Groups posts that look like duplicates of one another. Returns an array of
 * groups (each an array of 2+ posts), every post in at most one group.
 */
export function findDuplicates(items) {
  const sorted = [...items].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const used = new Set();
  const groups = [];

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i].id)) continue;
    const captionA = sorted[i].caption ?? '';
    const prefixA = captionA.slice(0, PREFIX_LEN);
    const group = [sorted[i]];

    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(sorted[j].id)) continue;
      const captionB = sorted[j].caption ?? '';
      const identical = Boolean(captionA) && captionA === captionB;

      const divergingPrefixMatch = !identical && prefixA && captionB.slice(0, PREFIX_LEN) === prefixA;
      const identicalWithinWindow =
        identical && Math.abs(new Date(sorted[j].timestamp).getTime() - new Date(sorted[i].timestamp).getTime()) <= DUPLICATE_WINDOW_HOURS * 3600 * 1000;

      if (divergingPrefixMatch || identicalWithinWindow) group.push(sorted[j]);
    }

    if (group.length > 1) {
      for (const g of group) used.add(g.id);
      groups.push(group);
    }
  }
  return groups;
}

function captionPreview(caption, len = 100) {
  const flat = (caption ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > len ? `${flat.slice(0, len)}…` : flat || '(no caption)';
}

/** Builds the Markdown report: every post, then a flagged-duplicates section. */
export function buildReport(items, duplicateGroups, generatedAt = new Date()) {
  const lines = [
    '# Instagram media audit',
    '',
    `Generated ${generatedAt.toISOString()} — ${items.length} post(s) total, ${duplicateGroups.length} possible duplicate group(s) flagged.`,
    '',
    'Instagram\'s Content Publishing API cannot delete published media (confirmed in scripts/social/delete-media.mjs) — any duplicate below needs a founder to delete it by hand in the Instagram app.',
    '',
    '## All posts (newest first)',
    '',
  ];

  const byNewest = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  for (const it of byNewest) {
    lines.push(`- \`${it.timestamp}\` [${it.media_type ?? 'POST'}](${it.permalink}) — "${captionPreview(it.caption)}"`);
  }

  lines.push('', '## Flagged duplicates', '');
  if (!duplicateGroups.length) {
    lines.push('None found.');
  } else {
    duplicateGroups.forEach((group, i) => {
      lines.push(`### Possible duplicate group ${i + 1} (${group.length} posts)`, '');
      for (const it of group) {
        lines.push(`- \`${it.timestamp}\` ${it.permalink} — "${captionPreview(it.caption)}"`);
      }
      lines.push('');
    });
  }

  return lines.join('\n') + '\n';
}

async function main() {
  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    console.error('list-media: IG_BUSINESS_ACCOUNT_ID and IG_ACCESS_TOKEN are required.');
    process.exit(1);
  }

  const items = await fetchAllMedia({ igUserId, accessToken });
  const duplicates = findDuplicates(items);
  const report = buildReport(items, duplicates);

  console.log(report);

  if (process.env.REPORT_PATH) {
    await writeFile(process.env.REPORT_PATH, report);
    console.error(`list-media: wrote report to ${process.env.REPORT_PATH}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('list-media.mjs')) {
  main().catch((err) => {
    console.error(`list-media: crashed: ${err.stack ?? err}`);
    process.exit(1);
  });
}

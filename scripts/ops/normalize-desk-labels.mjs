#!/usr/bin/env node
// Self-heals ambiguous desk ownership (#6163): an OPEN issue carrying 2+
// `desk:*` labels keeps only the one added MOST RECENTLY — a re-route means the
// latest desk owns it. scripts/check-work-ownership.mjs counts such an issue as
// `ambiguous`, and nothing removed the earlier label (routine-failure-triage
// stamps `desk:ops`; later re-routes add `desk:ops-fix` / `desk:build`).
//
// Leaves an issue alone (and logs why) when `desk:unowned` is among its desks,
// or when the event history cannot name a single newest desk label.
//
// Usage:
//   node --use-env-proxy scripts/ops/normalize-desk-labels.mjs            # dry run (default)
//   node --use-env-proxy scripts/ops/normalize-desk-labels.mjs --apply     # remove the stale labels
import { gh as ghRun } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';
import { isMain } from '../lib/is-main.mjs';
import { deskLabels, isExempt } from '../check-work-ownership.mjs';
import { apiFor, listIssuesByLabels } from '../marjorie/lib/issues-rest.mjs';

export const REPO = 'JW-Incorporated/swift2';
const UNOWNED_LABEL = 'desk:unowned';
const MAX_EVENT_PAGES = 5;

/**
 * Pure. `events` are GitHub issue events (chronological). Returns
 * `{ keep, remove }` or `{ skip: reason }`.
 */
export function plan(desks, events) {
  if (desks.includes(UNOWNED_LABEL)) return { skip: 'desk:unowned present' };
  const addedAt = new Map();
  for (const ev of events || []) {
    const name = ev?.event === 'labeled' ? ev.label?.name : null;
    if (!name || !desks.includes(name)) continue;
    const t = Date.parse(ev.created_at);
    if (Number.isNaN(t)) continue;
    if (!addedAt.has(name) || t >= addedAt.get(name)) addedAt.set(name, t);
  }
  if (addedAt.size !== desks.length) return { skip: 'no labeled event for every desk label' };
  const ranked = [...addedAt.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === ranked[1][1]) return { skip: 'tie for newest desk label' };
  const keep = ranked[0][0];
  return { keep, remove: desks.filter((d) => d !== keep) };
}

async function fetchEvents(api, repo, number) {
  const events = [];
  for (let page = 1; page <= MAX_EVENT_PAGES; page += 1) {
    const batch = (await api(`/repos/${repo}/issues/${number}/events?per_page=100&page=${page}`)) || [];
    events.push(...batch);
    if (batch.length < 100) return events;
  }
  return null;
}

export async function normalize({ repo = REPO, apply = false, gh = ghRun, api = apiFor(gh), log = console.log } = {}) {
  const issues = await listIssuesByLabels(api, { repo, labels: [], state: 'open', limit: 1000 });
  const changes = [];
  for (const issue of issues) {
    if (isExempt(issue)) continue;
    const desks = deskLabels(issue);
    if (desks.length < 2) continue;
    try {
      const events = await fetchEvents(api, repo, issue.number);
      const p = events ? plan(desks, events) : { skip: 'event history truncated' };
      if (p.skip) {
        log(`#${issue.number}: left alone (${p.skip}); desks=${desks.join(',')}`);
        continue;
      }
      log(`#${issue.number}: keep ${p.keep}, remove ${p.remove.join(', ')}${apply ? '' : ' (dry run)'}`);
      if (apply) {
        await gh(['issue', 'edit', String(issue.number), '--repo', repo, '--remove-label', p.remove.join(',')]);
      }
      changes.push({ number: issue.number, ...p });
    } catch (err) {
      log(`#${issue.number}: error, continuing - ${err.message}`);
    }
  }
  log(`${changes.length} issue(s) ${apply ? 'normalized' : 'would be normalized'}.`);
  return changes;
}

async function main(argv) {
  await normalize({ apply: argv.includes('--apply') });
  return 0;
}

if (process.argv[1] && isMain(import.meta.url, process.argv[1])) {
  runMain(() => main(process.argv.slice(2)), { name: 'normalize-desk-labels' });
}

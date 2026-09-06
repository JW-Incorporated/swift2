#!/usr/bin/env node
// Fetches open Dependabot alerts and publishes them into one persistent
// tracking issue, so Paul Blart's weekly patrol (a Claude Code cloud
// routine, docs/agents/runner-prompts/paul-blart-run.md) can read them
// without calling the Dependabot alerts API itself.
//
// WHY THIS EXISTS (HUMAN-ACTIONS.md #21): Paul Blart's routine authenticates
// through whatever GitHub App backs Claude Code's connection to the account
// running it — a fixed permission set Anthropic controls, which does not
// request the `vulnerability_alerts` (Dependabot alerts) scope. That call
// 403s from inside the routine with no self-serve fix (a GitHub App's
// installer can only grant permissions the app's own manifest requests).
// A GitHub Actions workflow has no such ceiling — it can use a dedicated,
// narrowly-scoped fine-grained PAT (a repo secret) for exactly this one
// call, then hand the result to Paul Blart through a normal issue, which
// its ordinary connector permissions already cover.
//
// Persistent (edit-in-place), not date-scoped like
// knowledge-fb-export-reminder.mjs's weekly checklist — this is a rolling
// snapshot Paul Blart re-reads every run, matching watchdog.yml's
// persistent-alert-issue convention rather than fb-export-reminder's
// one-per-week pattern.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { gh } from './lib/gh.mjs';
import { runMain } from './lib/cli.mjs';

const DRY_RUN = process.env.DRY_RUN === 'true';
const REPO = process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
const ISSUE_TITLE = 'Dependabot alerts — automated snapshot';
const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low'];

/** Groups open alerts by severity, each bucket sorted by package name. */
export function bucketBySeverity(alerts) {
  const buckets = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, []]));
  for (const a of alerts) {
    const severity = a.security_advisory?.severity ?? 'low';
    (buckets[severity] ?? buckets.low).push(a);
  }
  for (const s of SEVERITY_ORDER) buckets[s].sort((x, y) => packageName(x).localeCompare(packageName(y)));
  return buckets;
}

function packageName(alert) {
  return alert.dependency?.package?.name ?? alert.security_advisory?.summary ?? 'unknown';
}

function fixedIn(alert) {
  return alert.security_advisory?.vulnerabilities?.[0]?.first_patched_version?.identifier ?? '—';
}

export function issueBody(alerts, fetchedAt) {
  const lines = [
    `_Automated snapshot — ${fetchedAt}. Fetched by ` +
      '`.github/workflows/dependabot-alerts-snapshot.yml` via a dedicated ' +
      'fine-grained PAT (HUMAN-ACTIONS.md #21), since the Claude Code ' +
      "routine that reads this can't call the Dependabot alerts API " +
      'directly. Edited in place every run — this is a live snapshot, not ' +
      'a log.',
    '',
  ];
  if (alerts === null) {
    lines.push(
      '**PAT not configured yet.** `secrets.DEPENDABOT_ALERTS_PAT` is missing ' +
        'or invalid — see `HUMAN-ACTIONS.md` #21 for the exact steps to create ' +
        'and set it. Until then Paul Blart has no Dependabot-alert visibility.',
    );
    return lines.join('\n');
  }
  if (alerts.length === 0) {
    lines.push('**0 open alerts.**');
    return lines.join('\n');
  }
  const buckets = bucketBySeverity(alerts);
  lines.push('| Severity | Package | Fixed in | Alert |', '|---|---|---|---|');
  for (const severity of SEVERITY_ORDER) {
    for (const a of buckets[severity]) {
      lines.push(`| ${severity} | \`${packageName(a)}\` | ${fixedIn(a)} | [#${a.number}](${a.html_url}) |`);
    }
  }
  return lines.join('\n');
}

async function fetchOpenAlerts(token) {
  const { stdout } = await gh(
    ['api', `repos/${REPO}/dependabot/alerts`, '--paginate', '-X', 'GET', '-f', 'state=open'],
    { env: { ...process.env, GH_TOKEN: token } },
  );
  return JSON.parse(stdout || '[]');
}

async function findIssue(title) {
  const { stdout } = await gh(['issue', 'list', '--search', `"${title}" in:title`, '--state', 'all', '--json', 'number,title']);
  const matches = JSON.parse(stdout).filter((i) => i.title === title);
  return matches[0]?.number ?? null;
}

async function publish(title, body) {
  const bodyPath = path.join(tmpdir(), `dependabot-alerts-snapshot-${Date.now()}.md`);
  writeFileSync(bodyPath, body, 'utf8');
  try {
    const existing = await findIssue(title);
    if (existing) {
      await gh(['issue', 'edit', String(existing), '--body-file', bodyPath]);
      return { action: 'updated', number: existing };
    }
    const { stdout } = await gh(['issue', 'create', '--title', title, '--body-file', bodyPath, '--label', 'security']);
    return { action: 'created', url: stdout.trim() };
  } finally {
    try { unlinkSync(bodyPath); } catch { /* best-effort cleanup */ }
  }
}

async function main() {
  const pat = process.env.DEPENDABOT_ALERTS_PAT;
  const fetchedAt = new Date().toISOString();

  let alerts = null;
  if (pat) {
    try {
      const raw = await fetchOpenAlerts(pat);
      alerts = raw.filter((a) => a.state === 'open');
    } catch (err) {
      console.error('dependabot-alerts-snapshot: fetch failed, publishing the not-configured notice instead:', err.message);
      alerts = null;
    }
  }

  const body = issueBody(alerts, fetchedAt);

  if (DRY_RUN) {
    console.log(`DRY RUN — would update: "${ISSUE_TITLE}"\n\n${body}`);
    return;
  }

  const result = await publish(ISSUE_TITLE, body);
  console.log(`dependabot-alerts-snapshot: ${result.action} — ${result.url ?? `#${result.number}`}`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'dependabot-alerts-snapshot' });
}

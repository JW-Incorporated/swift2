// Marjorie's deterministic brief skeleton (charter: docs/agents/marjorie.md).
//
// Gathers the raw material for a Founders' Brief from GitHub — zero LLM
// tokens — and prints a markdown skeleton to stdout. Marjorie's judgment
// pass (precedent, dedupe, ranking, plain language) happens on top of this
// output; the skeleton alone is already a readable degraded-mode brief.
//
//   node scripts/marjorie/assemble-brief.mjs            # today, live gh data
//   node scripts/marjorie/assemble-brief.mjs 2026-07-12 # explicit date
//
// Requires an authenticated `gh` CLI. Read-only: never writes to GitHub.

// Shared gh runner: CLI when present, GitHub REST when it isn't — this script
// was the original victim of `spawn gh ENOENT` in cloud runners (#528).
import { gh as ghRun } from '../lib/gh.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeDeltas } from '../social/lib/growth.mjs';
import { summarizeQueueStatus } from '../social/lib/queue.mjs';

const REPO = 'JW-Incorporated/swift2';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');

async function gh(args) {
  const { stdout } = await ghRun(args);
  return JSON.parse(stdout || '[]');
}

// Reads the two most recent social/metrics/YYYY-MM-DD.json files (written
// by .github/workflows/growth-snapshot.yml) and computes follower deltas.
// Returns null if growth-snapshot.yml hasn't produced a file yet — the
// brief says so plainly rather than showing a fabricated zero.
export function fetchGrowthSnapshot(metricsDir = METRICS_DIR) {
  let files;
  try {
    files = readdirSync(metricsDir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  const latest = JSON.parse(readFileSync(path.join(metricsDir, files.at(-1)), 'utf-8'));
  const previous = files.length >= 2
    ? JSON.parse(readFileSync(path.join(metricsDir, files.at(-2)), 'utf-8'))
    : null;
  return { ...latest, deltas: computeDeltas(latest.followers, previous?.followers) };
}

// Ground truth for social/queue/ — added 2026-07-18 after a brief asserted
// drafts were "waiting on your OK in Slack #social" while the queue was
// actually empty. That line was never checked against real state; it was
// synthesized from what the charter says SHOULD happen. This function is
// the fact to copy instead — see summarizeQueueStatus's own comment.
export function fetchQueueStatus(queueDir = QUEUE_DIR) {
  let files;
  try {
    files = readdirSync(queueDir).filter((f) => f.endsWith('.json'));
  } catch {
    return summarizeQueueStatus([]);
  }
  const items = files.map((f) => JSON.parse(readFileSync(path.join(queueDir, f), 'utf-8')));
  return summarizeQueueStatus(items);
}

function formatFollowerCount(n) {
  if (typeof n !== 'number') return '?';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatDelta(n) {
  return typeof n === 'number' ? ` (${n >= 0 ? '+' : ''}${n})` : '';
}

// Nothing "awaits your OK" any more — per-item founder approval was removed
// 2026-07-25 (docs/decisions.md); the desk queues and the poster ships on
// schedule. The brief now reports what is going out, not what is blocked.
function formatQueueStatus(queueStatus) {
  const { total, scheduled, due } = queueStatus;
  if (total === 0) return 'queue: empty (nothing drafted)';
  const parts = [];
  if (scheduled > 0) parts.push(`${scheduled} scheduled to post`);
  if (due > 0) parts.push(`${due} due now`);
  return `queue: ${parts.join(', ')}`;
}

// Pure formatter, kept separate from the filesystem reads so the display
// logic is unit-testable without fixture files. queueStatus is the ground
// truth for what's actually pending — Marjorie copies it, never re-derives
// a claim about queue contents from the growth charter's description of
// how approvals are SUPPOSED to work (see fetchQueueStatus's comment).
export function formatGrowthLine(growth, queueStatus) {
  const queuePart = formatQueueStatus(queueStatus);
  if (!growth) return `- Growth: no snapshot yet (growth-snapshot.yml hasn't run) · ${queuePart}`;
  const { followers, deltas, postsToday } = growth;
  const parts = [
    `IG ${formatFollowerCount(followers.instagram)}${formatDelta(deltas.instagram)}`,
    `X ${formatFollowerCount(followers.x)}${formatDelta(deltas.x)}`,
    `FB ${formatFollowerCount(followers.facebook)}${formatDelta(deltas.facebook)}`,
  ];
  return `- Growth: ${parts.join(' · ')} · ${postsToday} post${postsToday === 1 ? '' : 's'} today · ${queuePart} · site: pending #799`;
}

export async function fetchState(repo = REPO) {
  const issueFields = 'number,title,body,labels,createdAt,author';
  const [decisions, intake, alerts, openPRs, mergedPRs] = await Promise.all([
    gh(['issue', 'list', '--repo', repo, '--label', 'founder-decision',
      '--state', 'open', '--limit', '100', '--json', issueFields]),
    gh(['issue', 'list', '--repo', repo, '--label', 'intake',
      '--state', 'open', '--limit', '100', '--json', issueFields]),
    gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert',
      '--state', 'open', '--limit', '20', '--json', issueFields]),
    gh(['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '50',
      '--json', 'number,title,author,isDraft,reviewDecision,createdAt']),
    gh(['pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '30',
      '--json', 'number,title,mergedAt']),
  ]);
  return {
    decisions, intake, alerts, openPRs, mergedPRs,
    growth: fetchGrowthSnapshot(),
    queueStatus: fetchQueueStatus(),
  };
}

// Pull the "### Options" block a founder-decision form submission produces.
// Returns [] when the body doesn't parse — the skeleton then tells Marjorie
// to write the A/B blocks by hand rather than guessing.
export function extractOptions(body) {
  if (!body) return [];
  const m = body.match(/###\s*Options\s*\n+([\s\S]*?)(?=\n###|\s*$)/i);
  if (!m) return [];
  return m[1].split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[A-D][):.]/.test(l));
}

export function extractField(body, label) {
  if (!body) return '';
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = body.match(new RegExp(`###\\s*${safe}[^\\n]*\\n+([\\s\\S]*?)(?=\\n###|\\s*$)`, 'i'));
  return m ? m[1].trim() : '';
}

// Brief dates follow the desk's clock (America/Los_Angeles), not UTC — an
// evening recovery run after 5 PM PT must not mint tomorrow's title.
export function todayLA(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function hoursOld(iso, now) {
  return Math.floor((now - new Date(iso).getTime()) / 3_600_000);
}

export function buildBrief(state, { date, now = Date.now() } = {}) {
  const { decisions, intake, alerts, openPRs, mergedPRs, growth, queueStatus } = state;
  const dayMs = 24 * 3_600_000;
  const mergedToday = mergedPRs.filter((p) => now - new Date(p.mergedAt).getTime() < dayMs);
  const staleIntake = intake.filter((i) => hoursOld(i.createdAt, now) >= 48);
  const out = [];

  out.push(`# Founders' Brief — ${date}`, '');
  out.push(`> Skeleton assembled deterministically; Marjorie curates before posting.`,
    `> Tick ONE box per decision. Unticked items carry over. Charter: docs/agents/marjorie.md`, '');

  out.push('## 1 · Decisions needed');
  if (decisions.length === 0) {
    out.push('', '_Nothing needs you today._');
  }
  for (const d of decisions) {
    const opts = extractOptions(d.body);
    const cost = extractField(d.body, 'Cost of delay');
    const affects = extractField(d.body, 'Affects');
    out.push('', `### #${d.number} — ${d.title.replace(/^\[decision\]\s*/i, '')}`);
    if (cost) out.push(`Cost of delay: ${cost}`);
    if (affects) out.push(`Unblocks: ${affects}`);
    if (opts.length) {
      for (const o of opts) out.push(`- [ ] ${o}`);
    } else {
      out.push('- [ ] _(options unparseable — Marjorie: write the A/B blocks from the issue body)_');
    }
    out.push(`([full context](https://github.com/${REPO}/issues/${d.number}))`);
  }

  out.push('', '## 2 · Founder-action items');
  const tx = decisions.filter((d) => /TX — founder-only/i.test(d.body || ''));
  out.push(tx.length
    ? tx.map((d) => `- #${d.number} ${d.title.replace(/^\[decision\]\s*/i, '')}`).join('\n')
    : '_None pending._');

  out.push('', '## 3 · Shipped & in flight');
  out.push(`Merged in the last 24h: ${mergedToday.length ? '' : '_none_'}`);
  for (const p of mergedToday) out.push(`- #${p.number} ${p.title}`);
  out.push('', `Open PRs (${openPRs.length}):`);
  for (const p of openPRs) {
    const state = p.isDraft ? 'draft' : (p.reviewDecision || 'awaiting review').toLowerCase();
    out.push(`- #${p.number} ${p.title} — ${state}`);
  }

  out.push('', '## 4 · Health');
  out.push(`- Open watchdog alerts: ${alerts.length ? alerts.map((a) => `#${a.number}`).join(' ') : 'none 🟢'}`);
  out.push(`- Intake queue: ${intake.length} open${staleIntake.length ? ` — ⚠ ${staleIntake.length} older than 48h untriaged` : ''}`);
  out.push('- Spend vs monthly cap: _(collector lands in Phase 2 — report manually)_');
  out.push(formatGrowthLine(growth, queueStatus));

  out.push('', '## 5 · Today\'s plan', '_(Marjorie: one line per active desk.)_', '');
  return out.join('\n');
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(
  process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  const date = process.argv[2] || todayLA();
  process.stdout.write(buildBrief(fetchState(), { date }) + '\n');
}

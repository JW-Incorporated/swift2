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

import { execFileSync } from 'node:child_process';

const REPO = 'JW-Incorporated/swift2';

function gh(args) {
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
}

export function fetchState(repo = REPO) {
  const issueFields = 'number,title,body,labels,createdAt,author';
  return {
    decisions: gh(['issue', 'list', '--repo', repo, '--label', 'founder-decision',
      '--state', 'open', '--limit', '100', '--json', issueFields]),
    intake: gh(['issue', 'list', '--repo', repo, '--label', 'intake',
      '--state', 'open', '--limit', '100', '--json', issueFields]),
    alerts: gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert',
      '--state', 'open', '--limit', '20', '--json', issueFields]),
    openPRs: gh(['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '50',
      '--json', 'number,title,author,isDraft,reviewDecision,createdAt']),
    mergedPRs: gh(['pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '30',
      '--json', 'number,title,mergedAt']),
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
  const { decisions, intake, alerts, openPRs, mergedPRs } = state;
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

  out.push('', '## 5 · Today\'s plan', '_(Marjorie: one line per active desk.)_', '');
  return out.join('\n');
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(
  process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  const date = process.argv[2] || todayLA();
  process.stdout.write(buildBrief(fetchState(), { date }) + '\n');
}

// Marjorie's deterministic brief skeleton (charter: docs/agents/marjorie.md).
//
// Gathers the raw material for a Founders' Brief from GitHub — zero LLM
// tokens — and prints a markdown brief to stdout. Marjorie's judgment pass
// tightens the prose on top of this; the skeleton alone is already a correct,
// postable brief.
//
//   node scripts/marjorie/assemble-brief.mjs            # today, live gh data
//   node scripts/marjorie/assemble-brief.mjs 2026-07-12 # explicit date
//   node scripts/marjorie/assemble-brief.mjs --json     # the evidence, for the journal
//
// ─── THE 2026-08-11 REBUILD ───────────────────────────────────────────────
// Wyatt: "the daily brief is honestly unhelpful… the focus should likely
// shift to focusing on the definition of done."
//
// The old brief's measured record: across 11 briefs the founders were asked
// for 26 checklist line-items that reduce to 5 distinct asks, and ZERO
// checkboxes were ever ticked. #799 was answered by Joey on the ticket on
// 08-01 and re-asked in five more briefs. Two scoreboard rows still named
// tickets closed on 07-30. None of that was a writing problem — it was a
// data problem, so the fix is here and not in the prompt.
//
// The brief is now two sections and nothing else:
//
//   1 · PROGRESS TOWARD DONE — what is gated on a founder (computed against
//       each ticket's own state, not against the last brief's checkboxes),
//       how far away done is (computed, with its own error bars), what would
//       make it closer, and what actually landed.
//   2 · MAINTENANCE — one green/not-green line, then a fixed checklist. Green
//       means stop reading.
//
// Requires an authenticated `gh` or a GH_TOKEN. Read-only: never writes to GitHub.

import { gh as ghRun } from '../lib/gh.mjs';
import { ghApiSoft } from './lib/gh-api.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeDeltas } from '../social/lib/growth.mjs';
import { summarizeQueueStatus } from '../social/lib/queue.mjs';
import { readGateHistory, readCurrentGates, GATES } from './gate-history.mjs';
import { buildGateActivity, extractTickets, trackerLagDays } from './gate-activity.mjs';
import { estimateDaysToDone, renderDoneLines } from './done-estimator.mjs';
import { partitionAsks, asksInBrief, ESCALATE_AFTER } from './founder-gate.mjs';
import { runStandingChecks, renderStandingChecks, loadRunnerCadence } from './standing-checks.mjs';
import { collectConstraints } from './meta-constraints.mjs';

const REPO = 'JW-Incorporated/swift2';
const ORG = REPO.split('/')[0];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');
const DAY_MS = 86_400_000;

async function gh(args) {
  const { stdout } = await ghRun(args);
  return JSON.parse(stdout || '[]');
}

// ─── unchanged growth/queue helpers (kept verbatim: the 2026-07-18 rule that
// every social claim comes from this number and nowhere else still stands) ──

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

function formatQueueStatus(queueStatus) {
  const { total, scheduled, due } = queueStatus;
  if (total === 0) return 'queue: empty (nothing drafted)';
  const parts = [];
  if (scheduled > 0) parts.push(`${scheduled} scheduled to post`);
  if (due > 0) parts.push(`${due} due now`);
  return `queue: ${parts.join(', ')}`;
}

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

// ─── fetch ─────────────────────────────────────────────────────────────────

const ISSUE_FIELDS = 'number,title,body,labels,createdAt,updatedAt,closedAt,state,url,assignees';
const PR_FIELDS = 'number,title,body,author,isDraft,reviewDecision,createdAt,updatedAt,mergedAt,headRefName,state,url,statusCheckRollup';

/**
 * One fetch pass for the whole brief. Everything downstream is pure, so this
 * is the only place that touches the network — and the only place that can
 * fail. It fails LOUDLY for the core lists (a brief built on a silent empty
 * list is the #1869 failure mode) and softly for the optional ones.
 */
export async function fetchState(repo = REPO, { now = Date.now() } = {}) {
  const [decisions, intake, alerts, openPRs, allPRs, allIssues, briefs] = await Promise.all([
    gh(['issue', 'list', '--repo', repo, '--label', 'founder-decision', '--state', 'open', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'intake', '--state', 'open', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert', '--state', 'open', '--limit', '20', '--json', ISSUE_FIELDS]),
    gh(['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '60', '--json', PR_FIELDS]),
    gh(['pr', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', 'number,title,body,createdAt,updatedAt,mergedAt,headRefName,state,url']),
    gh(['issue', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'founders-brief', '--state', 'all', '--limit', '14', '--json', 'number,title,body,createdAt']),
  ]);

  const gates = readCurrentGates();
  const series = readGateHistory();

  // The gate rows name their own tickets. Fetch any we don't already have —
  // this is what turns "the tracker says red" into "and here is whether
  // anyone is actually working on it".
  const wanted = [...new Set(GATES.flatMap((g) => extractTickets(gates[g]?.nextAction)))];
  const have = new Map(allIssues.map((i) => [i.number, i]));
  const missing = wanted.filter((n) => !have.has(n));
  const fetched = await Promise.all(missing.map(async (n) => {
    const r = await ghApiSoft(`/repos/${repo}/issues/${n}`);
    return r.ok && r.data
      ? { number: r.data.number, title: r.data.title, state: r.data.state, createdAt: r.data.created_at, updatedAt: r.data.updated_at, closedAt: r.data.closed_at, url: r.data.html_url, labels: (r.data.labels || []).map((l) => ({ name: l.name })), assignees: r.data.assignees || [] }
      : null;
  }));
  const gateIssues = [...allIssues, ...fetched.filter(Boolean)];

  // Comments on the bank items — the fix for the phantom-ask loop. Only the
  // open founder-decision items, so this is a handful of calls, not hundreds.
  const withComments = await Promise.all(decisions.map(async (d) => {
    const r = await ghApiSoft(`/repos/${repo}/issues/${d.number}/comments?per_page=100`, []);
    return { ...d, comments: (r.data || []).map((c) => ({ author: { login: c.user?.login }, createdAt: c.created_at, body: c.body })) };
  }));

  // Anything the founders were ASKED FOR that has since closed. Without this,
  // a closed ticket can never be reported as resolved — which is precisely how
  // #799 stayed on the checklist for five briefs after Joey answered it.
  //
  // Only checkbox lines count. Scanning whole brief bodies pulls in every
  // ticket the brief merely mentions (scoreboard rows, plan tables, notes),
  // and "cleared since the last brief" then lists everything the org closed.
  const askedNumbers = new Set();
  for (const b of briefs) for (const ask of asksInBrief(b.body)) for (const n of ask.issues) askedNumbers.add(n);
  const recentlyAsked = await Promise.all([...askedNumbers]
    .filter((n) => !withComments.some((d) => d.number === n))
    .slice(0, 40)
    .map(async (n) => {
      const known = have.get(n);
      if (known) return { ...known, comments: [] };
      const r = await ghApiSoft(`/repos/${repo}/issues/${n}`);
      return r.ok && r.data && !r.data.pull_request
        ? { number: r.data.number, title: r.data.title, state: r.data.state, body: r.data.body, createdAt: r.data.created_at, closedAt: r.data.closed_at, url: r.data.html_url, labels: (r.data.labels || []).map((l) => ({ name: l.name })), comments: [] }
        : null;
    }));

  const ciRuns = await ghApiSoft(`/repos/${repo}/actions/workflows/ci.yml/runs?branch=main&per_page=40`, { workflow_runs: [] });

  return {
    decisions: withComments,
    askedBefore: recentlyAsked.filter(Boolean),
    intake, alerts, openPRs, allPRs, allIssues: gateIssues, briefs,
    gates, series,
    ciRuns: ciRuns.data?.workflow_runs ?? [],
    growth: fetchGrowthSnapshot(),
    queueStatus: fetchQueueStatus(),
    now,
  };
}

// ─── analysis (pure) ───────────────────────────────────────────────────────

/**
 * Everything the brief asserts, decided before a single line is written.
 * Exported so tests can assert on the numbers rather than on the prose, and
 * so `--json` can dump the whole evidence trail into the journal comment.
 */
export function analyse(state, { now = state.now ?? Date.now() } = {}) {
  const nowMs = Number(now);
  const activity = buildGateActivity(state.gates, { issues: state.allIssues, prs: state.openPRs });
  const estimate = estimateDaysToDone(state.series, state.gates, { now: nowMs, activity });
  const lag = trackerLagDays(state.series, activity, nowMs);

  const asks = partitionAsks([...state.decisions, ...state.askedBefore], { briefs: state.briefs, now: nowMs });

  const cadence = loadRunnerCadence();
  const merged24 = state.allPRs.filter((p) => p.mergedAt && nowMs - new Date(p.mergedAt).getTime() < DAY_MS);
  const opened24 = state.allPRs.filter((p) => nowMs - new Date(p.createdAt).getTime() < DAY_MS);
  const closed24 = state.allIssues.filter((i) => i.closedAt && nowMs - new Date(i.closedAt).getTime() < DAY_MS);

  return { activity, estimate, lag, asks, cadence, merged24, opened24, closed24, now: nowMs };
}

/**
 * The accelerants — computed, not brainstormed. Each one is a lever that
 * exists in the data right now, ordered by how many gate-points it unblocks.
 */
export function accelerators(state, a) {
  const out = [];
  for (const g of a.estimate.trackerStale.filter((x) => x.prs.length)) {
    const prs = g.prs.map((p) => `#${p.number}`).join(', ');
    out.push({ points: g.pointsMissing + 0.01, text: `**Land ${prs}** — closes **${g.gate}**, which the tracker still shows as ${g.status}.` });
  }
  for (const g of a.estimate.idle) {
    out.push({ points: g.pointsMissing, text: `**Staff ${g.gate}** (${g.pointsMissing} pt) — ${g.reason}.` });
  }
  const green = (state.openPRs || []).filter((p) => !p.isDraft && (p.statusCheckRollup || []).length > 0
    && !(p.statusCheckRollup || []).some((c) => ['FAILURE', 'ERROR', 'TIMED_OUT'].includes(String(c.conclusion || c.state).toUpperCase()))
    && olderThanADay(a.now, p.createdAt));
  if (green.length >= 3) out.push({ points: 0.4, text: `**Clear the merge queue** — ${green.length} green PRs older than 24h. Merge latency, not build capacity, is the constraint.` });
  if (a.asks.escalated.length) {
    out.push({ points: 0.3, text: `**Answer or close the ${a.asks.escalated.length} escalated ask(s)** — each has been re-asked ${ESCALATE_AFTER}+ times and costs a brief slot every day.` });
  }
  return out.sort((x, y) => y.points - x.points).slice(0, 4);
}

function olderThanADay(now, iso) {
  return now - new Date(iso).getTime() > DAY_MS;
}

// ─── render ────────────────────────────────────────────────────────────────

const GATE_ICON = { green: '🟢', yellow: '🟡', red: '🔴' };

function link(n) {
  return `[#${n}](https://github.com/${REPO}/issues/${n})`;
}

/**
 * Ticket titles in this repo are essay-length. Cut at a word boundary — a
 * checklist line that ends mid-word ("…hotlinked across 4 er") reads as a bug
 * and undermines the rest of the brief.
 */
export function shortTitle(title, max = 62) {
  const t = String(title || '')
    .replace(/^\[(decision|future decision|intake)\]\s*/i, '')
    .replace(/\s*[—–]\s.*$/, '')
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:(]+$/, '')}…`;
}

export function buildBrief(state, { date, now = state?.now ?? Date.now() } = {}) {
  const a = analyse(state, { now });
  const out = [];

  out.push('cc @sffan15-sys @wjduvall-cmd', '');
  out.push(`# Founders' Brief — ${date}`, '');

  // ── SECTION 1 ────────────────────────────────────────────────────────────
  out.push('## 1 · Progress toward Done', '');

  // 1a — what is gated on a founder. First, because it is the only part of
  // the brief that asks anything of the reader.
  const { open, escalated, resolved, phantom } = a.asks;
  if (escalated.length === 0 && open.length === 0) {
    out.push('**🫵 Nothing is gated on you.** No founder action is blocking any gate today.', '');
  } else {
    out.push(`**🫵 Gated on you: ${open.length + escalated.length}**${escalated.length ? ` — ${escalated.length} overdue. Each of these needs an answer **or a close**; leaving them open is what makes this list grow.` : '.'}`, '');
    for (const e of escalated) out.push(`- 🔴 ${link(e.number)} **${shortTitle(e.title)}** — ${e.escalateReason}`);
    for (const o of open) out.push(`- [ ] ${link(o.number)} **${shortTitle(o.title)}** — ${o.gateReasons[0]}, ${o.daysOpen}d old`);
    out.push('');
  }
  if (resolved.length) {
    const shown = resolved.slice(0, 4).map((r) => `${link(r.number)} (${r.resolution.how})`).join(' · ');
    const leak = phantom.length === 1 ? '1 of these was' : `${phantom.length} of these were`;
    out.push(`**Cleared: ${resolved.length}** — ${shown}${resolved.length > 4 ? ` +${resolved.length - 4}` : ''}${phantom.length ? ` · ${leak} already closed while still on your checklist; that loop is now fixed.` : ''}`, '');
  }

  // 1b — distance to done.
  out.push('### 📈 Distance to done', '');
  out.push(...renderDoneLines(a.estimate).map((l) => `${l}`));
  out.push('');
  out.push(`> "Done" = all 12 gates green. **[JOEY: replace with your definition — \`docs/ops/definition-of-done.md\`. Until then the gates are the proxy.]**`);
  out.push('');

  // 1c — accelerants.
  const acc = accelerators(state, a);
  if (acc.length) {
    out.push('### ⚡ What would make it sooner', '');
    for (const x of acc) out.push(`- ${x.text}`);
    out.push('');
  }

  // 1d — the gate table, derived from the tracker rather than retyped. The
  // old brief hand-wrote this and drifted: it still named #669 and #736 as
  // next actions three weeks after both were closed.
  // Only the gates still in play get a row. The done ones get a single line —
  // the table's job is to show what is LEFT, and four permanent 🟢 rows every
  // morning is exactly the padding that made the old brief unreadable.
  const done = GATES.filter((g) => state.gates[g]?.status === 'green');
  out.push('### 📊 Gates still open', '');
  out.push('| Gate | | Next step | Tickets |', '|---|---|---|---|');
  for (const g of GATES) {
    const row = state.gates[g];
    if (!row || row.status === 'green') continue;
    const act = a.activity[g];
    const tickets = (act?.tickets ?? []);
    const live = tickets.filter((t) => t.state === 'open').map((t) => `#${t.number}`);
    const closed = tickets.filter((t) => t.state === 'closed').map((t) => `~~#${t.number}~~`);
    const prs = (act?.openPRs ?? []).map((p) => `PR #${p.number}`);
    const stateCell = [live.join(' ') || null, prs.join(' ') || null, closed.join(' ') || null].filter(Boolean).join(' · ') || '—';
    out.push(`| ${g} | ${GATE_ICON[row.status]} | ${row.nextAction.replace(/\|/g, '/').replace(/\*\*/g, '').replace(/\s*·.*$/, '').slice(0, 44)} | ${stateCell} |`);
  }
  out.push('', `🟢 done (${done.length}): ${done.join(', ')}. Struck-through tickets are already closed — if one is still a "next step", that row is stale.`, '');

  // 1e — what actually landed.
  out.push('### 📰 Last 24 hours', '');
  if (a.merged24.length === 0 && a.closed24.length === 0) {
    out.push('- Nothing merged and nothing closed. Per the charter\'s 2026-07-12 amendment this is a failed org day; the stuck point is named above.');
  } else {
    out.push(`- **${a.merged24.length} PRs merged · ${a.closed24.length} tickets closed · ${a.opened24.length} PRs opened.** Newest: ${a.merged24.slice(0, 3).map((p) => `#${p.number} ${p.title.replace(/^[a-z()-]+:\s*/i, '').slice(0, 42)}`).join(' · ')}`);
  }
  out.push('');

  // ── SECTION 2 ────────────────────────────────────────────────────────────
  const checks = runStandingChecks({
    openPRs: state.openPRs,
    allPRs: state.allPRs,
    issues: state.allIssues,
    alerts: state.alerts,
    gateTickets: [...new Set(GATES.flatMap((g) => extractTickets(state.gates[g]?.nextAction)))],
    runs: state.ciRuns,
    cadence: a.cadence,
    queueStatus: state.queueStatus,
    growth: state.growth,
    constraints: state.constraints,
    lag: a.lag,
    staleRows: a.estimate.trackerStale,
    now,
  });
  out.push(...renderStandingChecks(checks));
  out.push('');
  out.push('**What ran:**');
  out.push(formatGrowthLine(state.growth, state.queueStatus));
  out.push(`- Content + social PRs landed today: ${a.merged24.filter((p) => /^(content|vault|growth|social)/.test(p.headRefName || '')).length} · intake queue ${state.intake.length} open`);
  out.push('');
  out.push('Full evidence: journal comment below.');

  const body = out.join('\n');
  // Budget marker — invisible when rendered, but it means a run can never
  // blow the charter's length cap without leaving a trace.
  const lines = body.split('\n').length;
  const words = body.split(/\s+/).filter(Boolean).length;
  return `${body}\n<!-- budget: ${lines} lines / ${words} words -->\n`;
}

// ─── entry point ───────────────────────────────────────────────────────────

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const wantJson = args.includes('--json');
  const date = args.find((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)) || todayLA();
  const now = Date.now();

  const state = await fetchState(REPO, { now });
  // Constraints last: it is the only optional collector, and a billing hiccup
  // must degrade the Budget line, never the brief.
  state.constraints = await collectConstraints({
    org: ORG,
    repo: REPO,
    now,
    plan: 'team',
    state,
    ciRuns: state.ciRuns,
    expectations: loadRunnerCadence().runners
      .filter((r) => r.checkable !== false)
      .map((r) => ({
        name: r.name,
        perDay: r.perDay,
        match: (art) => (r.match.kind === 'pr-branch' ? art.type === 'pr' && String(art.branch || '').startsWith(r.match.value)
          : r.match.kind === 'pr-title' ? art.type === 'pr' && String(art.title || '').toLowerCase().includes(r.match.value.toLowerCase())
            : r.match.kind === 'issue-label' ? art.type === 'issue' && (art.labels || []).includes(r.match.value)
              : art.type === 'issue' && String(art.title || '').includes(r.match.value)),
      })),
    artifacts: [
      ...state.allPRs.map((p) => ({ type: 'pr', at: p.createdAt, branch: p.headRefName, title: p.title })),
      ...state.allIssues.map((i) => ({ type: 'issue', at: i.createdAt, title: i.title, labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)) })),
    ],
  });

  if (wantJson) {
    process.stdout.write(`${JSON.stringify({ analysis: analyse(state, { now }), constraints: state.constraints }, null, 2)}\n`);
  } else {
    process.stdout.write(buildBrief(state, { date, now }));
  }
}

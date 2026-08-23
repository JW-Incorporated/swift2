// Marjorie's deterministic brief skeleton (charter: docs/agents/marjorie.md).
//
// Gathers the raw material for a Founders' Brief from GitHub — zero LLM
// tokens — and prints a markdown brief to stdout. Marjorie's judgment pass
// tightens the prose on top of this; the skeleton alone is already a correct,
// postable brief.
//
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs            # today, live gh data
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs 2026-07-12 # explicit date
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs --json     # the evidence, for the journal
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
// ─── THE 2026-08-23 REBUILD (v3) ──────────────────────────────────────────
// Joey, direct ask: stale (same info every day), no visibility into
// HUMAN-ACTIONS.md or its aging, no "what happened in the last 24h", gate
// reds never said WHY they hadn't started, gate yellows never said what
// changed — and a yellow with no movement is itself a finding worth stating
// every time, not just after it repeats. Designed by Fable (architect),
// corrected after reading the real code (see PLAN.md), refined by Joey
// mid-build. Full rationale in docs/decisions.md.
//
// The brief is now FIVE sections:
//
//   1 · WAITING ON YOU — founder-decision asks (unchanged logic) + open
//       HUMAN-ACTIONS.md items with age + open founder-task issues (the
//       standalone digest email was retired the same day; this section is
//       now where those surface).
//   2 · LAST 24 HOURS — org activity counts (unchanged) + new site content
//       (real links, never a guess) + new social posts.
//   3 · GATES — Joey's actual product Definition of Done
//       (docs/definition-of-done.md, NOT the superseded 12-gate
//       launch-readiness.md). Every non-green row states WHY: blocked-on
//       for reds/not-started, and for yellows either what changed since
//       yesterday or — every single occurrence, not just after repeats —
//       why it hasn't.
//   4 · SOCIAL STRATEGY — a pointer to Tree's last plan + the live strategy
//       doc, so Joey doesn't have to go find it himself.
//   5 · DISTANCE TO DONE + MAINTENANCE — the historical 12-gate estimator
//       (kept as-is; re-pointing its math at the new bar is separate,
//       deliberately not done in this pass — see PLAN.md), accelerants,
//       and the fixed maintenance checklist.
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
import { readCurrentDone, readDoneHistory, changeSinceAnchor, sinceLastBrief, STATUS_ICONS } from './done-history.mjs';
import { readOpenActions, sortForBrief, renderActionLine } from './human-actions.mjs';
import { fetchContentShipped, renderContentShippedSection } from './content-shipped.mjs';

const REPO = 'JW-Incorporated/swift2';
const ORG = REPO.split('/')[0];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const METRICS_DIR = path.join(ROOT, 'social', 'metrics');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
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
  const { followers, deltas } = growth;
  const parts = [
    `IG ${formatFollowerCount(followers.instagram)}${formatDelta(deltas.instagram)}`,
    `X ${formatFollowerCount(followers.x)}${formatDelta(deltas.x)}`,
    `FB ${formatFollowerCount(followers.facebook)}${formatDelta(deltas.facebook)}`,
  ];
  return `- Growth: ${parts.join(' · ')} · ${formatPostsPart(growth)} · ${queuePart} · site: pending #799`;
}

// Posts published in the last 24h, per platform. Was "<n> posts today" from
// the snapshot's `postsToday` until 2026-08-11, which was doubly misleading:
// it summed every platform (so a dark X hid behind Instagram's cadence) and
// it was taken at 11:05 UTC against a posting cadence scheduled for 23:00
// UTC, so it read 0 on days that posted perfectly well. The 2026-08-11 brief
// said "X 0 · 0 posts today" and was read as "the X poster is silently
// failing" when X had in fact posted six nights running. Old snapshots that
// predate `postsLast24h` fall back to the legacy number, labelled honestly.
function formatPostsPart(growth) {
  const window = growth.postsLast24h;
  if (!window) {
    const n = growth.postsToday ?? 0;
    return `${n} post${n === 1 ? '' : 's'} today (pre-24h-window snapshot)`;
  }
  const breakdown = ['x', 'instagram', 'facebook']
    .map((platform) => `${platform === 'x' ? 'X' : platform === 'instagram' ? 'IG' : 'FB'} ${window[platform] ?? 0}`)
    .join('/');
  return `${window.total} post${window.total === 1 ? '' : 's'}/24h (${breakdown})`;
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

// ─── new-in-v3 helpers (pure) ──────────────────────────────────────────────

/** social/posted/*.json entries whose postedAt falls after `sinceMs`. */
export function fetchPostedSince(sinceMs, postedDir = POSTED_DIR) {
  let files;
  try {
    files = readdirSync(postedDir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      try { return JSON.parse(readFileSync(path.join(postedDir, f), 'utf-8')); } catch { return null; }
    })
    .filter(Boolean)
    .filter((item) => {
      const at = new Date(item.postedAt).getTime();
      return !Number.isNaN(at) && at > sinceMs;
    })
    .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
}

export function renderSocialPostedLine(item) {
  const platform = item.platform === 'x' ? 'X' : item.platform === 'instagram' ? 'IG' : 'FB';
  const snippet = String(item.body || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  const ellipsis = String(item.body || '').trim().length > 70 ? '…' : '';
  const linkPart = item.url ? ` ([link](${item.url}))` : '';
  return `- ${platform} · ${item.campaign || 'uncategorized'}: "${snippet}${ellipsis}"${linkPart}`;
}

/** Tree's most recent weekly-plan PR (head branch starts `tree/`), or null. */
export function findLatestTreePR(allPRs) {
  const treePRs = (allPRs || []).filter((p) => String(p.headRefName || '').startsWith('tree/'));
  if (treePRs.length === 0) return null;
  return [...treePRs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
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
  const [decisions, intake, alerts, openPRs, allPRs, allIssues, briefs, founderTasks] = await Promise.all([
    gh(['issue', 'list', '--repo', repo, '--label', 'founder-decision', '--state', 'open', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'intake', '--state', 'open', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert', '--state', 'open', '--limit', '20', '--json', ISSUE_FIELDS]),
    gh(['pr', 'list', '--repo', repo, '--state', 'open', '--limit', '60', '--json', PR_FIELDS]),
    gh(['pr', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', 'number,title,body,createdAt,updatedAt,mergedAt,headRefName,state,url']),
    gh(['issue', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', ISSUE_FIELDS]),
    gh(['issue', 'list', '--repo', repo, '--label', 'founders-brief', '--state', 'all', '--limit', '14', '--json', 'number,title,body,createdAt']),
    // Folded in 2026-08-23: the standalone founder-task digest email was
    // retired (Joey's call) — these now surface here instead, next-morning
    // latency, explicitly OK'd.
    gh(['issue', 'list', '--repo', repo, '--label', 'founder-task', '--state', 'open', '--limit', '50', '--json', ISSUE_FIELDS]),
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

  // v3 additions — each independently soft-failing so a single bad source
  // degrades its own section, never the whole brief.
  const contentShipped = await fetchContentShipped(repo, new Date(now - DAY_MS).toISOString()).catch(() => []);

  return {
    decisions: withComments,
    askedBefore: recentlyAsked.filter(Boolean),
    founderTasks,
    intake, alerts, openPRs, allPRs, allIssues: gateIssues, briefs,
    gates, series,
    doneItems: readCurrentDone(),
    doneSeries: readDoneHistory(),
    openActions: readOpenActions({ now }),
    contentShipped,
    postedSince: fetchPostedSince(now - DAY_MS),
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
  const anchorIso = new Date(now - DAY_MS).toISOString();

  out.push('cc @sffan15-sys @wjduvall-cmd', '');
  out.push(`# Founders' Brief — ${date}`, '');

  // ── SECTION 1 · WAITING ON YOU ────────────────────────────────────────
  out.push('## 1 · Waiting on you', '');

  const { open, escalated, resolved, phantom } = a.asks;
  const actionItems = sortForBrief(state.openActions || []);
  const founderTasks = state.founderTasks || [];
  const totalWaiting = open.length + escalated.length + actionItems.length + founderTasks.length;

  if (totalWaiting === 0) {
    out.push('**🫵 Nothing is gated on you.** No founder action is blocking anything today.', '');
  } else {
    out.push(`**🫵 Waiting on you: ${totalWaiting}**${escalated.length ? ` — ${escalated.length} overdue decision(s); each needs an answer **or a close**.` : '.'}`, '');
    for (const e of escalated) out.push(`- 🔴 ${link(e.number)} **${shortTitle(e.title)}** — ${e.escalateReason}`);
    for (const o of open) out.push(`- [ ] ${link(o.number)} **${shortTitle(o.title)}** — ${o.gateReasons[0]}, ${o.daysOpen}d old`);
    for (const it of actionItems) out.push(renderActionLine(it));
    for (const ft of founderTasks) {
      const ageDays = Math.floor((now - new Date(ft.createdAt).getTime()) / DAY_MS);
      out.push(`- [ ] ${link(ft.number)} **${shortTitle(ft.title)}** — founder-task, ${ageDays}d old`);
    }
    out.push('');
  }
  if (resolved.length) {
    const shown = resolved.slice(0, 4).map((r) => `${link(r.number)} (${r.resolution.how})`).join(' · ');
    const leak = phantom.length === 1 ? '1 of these was' : `${phantom.length} of these were`;
    out.push(`**Cleared: ${resolved.length}** — ${shown}${resolved.length > 4 ? ` +${resolved.length - 4}` : ''}${phantom.length ? ` · ${leak} already closed while still on your checklist; that loop is now fixed.` : ''}`, '');
  }

  // ── SECTION 2 · LAST 24 HOURS ─────────────────────────────────────────
  out.push('## 2 · Last 24 hours', '');
  const hadOrgActivity = a.merged24.length > 0 || a.closed24.length > 0;
  const contentShipped = state.contentShipped || [];
  const postedSince = state.postedSince || [];
  if (!hadOrgActivity && contentShipped.length === 0 && postedSince.length === 0) {
    out.push('- Nothing merged, nothing closed, nothing new on the site or social. Per the charter\'s 2026-07-12 amendment this is a failed org day.');
  } else {
    if (hadOrgActivity) {
      out.push(`- **${a.merged24.length} PRs merged · ${a.closed24.length} tickets closed · ${a.opened24.length} PRs opened.** Newest: ${a.merged24.slice(0, 3).map((p) => `#${p.number} ${p.title.replace(/^[a-z()-]+:\s*/i, '').slice(0, 42)}`).join(' · ') || '—'}`);
    }
    const contentLines = renderContentShippedSection(contentShipped);
    if (contentLines) {
      out.push('', '**New on the site:**', ...contentLines);
    }
    if (postedSince.length) {
      out.push('', '**New on social:**', ...postedSince.map(renderSocialPostedLine));
    }
  }
  out.push('');

  // ── SECTION 3 · GATES (product Definition of Done) ───────────────────
  out.push('## 3 · Gates — product Definition of Done', '');
  const doneCurrent = state.doneItems || {};
  const doneEntries = Object.entries(doneCurrent);
  if (doneEntries.length === 0) {
    out.push('- `docs/definition-of-done.md` did not parse — check the file exists and its table is intact.', '');
  } else {
    const delta = changeSinceAnchor(state.doneSeries || [], doneCurrent, anchorIso);
    const doneGreen = doneEntries.filter(([, it]) => it.status === 'green');
    const doneOpen = doneEntries.filter(([, it]) => it.status !== 'green');
    if (doneOpen.length === 0) {
      out.push('**All 8 items done.** 🎉', '');
    } else {
      out.push('| Item | | Since yesterday |', '|---|---|---|');
      for (const [num, it] of doneOpen) {
        out.push(`| ${it.title} | ${STATUS_ICONS[it.status]} | ${sinceLastBrief(Number(num), it, delta)} |`);
      }
      out.push('');
    }
    out.push(`🟢 done (${doneGreen.length}/${doneEntries.length}): ${doneGreen.map(([, it]) => it.title).join(', ') || 'none yet'}.`, '');
  }
  out.push('> Full detail: `docs/definition-of-done.md`.', '');

  // ── SECTION 4 · SOCIAL STRATEGY ────────────────────────────────────────
  out.push('## 4 · Social strategy', '');
  const treePR = findLatestTreePR(state.allPRs);
  if (treePR) {
    const daysAgo = Math.floor((now - new Date(treePR.createdAt).getTime()) / DAY_MS);
    out.push(`- Tree last planned ${daysAgo <= 0 ? 'today' : `${daysAgo}d ago`}: ${link(treePR.number)} ${shortTitle(treePR.title)}`);
  } else {
    out.push('- Tree has not opened a weekly plan PR yet.');
  }
  out.push('- Current plan: `social/calendar.md` · Strategy doc: `docs/marketing/social-strategy.md`');
  out.push('');

  // ── SECTION 5 · DISTANCE TO DONE + MAINTENANCE ────────────────────────
  out.push('## 5 · Distance to done + maintenance', '');
  out.push('### 📈 Distance to done', '');
  out.push(...renderDoneLines(a.estimate).map((l) => `${l}`));
  out.push('');
  out.push('> This estimator still measures the 12 historical launch-readiness gates, not the Definition of Done in section 3 above — re-scoring it against the new bar is tracked separately (`PLAN.md`), not done in this pass.');
  out.push('');

  const acc = accelerators(state, a);
  if (acc.length) {
    out.push('### ⚡ What would make it sooner', '');
    for (const x of acc) out.push(`- ${x.text}`);
    out.push('');
  }

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

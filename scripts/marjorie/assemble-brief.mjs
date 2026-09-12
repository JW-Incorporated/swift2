// Marjorie's deterministic brief skeleton (charter: docs/agents/marjorie.md).
//
// Gathers the raw material for a Founders' Brief from GitHub — zero LLM
// tokens — and prints a markdown brief to stdout. Marjorie's judgment pass
// tightens the prose on top of this; the skeleton alone is already a correct,
// postable brief.
//
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs            # today, live gh data
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs 2026-07-12 # explicit date (accepted, currently decorative — see below)
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs --json     # the evidence, for the journal
//
// ─── THE 2026-09-12 REBUILD (Marjorie Overhaul C2) ─────────────────────────
// docs/specs/marjorie-overhaul/c2-brief.md is the source of truth. The brief
// is now SIX sections, capped at 40 lines total (headings + blanks
// included), each with its OWN line budget so no section can starve another
// (the old single end-of-brief truncation always ate whatever section came
// last):
//
//   WAITING ON YOU — every open HUMAN-ACTIONS.md item, oldest-first, and
//       nothing else (the founder-decision/founder-task bank system that
//       used to share this section is not part of the new brief at all —
//       c2-brief.md's Data table names HUMAN-ACTIONS.md as the section's
//       only source, and acceptance criterion 5 says "exactly").
//   SINCE YESTERDAY — PRs merged/reverted, watchdog alerts opened/closed,
//       submissions in by label, an optional accountability line for
//       Marjorie's own open dispatched work, an optional pointer to a fresh
//       Tree weekly-plan PR.
//   TODAY — what routines run today, what Marjorie will do.
//   SITE — prod smoke, e2e, Vault Run freshness, content lanes.
//   TREE — one line from `social/lessons.md`, one from Tree's scorecard.
//   DISTANCE TO DONE — scored against `docs/definition-of-done.md`'s eight
//       founder-set items (NOT the retired 12-gate tracker the old estimator
//       measured), naming every non-green item's blocker.
//
// This module intentionally does NOT emit the `cc @sffan15-sys @wjduvall-cmd`
// line or the `**Founders' Brief — YYYY-MM-DD** · [issue #N](url)` header —
// both are composed by the runner prompt (`marjorie-brief.md`), the second
// one necessarily so: it links the issue's own number, which does not exist
// until after the issue is created. This module outputs just the six
// sections, always.
//
// Requires an authenticated `gh` or a GH_TOKEN. Read-only: never writes to GitHub.

import { gh as ghRun } from '../lib/gh.mjs';
import { checkRunners, loadRunnerCadence } from './standing-checks.mjs';
import { readCurrentDone, readDoneHistory, changeSinceAnchor, sinceLastBrief, lastChangeByItem, STATUS_ICONS } from './done-history.mjs';
import { readOpenActions, sortForBrief } from './human-actions.mjs';
import { fetchContentShipped } from './content-shipped.mjs';
import { fetchSubmissionCounts, renderSubmissionsLine } from './lib/submissions.mjs';
import { buildTreeLines } from './lib/tree-line.mjs';
import { runMain } from '../lib/cli.mjs';

const REPO = 'JW-Incorporated/swift2';
const DAY_MS = 86_400_000;

async function gh(args) {
  const { stdout } = await ghRun(args);
  return JSON.parse(stdout || '[]');
}

// Same fetch as `gh()`, but also surfaces `capExhausted` — `allPRs` is an
// org-wide, high-volume list a busy day can push past gh.mjs's page cap, and
// `checkRunners` (Site's Vault Run freshness check) must report a runner as
// UNKNOWN rather than a confident DARK when that happens (#3689).
async function ghWithCompleteness(args) {
  const { stdout, capExhausted } = await ghRun(args);
  return { rows: JSON.parse(stdout || '[]'), capExhausted: Boolean(capExhausted) };
}

// #3689: `gh()` above throws away the `capExhausted` flag gh.mjs computes for
// every list call. Nothing in the current six sections reads a list where a
// silent truncation could hide a founder-facing fact the way it did for the
// old founder-decision bank (that system is gone from this brief entirely —
// see the header note), but this loud-refusal helper is kept, exported and
// tested as a small, generically useful guard against exactly that failure
// mode, for whichever future source next needs it.
export async function ghCriticalList(args) {
  const { stdout, capExhausted } = await ghRun(args);
  const rows = JSON.parse(stdout || '[]');
  if (capExhausted) {
    throw new Error(
      `assemble-brief: the query \`gh ${args.join(' ')}\` hit gh.mjs's page cap and is INCOMPLETE. ` +
      'Treating a truncated fetch as a complete one is the exact #3689 failure mode — refusing to run ' +
      'rather than post a brief built on a silently short list.',
    );
  }
  return rows;
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

/** Tree's most recent weekly-plan PR (head branch starts `tree/plan/`), or
 * null. Deliberately narrower than `tree/` (Tree Overhaul T1, 2026-09-12):
 * the daily draft run's branches are also `tree/draft/<date>` now that
 * Growth folded into Tree, and this must keep meaning the weekly plan PR
 * specifically, not whichever Tree PR is most recent. */
export function findLatestTreePR(allPRs) {
  const treePRs = (allPRs || []).filter((p) => String(p.headRefName || '').startsWith('tree/plan/'));
  if (treePRs.length === 0) return null;
  return [...treePRs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

/**
 * Ticket titles in this repo are essay-length. Cut at a word boundary — a
 * line that ends mid-word ("…hotlinked across 4 er") reads as a bug and
 * undermines the rest of the brief.
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

/** Each section that would exceed its own line budget shows its first N
 * lines and a final `+N more` line instead of overflowing — a per-section
 * cap, never one global end-of-brief truncation (which always ate whatever
 * section happened to come last). */
export function capSection(lines, budget) {
  if (lines.length <= budget) return lines;
  const keep = Math.max(budget - 1, 0);
  return [...lines.slice(0, keep), `+${lines.length - keep} more`];
}

const SECTION_BUDGETS = {
  waitingOnYou: 7,
  sinceYesterday: 6,
  today: 4,
  site: 2,
  tree: 3,
  distanceToDone: 7,
};

// ─── Waiting on you ─────────────────────────────────────────────────────────

/** `- #N · Xd · [BLOCKING] Title (~eta)` — the spec's exact per-item shape.
 * No checkbox, no `HA#` prefix: acceptance criterion 5 only requires number,
 * age and title, and the filled example in c2-brief.md shows the bare
 * `#N` form throughout (GitHub auto-links a bare `#N` in an issue body on
 * its own; Discord does not, which the spec accepts — 7b only requires the
 * two channels to match each other verbatim, not to both auto-link). */
export function renderHumanActionLine(item) {
  const age = item.ageDays === null || item.ageDays === undefined ? 'age unknown' : `${item.ageDays}d`;
  const tag = item.tag === 'BLOCKING' ? '[BLOCKING] ' : '';
  const eta = item.eta ? ` (${item.eta})` : '';
  return `- #${item.number} · ${age} · ${tag}${item.title}${eta}`;
}

function buildWaitingOnYouLines(openActions) {
  if (openActions.length === 0) return ['- Nothing is waiting on you right now.'];
  const shown = openActions.slice(0, 5).map(renderHumanActionLine);
  return openActions.length > 5
    ? [...shown, `- +${openActions.length - 5} more in HUMAN-ACTIONS.md`]
    : shown;
}

// ─── Since yesterday ────────────────────────────────────────────────────────

export function renderMergedLine(merged24) {
  const list = merged24 || [];
  const reverted = list.filter((p) => /^revert\b/i.test(String(p.title || ''))).length;
  if (list.length === 0) return `- 0 PRs merged, ${reverted} reverted`;
  const numbers = list.map((p) => `#${p.number}`).join(' ');
  return `- ${list.length} PR${list.length === 1 ? '' : 's'} merged (${numbers}), ${reverted} reverted`;
}

export function renderAlertsLine(allAlerts, now) {
  const list = allAlerts || [];
  const opened = list.filter((al) => now - new Date(al.createdAt).getTime() < DAY_MS);
  const closed = list.filter((al) => al.closedAt && now - new Date(al.closedAt).getTime() < DAY_MS);
  const detail = closed.length
    ? ` (${closed.map((al) => String(al.title || '').replace(/^Watchdog:\s*/i, '').trim()).join(', ')})`
    : '';
  return `- Alerts: ${opened.length} opened, ${closed.length} closed${detail}`;
}

/** Marjorie's own accountability line: open work she filed (the
 * `marjorie-filed` label) and forgot is not the same as work that never
 * existed — this is the only place that distinction becomes visible daily
 * (c2-brief.md, "accountable for the outcome, not the ticket"). Omitted
 * entirely, per spec, whenever there is nothing dispatched. */
export function renderDispatchedLine(dispatched, now) {
  const list = dispatched || [];
  if (list.length === 0) return null;
  const oldest = [...list].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime())[0];
  const ageDays = Math.floor((now - new Date(oldest.createdAt).getTime()) / DAY_MS);
  return `- dispatched: ${list.length} open, oldest ${ageDays}d (#${oldest.number})`;
}

function buildSinceYesterdayLines(state, a, now) {
  const lines = [
    renderMergedLine(a.merged24),
    renderAlertsLine(state.alerts, now),
    renderSubmissionsLine(state.submissions),
  ];
  const dispatched = renderDispatchedLine(state.dispatched, now);
  if (dispatched) lines.push(dispatched);
  const treePR = findLatestTreePR(state.allPRs);
  if (treePR && String(treePR.state).toUpperCase() === 'OPEN') {
    lines.push(`- Tree's plan PR #${treePR.number} is up for your ✅ in #longlive-tree`);
  }
  return lines;
}

// ─── Today ──────────────────────────────────────────────────────────────────

function renderTodayRunsLine(cadence) {
  const names = (cadence?.runners || [])
    .filter((r) => !r.disabled && r.checkable !== false && (r.perDay ?? 0) > 0)
    .map((r) => r.name);
  return names.length ? `- Runs: ${names.join(', ')}` : '- Runs: no routines currently registered as scheduled.';
}

function renderTodayMeLine(openAlertsNow, oldestAction) {
  const parts = [
    `sweep the ${openAlertsNow.length} open watchdog alert${openAlertsNow.length === 1 ? '' : 's'}`,
    'triage anything new',
  ];
  if (oldestAction) parts.push(`nudge #${oldestAction.number} (open ${oldestAction.ageDays ?? '?'}d)`);
  return `- Me: ${parts.join(', ')}`;
}

function buildTodayLines(state, openAlertsNow) {
  const openActions = state.openActions || [];
  const oldestAction = openActions.length
    ? [...openActions].sort((x, y) => (y.ageDays ?? -1) - (x.ageDays ?? -1))[0]
    : null;
  return [renderTodayRunsLine(state.cadence), renderTodayMeLine(openAlertsNow, oldestAction)];
}

// ─── Site ───────────────────────────────────────────────────────────────────

/**
 * `prod smoke` / `content lanes` reuse data the brief already fetches
 * (open watchdog alerts, content shipped in the last 24h); `Vault Run`
 * freshness reuses `checkRunners`'s existing per-runner rows rather than
 * re-deriving PR-branch matching here. `e2e` has no wired health signal
 * anywhere in this repo today (confirmed: no watchdog alert, no CI-style
 * run-status fetch for `e2e.yml`) — reporting it honestly as not-yet-wired
 * rather than a fabricated green, per this file's own standing rule that a
 * check which cannot see something must say so, never claim `ok`.
 */
export function renderSiteLine({ openAlertsNow, vaultRow, contentShipped }) {
  const prodSmoke = (openAlertsNow || []).some((al) => /prod smoke/i.test(String(al.title || ''))) ? '🔴' : '🟢';
  const vaultText = !vaultRow
    ? 'Vault Run ⚪ (not in runner registry)'
    : `Vault Run last PR ${vaultRow.ageLabel === 'never seen' ? 'never seen' : `${vaultRow.ageLabel} ago`} ${vaultRow.status === 'ok' ? '🟢' : vaultRow.status === 'fail' ? '🔴' : '⚪'}`;
  const contentLanes = (contentShipped || []).length > 0 ? '🟢' : '🔴';
  return `- Prod smoke ${prodSmoke} · e2e ⚪ (not wired yet) · ${vaultText} · content lanes ${contentLanes}`;
}

// ─── Distance to done ───────────────────────────────────────────────────────

/** The closing sentence of judgment, computed rather than composed —
 * "no invented ETA" (unchanged rule) means this states only what the
 * tracker's own history already proves: the most recent recorded status
 * change among today's non-green items, and how many are blocked on
 * `nobody` (unstaffed), which is the one blocker a founder can act on. */
export function renderDistanceClosingLine(doneOpenEntries, doneSeries) {
  const lastChange = lastChangeByItem(doneSeries || []);
  const dates = doneOpenEntries.map(([num]) => lastChange[num]?.date).filter(Boolean).sort();
  const lastMoved = dates.length ? dates.at(-1) : null;
  const unstaffed = doneOpenEntries.filter(([, it]) => String(it.blockedOn || '').includes('nobody')).length;
  const movement = lastMoved ? `Last item movement recorded ${lastMoved}.` : 'No recorded status change in the tracked history yet.';
  const staffing = unstaffed ? ` ${unstaffed} item${unstaffed === 1 ? '' : 's'} blocked on \`nobody\` — that is the real distance.` : '';
  return `- ${movement}${staffing}`;
}

function buildDistanceToDoneSection(state, now) {
  const doneCurrent = state.doneItems || {};
  const doneEntries = Object.entries(doneCurrent);
  const doneGreen = doneEntries.filter(([, it]) => it.status === 'green');
  const doneOpen = doneEntries.filter(([, it]) => it.status !== 'green');
  const heading = doneEntries.length
    ? `**Distance to done** — ${doneGreen.length}/${doneEntries.length} green (\`docs/definition-of-done.md\`)`
    : '**Distance to done**';
  let lines;
  if (doneEntries.length === 0) {
    lines = ['- `docs/definition-of-done.md` did not parse — check the file exists and its table is intact.'];
  } else if (doneOpen.length === 0) {
    lines = ['- All 8 items are green. 🎉'];
  } else {
    const anchorIso = new Date(now - DAY_MS).toISOString();
    const delta = changeSinceAnchor(state.doneSeries || [], doneCurrent, anchorIso);
    const itemLines = doneOpen.map(([num, it]) => `- ${STATUS_ICONS[it.status]} #${num} ${shortTitle(it.title)} — ${sinceLastBrief(Number(num), it, delta)}`);
    // The closing sentence of judgment is reserved its own slot rather than
    // folded into the generic per-section cap below it — it is "the most
    // valuable thing in the brief" per the spec, so an oversized item list
    // truncates ITSELF, never squeezes the closing sentence out.
    const cappedItems = capSection(itemLines, SECTION_BUDGETS.distanceToDone - 1);
    lines = [...cappedItems, renderDistanceClosingLine(doneOpen, state.doneSeries || [])];
  }
  return { heading, lines };
}

// ─── fetch ─────────────────────────────────────────────────────────────────

/**
 * One fetch pass for the whole brief. Everything downstream is pure, so this
 * is the only place that touches the network — and the only place that can
 * fail.
 */
export async function fetchState(repo = REPO, { now = Date.now() } = {}) {
  const [
    { rows: allPRs, capExhausted: allPRsCapExhausted },
    alerts,
    dispatched,
    submissions,
  ] = await Promise.all([
    // Org-wide, high-volume list: also feeds Site's Vault Run freshness
    // check via checkRunners, hence ghWithCompleteness (#3689).
    ghWithCompleteness(['pr', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', 'number,title,createdAt,mergedAt,headRefName,state']),
    // `--state all`, not open-only: Since-yesterday's "opened/closed in 24h"
    // line needs issues that already closed inside the window too.
    gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert', '--state', 'all', '--limit', '100', '--json', 'number,title,createdAt,closedAt,state']),
    gh(['issue', 'list', '--repo', repo, '--label', 'marjorie-filed', '--state', 'open', '--limit', '200', '--json', 'number,createdAt']),
    fetchSubmissionCounts(repo, { now }),
  ]);

  const contentShipped = await fetchContentShipped(repo, new Date(now - DAY_MS).toISOString()).catch(() => []);

  return {
    allPRs, allPRsCapExhausted,
    alerts,
    dispatched,
    submissions,
    contentShipped,
    treeLines: buildTreeLines({ now }),
    doneItems: readCurrentDone(),
    doneSeries: readDoneHistory(),
    openActions: readOpenActions({ now }),
    cadence: loadRunnerCadence(),
    now,
  };
}

// ─── analysis (pure) ───────────────────────────────────────────────────────

/**
 * Everything the brief asserts, decided before a single line is written.
 * Exported so tests can assert on the numbers rather than on the prose, and
 * so `--json` can dump the evidence trail into the journal comment.
 */
export function analyse(state, { now = state.now ?? Date.now() } = {}) {
  const nowMs = Number(now);
  const merged24 = (state.allPRs || [])
    .filter((p) => p.mergedAt && nowMs - new Date(p.mergedAt).getTime() < DAY_MS)
    .sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime());
  return { merged24, now: nowMs };
}

// ─── render ────────────────────────────────────────────────────────────────

/**
 * Just the six sections — no `cc @…` line, no `**Founders' Brief — date**`
 * self-link header. Both are composed by the runner prompt around this
 * output (see this file's header note for why the header can't live here).
 */
export function buildBrief(state, { now = state?.now ?? Date.now() } = {}) {
  const a = analyse(state, { now });
  const out = [];

  const allAlerts = state.alerts || [];
  const openAlertsNow = allAlerts.filter((al) => String(al.state || 'open').toUpperCase() === 'OPEN');

  // ── WAITING ON YOU ────────────────────────────────────────────────────
  const openActions = sortForBrief(state.openActions || []);
  out.push(`**Waiting on you (${openActions.length})**`, '');
  out.push(...capSection(buildWaitingOnYouLines(openActions), SECTION_BUDGETS.waitingOnYou), '');

  // ── SINCE YESTERDAY ───────────────────────────────────────────────────
  out.push('**Since yesterday**', '');
  out.push(...capSection(buildSinceYesterdayLines(state, a, now), SECTION_BUDGETS.sinceYesterday), '');

  // ── TODAY ─────────────────────────────────────────────────────────────
  out.push('**Today**', '');
  out.push(...capSection(buildTodayLines(state, openAlertsNow), SECTION_BUDGETS.today), '');

  // ── SITE ──────────────────────────────────────────────────────────────
  out.push('**Site**', '');
  const runnersResult = checkRunners({
    allPRs: state.allPRs || [], issues: [], briefComments: [],
    cadence: state.cadence || { runners: [] }, now, listsCapExhausted: state.allPRsCapExhausted,
  });
  const vaultRow = runnersResult.rows.find((r) => r.runner === 'Vault Run') || null;
  const siteLines = [renderSiteLine({ openAlertsNow, vaultRow, contentShipped: state.contentShipped })];
  out.push(...capSection(siteLines, SECTION_BUDGETS.site), '');

  // ── TREE ──────────────────────────────────────────────────────────────
  out.push('**Tree**', '');
  const treeLines = state.treeLines && state.treeLines.length ? state.treeLines : ['- Nothing to report yet.'];
  out.push(...capSection(treeLines, SECTION_BUDGETS.tree), '');

  // ── DISTANCE TO DONE ──────────────────────────────────────────────────
  const distance = buildDistanceToDoneSection(state, now);
  out.push(distance.heading, '');
  out.push(...capSection(distance.lines, SECTION_BUDGETS.distanceToDone));

  return `${out.join('\n').trimEnd()}\n`;
}

// ─── entry point ───────────────────────────────────────────────────────────

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  async function main() {
    const args = process.argv.slice(2);
    const wantJson = args.includes('--json');
    // Accepted for CLI-contract compatibility (a fixed-date recovery run);
    // buildBrief no longer needs it, since the date-stamped header line
    // moved to the runner prompt's post-create edit step.
    const now = Date.now();

    const state = await fetchState(REPO, { now });

    if (wantJson) {
      process.stdout.write(`${JSON.stringify({ analysis: analyse(state, { now }), state }, null, 2)}\n`);
    } else {
      process.stdout.write(buildBrief(state, { now }));
    }
  }
  runMain(main, { name: 'assemble-brief' });
}

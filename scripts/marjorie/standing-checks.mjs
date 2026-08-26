// Section 2 of the brief: the standing maintenance checklist.
//
// THE DESIGN GOAL, IN WYATT'S WORDS: "Our goal here is to check and see if
// this is green and then ignore it if so… Punchline up top is if everything is
// good or not."
//
// So every check here obeys three rules:
//   1. DETERMINISTIC — a rule, not a judgment. Same inputs, same verdict, no
//      LLM anywhere in the path. `runStandingChecks` is pure; the caller does
//      the fetching.
//   2. CHEAP — every check reads from lists the brief already fetched, or from
//      a file on disk. The whole section costs ~2 extra REST calls.
//   3. HONEST ABOUT BLIND SPOTS — a check that cannot see something returns
//      `unknown`, never `ok`. A green line that means "I didn't look" is how
//      the 2026-08-06..11 briefs reported a healthy pipeline for five days
//      while the assembler was dead (#1869).
//
// The punchline line is green ONLY if every check is `ok`. `unknown` is not
// green — if the founders are going to skip section 2 on a green light, the
// light has to mean something.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function loadRunnerCadence(file = path.join(HERE, 'runner-cadence.json')) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function check(id, label, ok, detail, extra = {}) {
  return { id, label, status: ok === null ? 'unknown' : ok ? 'ok' : 'fail', detail, ...extra };
}

// ─── the checks ────────────────────────────────────────────────────────────

/**
 * Are all the bots running?
 *
 * Artifact-based, because that is the only thing observable from the repo:
 * the runners are cloud RemoteTriggers, not Actions, so there is no run
 * history to read. A runner is alive if the artifact its registry entry
 * promises has appeared inside its tolerance window.
 */
export function checkRunners({ allPRs = [], issues = [], cadence, now }) {
  const prs = allPRs; // liveness must look at MERGED PRs too — a runner whose
  // PR auto-merged within the hour is the healthiest case, and checking only
  // open PRs marked Vault Run, Content Shift and Growth "dark" on a day all
  // three had shipped.
  const nowMs = Number(now);
  const matchers = {
    'pr-branch': (v) => (a) => a.type === 'pr' && String(a.branch || '').startsWith(v),
    'pr-title': (v) => (a) => a.type === 'pr' && String(a.title || '').toLowerCase().includes(v.toLowerCase()),
    'issue-label': (v) => (a) => a.type === 'issue' && (a.labels || []).includes(v),
    'issue-title': (v) => (a) => a.type === 'issue' && String(a.title || '').includes(v),
  };
  const artifacts = [
    ...prs.map((p) => ({ type: 'pr', at: p.createdAt, branch: p.headRefName, title: p.title, number: p.number })),
    ...issues.map((i) => ({ type: 'issue', at: i.createdAt, title: i.title, number: i.number, labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)) })),
  ];

  const rows = [];
  for (const r of cadence.runners) {
    if (r.checkable === false) {
      rows.push({ runner: r.name, status: 'unknown', detail: r.why, lastSeen: null });
      continue;
    }
    const fn = matchers[r.match.kind]?.(r.match.value);
    if (!fn) {
      rows.push({ runner: r.name, status: 'unknown', detail: `unsupported matcher ${r.match.kind}`, lastSeen: null });
      continue;
    }
    const seen = artifacts.filter(fn).map((a) => new Date(a.at).getTime()).filter(Number.isFinite).sort();
    const last = seen.length ? seen.at(-1) : null;
    const ageHours = last === null ? null : (nowMs - last) / HOUR_MS;
    rows.push({
      runner: r.name,
      status: last === null ? 'fail' : ageHours <= r.maxAgeHours ? 'ok' : 'fail',
      lastSeen: last === null ? null : new Date(last).toISOString(),
      ageHours: ageHours === null ? null : Math.round(ageHours),
      ageLabel: ageHours === null ? 'never seen' : `${Math.round(ageHours)}h`,
      maxAgeHours: r.maxAgeHours,
      detail: last === null
        ? `no artifact in the fetched window (tolerance ${r.maxAgeHours}h)`
        : `last artifact ${Math.round(ageHours)}h ago (tolerance ${r.maxAgeHours}h)`,
    });
  }

  const dark = rows.filter((r) => r.status === 'fail');
  const blind = rows.filter((r) => r.status === 'unknown');
  return check(
    'runners',
    'All bots running',
    // `unknown` runners are a real gap, but a permanent one that no daily run
    // can close — flagging it red every day would train the founders to
    // ignore the light. It is named in the detail and tracked in the PR body.
    dark.length === 0,
    dark.length
      ? `${dark.length} dark: ${dark.slice(0, 5).map((d) => `${d.runner} (${d.ageLabel})`).join(', ')}${dark.length > 5 ? ` +${dark.length - 5}` : ''}`
      : `${rows.length - blind.length} on cadence · ${blind.length} produce no observable artifact`,
    { rows, blind: blind.map((b) => b.runner) },
  );
}

/**
 * Stuck or stale PRs.
 *
 * Three distinct failures, deliberately not merged into one number:
 *   • MERGEABLE-BUT-UNMERGED — green, reviewed, sitting there. This is merge
 *     latency, and merge latency is what caused the self-armed check-in loops
 *     that became 69% of agent spend (docs/decisions.md 2026-07-25).
 *   • RED — a failing required check. #1633 sat red for five days on a stale
 *     CI run and the brief reported it as red the whole time without anyone
 *     noticing the run was stale.
 *   • STALE — no update at all in `staleDays`.
 */
export function checkPRs({ openPRs = [], now, latencyHours = 24, staleDays = 7 }) {
  const nowMs = Number(now);
  const open = openPRs.filter((p) => String(p.state || 'OPEN').toUpperCase() === 'OPEN' && !p.isDraft);
  const ageH = (p) => (nowMs - new Date(p.createdAt).getTime()) / HOUR_MS;
  const idleD = (p) => (nowMs - new Date(p.updatedAt || p.createdAt).getTime()) / DAY_MS;

  const rollup = (p) => (p.statusCheckRollup || []).map((c) => String(c.conclusion || c.state || '').toUpperCase());
  const isRed = (p) => rollup(p).some((c) => c === 'FAILURE' || c === 'TIMED_OUT' || c === 'ERROR');
  const isGreen = (p) => rollup(p).length > 0 && !isRed(p) && !rollup(p).includes('PENDING') && !rollup(p).includes('IN_PROGRESS');

  const waiting = open.filter((p) => isGreen(p) && p.reviewDecision !== 'CHANGES_REQUESTED' && ageH(p) > latencyHours);
  const red = open.filter((p) => isRed(p) && ageH(p) > latencyHours);
  const stale = open.filter((p) => idleD(p) > staleDays);
  const unknown = open.filter((p) => rollup(p).length === 0);

  const bad = waiting.length + red.length + stale.length;
  const parts = [];
  if (waiting.length) parts.push(`${waiting.length} green >${latencyHours}h unmerged (#${waiting.map((p) => p.number).join(' #')})`);
  if (red.length) parts.push(`${red.length} red >${latencyHours}h (#${red.map((p) => p.number).join(' #')})`);
  if (stale.length) parts.push(`${stale.length} untouched >${staleDays}d (#${stale.map((p) => p.number).join(' #')})`);
  return check(
    'prs',
    'No stuck or stale PRs',
    bad === 0 ? (unknown.length ? null : true) : false,
    bad ? parts.join(' · ') : `${open.length} open, none stuck${unknown.length ? ` (${unknown.length} with no check data)` : ''}`,
    { open: open.length, waiting: waiting.map((p) => p.number), red: red.map((p) => p.number), stale: stale.map((p) => p.number) },
  );
}

/**
 * Unassigned work. Deliberately narrow: only work that is ON THE LAUNCH PATH
 * or is aging in a queue with an SLA. A general "issues with no assignee"
 * count would be noise — most tickets in this repo are worked by whichever
 * desk picks them up, and are not meant to carry an assignee.
 */
export function checkUnassigned({ issues = [], gateTickets = [], now, intakeSlaHours = 48 }) {
  const nowMs = Number(now);
  const open = issues.filter((i) => String(i.state).toLowerCase() === 'open');
  const labelsOf = (i) => (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name));

  const gateOrphans = open.filter((i) => (labelsOf(i).includes('launch-gate') || gateTickets.includes(i.number)) && (i.assignees || []).length === 0);
  const staleIntake = open.filter((i) => labelsOf(i).includes('intake') && (nowMs - new Date(i.createdAt).getTime()) / HOUR_MS > intakeSlaHours);

  const bad = gateOrphans.length + staleIntake.length;
  const parts = [];
  if (gateOrphans.length) parts.push(`${gateOrphans.length} launch-gate ticket(s) with no owner (#${gateOrphans.map((i) => i.number).join(' #')})`);
  if (staleIntake.length) parts.push(`${staleIntake.length} intake item(s) untriaged >${intakeSlaHours}h`);
  return check('unassigned', 'No unowned launch work', bad === 0, bad ? parts.join(' · ') : 'every launch-gate ticket has an owner', {
    gateOrphans: gateOrphans.map((i) => i.number),
    staleIntake: staleIntake.map((i) => i.number),
  });
}

/**
 * CI and deploy health. In this repo merging to `main` IS the deploy, so the
 * `build` runs on `main` are both the CI signal and the deploy signal.
 * `runs` is the raw workflow-run list for ci.yml on main, newest first.
 */
export function checkCI({ runs = [], now, windowHours = 24 }) {
  const nowMs = Number(now);
  if (runs.length === 0) return check('ci', 'CI and deploys healthy', null, 'no workflow-run data fetched');
  const recent = runs.filter((r) => (nowMs - new Date(r.created_at ?? r.createdAt).getTime()) / HOUR_MS <= windowHours);
  const done = recent.filter((r) => (r.status ?? r.state) === 'completed');
  const failed = done.filter((r) => r.conclusion === 'failure');
  const head = runs.find((r) => (r.status ?? r.state) === 'completed');
  const headGreen = head ? head.conclusion === 'success' : null;
  const rate = done.length ? Math.round(((done.length - failed.length) / done.length) * 100) : null;

  // main being red is the 07-30 freeze condition: it blocks every merge.
  const ok = headGreen === true && (rate === null || rate >= 80);
  return check('ci', 'CI and deploys healthy', headGreen === null ? null : ok,
    headGreen === false
      ? `main is RED — last build on main failed (${head.html_url ?? head.url ?? 'run'}). Every merge is frozen until it is green.`
      : `main green · ${rate ?? '–'}% of ${done.length} builds passed in ${windowHours}h`,
    { rate, failed: failed.length, total: done.length, headGreen });
}

/** Is anything actually going out on social? */
export function checkSocial({ queueStatus, growth }) {
  if (!queueStatus) return check('social', 'Social queue flowing', null, 'queue not readable');
  const posts = growth?.postsToday ?? null;
  const ok = queueStatus.total > 0 || (posts ?? 0) > 0;
  return check('social', 'Social queue flowing', ok,
    ok ? `${queueStatus.total} queued (${queueStatus.scheduled} scheduled, ${queueStatus.due} due) · ${posts ?? '?'} posted today`
      : 'queue empty and nothing posted today — the pipeline has nothing in it',
    { ...queueStatus, postsToday: posts });
}

/** Open watchdog alerts are, by construction, things already known to be broken. */
export function checkAlerts({ alerts = [] }) {
  const open = alerts.filter((a) => String(a.state ?? 'open').toLowerCase() === 'open');
  return check('alerts', 'No open watchdog alerts', open.length === 0,
    open.length ? open.map((a) => `#${a.number} ${a.title}`).join(' · ') : 'none open',
    { numbers: open.map((a) => a.number) });
}

/** The Task-2 line, folded in so section 2 is one place. */
export function checkConstraints({ constraints }) {
  if (!constraints) return check('constraints', 'Budget and limits inside cap', null, 'constraint collector did not run');
  const level = constraints.level;
  const msgs = Object.entries(constraints.grades)
    .filter(([, g]) => g.level !== 'ok' && g.level !== 'unknown')
    .map(([, g]) => g.message);
  return check('constraints', 'Budget and limits inside cap',
    level === 'ok' ? true : level === 'unknown' ? null : false,
    // Truncated on purpose: the full grading is in `--json` for the journal.
    // Section 2's job is "does this need me", not "here is the dataset".
    (msgs.length ? msgs : [constraints.grades.actions.message]).join(' · ').slice(0, 200),
    { level, grades: constraints.grades });
}

/**
 * Is the goalpost itself current?
 *
 * A brief whose scoreboard is copied from a month-old file is worse than no
 * scoreboard: it reported LEGAL and BACKUPS as unstaffed on the morning both
 * had open PRs. If the tracker is behind, section 2 says so — loudly — rather
 * than letting section 1 quietly launder stale data.
 */
export function checkTrackerFresh({ lag, staleRows = [], maxAgeDays = 7 }) {
  if (!lag || lag.trackerAgeDays === null) return check('tracker', 'Launch tracker current', null, 'no tracker history');
  // File age alone is not enough: the file was edited 5 days ago while
  // individual gate rows had been frozen for 30, which is how LEGAL and
  // BACKUPS were reported as unstaffed on the day both got PRs. A row whose
  // tickets have moved but whose status has not IS a stale tracker.
  const ok = lag.trackerAgeDays <= maxAgeDays && staleRows.length === 0;
  const detail = staleRows.length
    ? `${staleRows.length} gate row(s) contradicted by live tickets: ${staleRows.map((r) => r.gate).join(', ')} — fix the status column before section 1 is trusted`
    : `updated ${lag.trackerAgeDays}d ago`;
  return check('tracker', 'Launch tracker current', ok, detail, { ageDays: lag.trackerAgeDays, staleRows: staleRows.map((r) => r.gate) });
}

// ─── the roll-up ───────────────────────────────────────────────────────────

export const CHECK_ORDER = ['runners', 'prs', 'ci', 'unassigned', 'alerts', 'social', 'tracker', 'constraints'];

// Short failure nouns for the punchline. The check LABELS are phrased as the
// healthy state ("No stuck or stale PRs"), which reads backwards in a list of
// failures — "4 failing: no stuck or stale prs" says the opposite of the truth.
const FAILURE_NOUN = {
  runners: 'dark runners',
  prs: 'stuck PRs',
  ci: 'CI/deploys',
  unassigned: 'unowned work',
  alerts: 'open alerts',
  social: 'social queue',
  tracker: 'stale tracker',
  constraints: 'budget',
};

/**
 * Run every check and produce the one line the founders actually read.
 * Pure: every input is data the caller already fetched.
 */
export function runStandingChecks(input) {
  const checks = [
    checkRunners(input),
    checkPRs(input),
    checkCI(input),
    checkUnassigned(input),
    checkAlerts(input),
    checkSocial(input),
    checkTrackerFresh(input),
    checkConstraints(input),
  ].sort((a, b) => CHECK_ORDER.indexOf(a.id) - CHECK_ORDER.indexOf(b.id));

  const failing = checks.filter((c) => c.status === 'fail');
  const unknown = checks.filter((c) => c.status === 'unknown');
  const green = failing.length === 0 && unknown.length === 0;

  let punchline;
  if (green) {
    punchline = '### 🔧 Maintenance — 🟢 **all green. Nothing here needs you; stop reading.**';
  } else if (failing.length === 0) {
    punchline = `### 🔧 Maintenance — ⚪ **${unknown.length} check(s) could not run.** Not green, because "I didn't look" is not "fine".`;
  } else {
    punchline = `### 🔧 Maintenance — 🔴 **${failing.length} of ${checks.length} failing: ${failing.map((c) => FAILURE_NOUN[c.id] ?? c.id).join(', ')}.**`;
  }
  return { green, punchline, checks, failing, unknown };
}

const ICON = { ok: '🟢', fail: '🔴', unknown: '⚪' };

export function renderStandingChecks(result) {
  const out = [result.punchline, ''];
  for (const c of result.checks) out.push(`- ${ICON[c.status]} **${c.label}** — ${c.detail}`);
  return out;
}

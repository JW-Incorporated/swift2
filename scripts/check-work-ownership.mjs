// Work-ownership check — deterministic, zero-AI. Alarms when work has no owner
// a machine can name.
//
// THE BUG THIS EXISTS FOR (2026-08-11 audit): this repo routes work by *posting
// a comment*. Marjorie's charter amendment 7 lets her route "directly by
// label/comment", the receiving desk treats a routed item as greenlit — and no
// runner anywhere queries for routing comments. So "routed" is a sentence in a
// thread, not a state. The measurable consequence on the day this was written:
// 183 open issues, 4 with an assignee (all four self-claims by one desk), zero
// with any label naming a desk. Both red launch gates had been "routed" for
// weeks to a desk whose own fence excludes their change type.
//
// The same failure has a PR-side twin (docs/agents/vault-run-plan.md Phase 3.5):
// killing the self-check-in loops on 2026-07-25 removed ~69% of token spend AND
// the only thing that ever returned to a red PR. The replacement promise — "the
// next scheduled run picks it up" — is false: the next run opens a brand-new PR
// against `main`. Red and stranded PRs therefore accumulate in silence.
//
// WHAT THIS CHECKS. Five conditions, each a plain count over the open work:
//
//   unrouted   an open issue carrying no `desk:*` label past a grace window.
//              "Routed" is defined here as EXACTLY ONE `desk:*` label, because
//              that is the only routing signal a machine can query.
//   ambiguous  two or more `desk:*` labels — two desks can each believe the
//              other has it, which is worse than nobody having it.
//   unowned    `desk:unowned` — the fence complement, explicitly named. The
//              point of the label is that "no charter covers this" becomes a
//              countable state instead of a thing nobody is chartered to
//              notice. A non-empty set is not a bug; a GROWING one is.
//   abandoned  routed to a real desk, but untouched for `abandonedDays`. This
//              is the launch-gate failure: routing to a desk structurally
//              incapable of the work looks identical to routing that worked,
//              until you measure whether anything happened.
//   stalePr    an open, non-draft PR older than `stalePrDays`. Phase 3.5.
//
// WHY A BUDGET FILE, NOT A ZERO THRESHOLD. On day one every one of these is
// deeply red — that is the finding, not a false positive. But an alarm that is
// red forever is an alarm nobody reads, and this repo already learned that the
// expensive way (four disconnected watchdog alerts, #947/#1177/#1203/#1224, sat
// unread for days). So each condition is compared against a committed budget in
// `.github/work-ownership-budget.json` seeded at today's real counts. The alarm
// then means "this got WORSE", which is the thing worth waking someone for, and
// the backlog is burned down by lowering numbers in one obvious file.
//
// KNOWN GAP, stated because the same gap is stated in
// scripts/check-automerge-allowlist.mjs and for the same reason: this proves
// the counts stay under budget. It cannot prove a budget number deserves to be
// where it is. Raising one is a policy act and must be justified in the commit
// message — nothing here can force that.
//
// Exports the pure pieces (`evaluate`, `deskLabels`, `isExempt`, `EXEMPT`,
// `DESK_PREFIX`, `UNOWNED_LABEL`, `loadBudget`) for
// scripts/check-work-ownership.test.ts.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh } from './lib/gh.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..');
export const BUDGET_FILE = '.github/work-ownership-budget.json';

/** A routing label. Exactly one of these on an open issue means "routed". */
export const DESK_PREFIX = 'desk:';

/** The one `desk:*` value that means "no charter covers this". */
export const UNOWNED_LABEL = 'desk:unowned';

/** `desk:*` values that are owned by a human, not a desk — never "abandoned". */
export const HUMAN_DESKS = new Set(['desk:founder', UNOWNED_LABEL]);

/**
 * Labels that mark an issue as a LEDGER, ALERT or DIGEST rather than a unit of
 * work. These are long-lived by design — the whole point of the persistent
 * watchdog-alert pattern is that one issue stays open across an outage — so
 * counting them as unrouted work would bury the real signal.
 *
 * Keyed by label with the reason, never a bare list, so the exemption set can
 * be argued with. Same convention as `EXCLUDED` in check-automerge-allowlist.
 *
 * @type {Record<string, string>}
 */
export const EXEMPT = {
  'founders-brief': 'One issue per day, closed by the next brief — a publication, not a task.',
  'watchdog-alert': 'Persistent per-condition alert; staying open IS the mechanism (scripts/watchdog/upsert-alert.sh).',
  'routine-audit': 'The single evolving Routine Audit issue (docs/agents/routine-invariants.md).',
  'kevin-triage': "Kevin's triage digest — a queue view, not an item in the queue.",
  'kevin-digest': "Kevin's user-feedback digest — same reason.",
  'kevin-radar': "Kevin's comment radar digest — same reason.",
  'curiosity-ledger': 'Lex → Answerer handoff ledger; the desk pulls from it by label already.',
  'founder-decision': 'Banked for a founder by design — owned by the decision bank, not a desk.',
};

/** Every `desk:*` label on an item, deduped and sorted. */
export const deskLabels = (item) =>
  [...new Set((item.labels ?? []).map((l) => l.name).filter((n) => n.startsWith(DESK_PREFIX)))].sort();

/** True when an item is a ledger/alert/digest rather than a unit of work. */
export const isExempt = (item) =>
  (item.labels ?? []).some((l) => Object.prototype.hasOwnProperty.call(EXEMPT, l.name));

const hoursBetween = (a, b) => (b.getTime() - new Date(a).getTime()) / 3_600_000;
const daysBetween = (a, b) => hoursBetween(a, b) / 24;

/**
 * The whole judgement, as a pure function. No network, no clock, no fs.
 *
 * @param {{issues: any[], prs: any[]}} snapshot open issues and open PRs
 * @param {Record<string, number>} budget max tolerated count per condition
 * @param {Date} now
 * @param {{routeWithinHours: number, abandonedDays: number, stalePrDays: number}} windows
 */
export function evaluate(snapshot, budget, now, windows) {
  const { routeWithinHours, abandonedDays, stalePrDays } = windows;
  const findings = {
    unrouted: [], ambiguous: [], unowned: [], abandoned: [], stalePr: [],
  };

  for (const issue of snapshot.issues) {
    if (isExempt(issue)) continue;
    const desks = deskLabels(issue);
    const ageH = hoursBetween(issue.createdAt, now);
    const idleD = daysBetween(issue.updatedAt, now);

    if (desks.length === 0) {
      // A grace window, so a freshly-filed ticket isn't an alarm before any
      // dispatcher has had a chance to look at it.
      if (ageH > routeWithinHours) {
        findings.unrouted.push({ number: issue.number, title: issue.title, ageDays: Math.floor(ageH / 24) });
      }
      continue;
    }
    if (desks.length > 1) {
      findings.ambiguous.push({ number: issue.number, title: issue.title, desks });
      continue; // ambiguity is the finding; don't also judge its staleness
    }
    const [desk] = desks;
    if (desk === UNOWNED_LABEL) {
      findings.unowned.push({ number: issue.number, title: issue.title, ageDays: Math.floor(ageH / 24) });
      continue;
    }
    if (HUMAN_DESKS.has(desk)) continue;
    if (idleD > abandonedDays) {
      findings.abandoned.push({ number: issue.number, title: issue.title, desk, idleDays: Math.floor(idleD) });
    }
  }

  for (const pr of snapshot.prs) {
    if (pr.isDraft) continue;
    const ageD = daysBetween(pr.createdAt, now);
    if (ageD > stalePrDays) {
      findings.stalePr.push({
        number: pr.number,
        title: pr.title,
        ageDays: Math.floor(ageD),
        author: pr.author?.login ?? '',
      });
    }
  }

  // Newest-first is useless in a backlog report; oldest-first names the thing
  // that has been ignored longest.
  findings.unrouted.sort((a, b) => b.ageDays - a.ageDays);
  findings.unowned.sort((a, b) => b.ageDays - a.ageDays);
  findings.abandoned.sort((a, b) => b.idleDays - a.idleDays);
  findings.stalePr.sort((a, b) => b.ageDays - a.ageDays);
  findings.ambiguous.sort((a, b) => a.number - b.number);

  const notEnforced = budget.$notEnforced ?? {};
  const breaches = [];
  for (const [key, items] of Object.entries(findings)) {
    // A condition can be MEASURED without being ENFORCED. `unrouted` is
    // meaningless until the `desk:*` taxonomy is actually adopted — reporting
    // 138 every day and paging on it would be an alarm that is red by
    // construction, which is the failure mode this whole file exists to avoid.
    // Not-enforced is an explicit, reasoned entry in the budget file, never a
    // missing key, so it cannot become a silent hole.
    if (Object.prototype.hasOwnProperty.call(notEnforced, key)) continue;
    const max = budget[key];
    if (typeof max !== 'number') {
      breaches.push({ key, count: items.length, budget: null, over: items.length,
        reason: `no budget entry for "${key}" — refusing to run an unbounded check` });
      continue;
    }
    if (items.length > max) breaches.push({ key, count: items.length, budget: max, over: items.length - max });
  }

  return { findings, breaches, notEnforced, ok: breaches.length === 0 };
}

// ── reporting ─────────────────────────────────────────────────────────────

const LABELS = {
  unrouted: 'open issues with no `desk:*` label (nobody a machine can name owns them)',
  ambiguous: 'open issues with MORE THAN ONE `desk:*` label (two desks, each assuming the other)',
  unowned: 'open issues labelled `desk:unowned` (no charter covers them — the fence complement)',
  abandoned: 'issues routed to a desk that have not moved (routing that did not take)',
  stalePr: 'open non-draft PRs older than the window (the Phase 3.5 blind spot)',
};

const line = (key, f) => {
  if (key === 'ambiguous') return `#${f.number} — ${f.desks.join(' + ')} — ${f.title}`;
  if (key === 'abandoned') return `#${f.number} — ${f.desk}, idle ${f.idleDays}d — ${f.title}`;
  if (key === 'stalePr') return `#${f.number} — ${f.ageDays}d old${f.author ? `, ${f.author}` : ''} — ${f.title}`;
  return `#${f.number} — ${f.ageDays}d old — ${f.title}`;
};

/** Markdown body for the persistent watchdog alert. `top` caps each list. */
export function renderAlert({ findings, breaches, notEnforced = {} }, budget, windows, top = 15) {
  const out = [];
  out.push('@sffan15-sys @wjduvall-cmd — work-ownership check: one or more conditions got worse.');
  out.push('');
  out.push('This is a zero-AI count over open issues and PRs. It compares against the committed');
  out.push(`budget in \`${BUDGET_FILE}\`, which is seeded at the backlog that existed when the check`);
  out.push('shipped — so a breach means **new** work is arriving without an owner, not that the');
  out.push('old backlog still exists. Lower a budget number to bank progress; raising one is a');
  out.push('policy act and belongs in the commit message.');
  out.push('');
  for (const b of breaches) {
    out.push(`### ${b.key} — ${b.count} (budget ${b.budget ?? 'MISSING'}, over by ${b.over})`);
    out.push('');
    out.push(b.reason ? `**${b.reason}**` : LABELS[b.key] ?? '');
    out.push('');
    const items = findings[b.key] ?? [];
    for (const f of items.slice(0, top)) out.push(`- ${line(b.key, f)}`);
    if (items.length > top) out.push(`- …and ${items.length - top} more`);
    out.push('');
  }
  const suspended = Object.entries(notEnforced);
  if (suspended.length) {
    out.push('### Measured, not enforced');
    out.push('');
    for (const [key, reason] of suspended) {
      out.push(`- \`${key}\`: **${(findings[key] ?? []).length}** — ${reason}`);
    }
    out.push('');
  }
  out.push('---');
  out.push('');
  out.push('**What "owned" means here:** exactly one `desk:*` label on an open issue. Routing by');
  out.push('comment does not count and never has — a comment is not a state a runner can query.');
  out.push('If no charter covers an item, label it `desk:unowned`: that is a real answer and it');
  out.push('keeps the fence complement countable instead of invisible.');
  out.push('');
  out.push(`Windows: route within ${windows.routeWithinHours}h · abandoned after ${windows.abandonedDays}d idle · PR stale after ${windows.stalePrDays}d.`);
  out.push('');
  const inEffect = Object.keys(LABELS).map((k) => `${k}=${budget[k] ?? '—'}`).join(' · ');
  out.push(`Budget in effect: ${inEffect}`);
  out.push('');
  out.push('Source: `node scripts/check-work-ownership.mjs` (watchdog.yml, daily).');
  return out.join('\n');
}

function renderConsole({ findings, breaches, notEnforced }, budget) {
  const lines = [];
  for (const key of Object.keys(LABELS)) {
    const n = findings[key].length;
    if (Object.prototype.hasOwnProperty.call(notEnforced, key)) {
      lines.push(`· ${key.padEnd(10)} ${String(n).padStart(4)} (measured, not enforced: ${notEnforced[key]})`);
      continue;
    }
    const max = budget[key];
    lines.push(`${n <= max ? '✓' : '✗'} ${key.padEnd(10)} ${String(n).padStart(4)} (budget ${max ?? 'MISSING'})`);
  }
  if (breaches.length) {
    lines.push('');
    for (const b of breaches) {
      lines.push(`✗ ${b.key}: ${b.count} > ${b.budget ?? 'MISSING'}`);
      for (const f of (findings[b.key] ?? []).slice(0, 10)) lines.push(`      ${line(b.key, f)}`);
    }
  }
  return lines.join('\n');
}

// ── I/O ───────────────────────────────────────────────────────────────────

/** Read + validate the budget file. Throws rather than defaulting to a guess. */
export function loadBudget(text, file = BUDGET_FILE) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
  const budget = parsed.budget;
  if (!budget || typeof budget !== 'object') throw new Error(`${file} has no "budget" object.`);
  for (const key of Object.keys(LABELS)) {
    if (!Number.isInteger(budget[key]) || budget[key] < 0) {
      throw new Error(`${file}: budget.${key} must be a non-negative integer (got ${JSON.stringify(budget[key])}).`);
    }
  }
  // Suspending a condition must be an explicit, reasoned entry naming a real
  // condition — never a deleted key, which would read as an accident.
  const notEnforced = parsed.notEnforced ?? {};
  if (typeof notEnforced !== 'object' || Array.isArray(notEnforced)) {
    throw new Error(`${file}: "notEnforced" must be an object of condition → reason.`);
  }
  for (const [key, reason] of Object.entries(notEnforced)) {
    if (!Object.prototype.hasOwnProperty.call(LABELS, key)) {
      throw new Error(`${file}: notEnforced."${key}" is not a condition this check computes.`);
    }
    if (typeof reason !== 'string' || reason.trim().length < 10) {
      throw new Error(`${file}: notEnforced."${key}" needs a real reason, not ${JSON.stringify(reason)}.`);
    }
  }
  if (Object.keys(notEnforced).length === Object.keys(LABELS).length) {
    throw new Error(`${file}: every condition is suspended — that is a disabled check, not a budget.`);
  }
  budget.$notEnforced = notEnforced;

  const w = parsed.windows ?? {};
  for (const key of ['routeWithinHours', 'abandonedDays', 'stalePrDays']) {
    if (!Number.isFinite(w[key]) || w[key] <= 0) {
      throw new Error(`${file}: windows.${key} must be a positive number (got ${JSON.stringify(w[key])}).`);
    }
  }
  return { budget, windows: w, notEnforced };
}

// Fields the CLI must return. gh.mjs's REST fallback does not map all of these
// (it fills unknown fields with null), and a silently-empty label array would
// make every issue look unrouted — the loudest possible wrong answer. So the
// snapshot is validated and the run dies rather than alarming on a fiction.
const ISSUE_FIELDS = ['number', 'title', 'createdAt', 'updatedAt', 'labels'];
const PR_FIELDS = ['number', 'title', 'createdAt', 'isDraft', 'author'];

function assertShape(items, fields, what) {
  for (const item of items) {
    for (const f of fields) {
      if (item[f] === undefined || item[f] === null) {
        throw new Error(
          `${what} #${item.number ?? '?'} came back without "${f}". The GitHub query is not ` +
          'returning the fields this check reasons about, so its counts would be fiction. ' +
          'Refusing to report. (Most likely cause: the `gh` CLI is missing and scripts/lib/gh.mjs ' +
          'fell back to REST, which does not map every field.)',
        );
      }
    }
  }
}

async function fetchSnapshot(repoArgs) {
  const { stdout: issuesRaw } = await gh([
    'issue', 'list', ...repoArgs, '--state', 'open', '--limit', '1000',
    '--json', 'number,title,createdAt,updatedAt,labels,assignees',
  ]);
  const { stdout: prsRaw } = await gh([
    'pr', 'list', ...repoArgs, '--state', 'open', '--limit', '300',
    '--json', 'number,title,createdAt,isDraft,author,labels',
  ]);
  const issues = JSON.parse(issuesRaw || '[]');
  const prs = JSON.parse(prsRaw || '[]');
  assertShape(issues, ISSUE_FIELDS, 'issue');
  assertShape(prs, PR_FIELDS, 'PR');
  return { issues, prs };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const repo = arg('--repo') ?? process.env.REPO ?? process.env.GITHUB_REPOSITORY;
  const repoArgs = repo ? ['--repo', repo] : [];

  const budgetPath = join(ROOT, ...BUDGET_FILE.split('/'));
  if (!existsSync(budgetPath)) {
    throw new Error(`${BUDGET_FILE} is missing — refusing to run an unbounded check.`);
  }
  const { budget, windows } = loadBudget(readFileSync(budgetPath, 'utf8'));

  const snapshot = await fetchSnapshot(repoArgs);
  const result = evaluate(snapshot, budget, new Date(), windows);

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ ...result, budget, windows }, null, 2));
  } else {
    console.log(`work-ownership: ${snapshot.issues.length} open issue(s), ${snapshot.prs.length} open PR(s).`);
    console.log(renderConsole(result, budget));
  }

  // --alert-body writes the markdown the watchdog upserts. Written on BOTH
  // paths so the caller can pass the same file to `upsert-alert.sh close`.
  const alertFile = arg('--alert-body');
  if (alertFile) {
    writeFileSync(
      alertFile,
      result.ok
        ? `Work-ownership check is within budget as of ${new Date().toISOString().slice(0, 16)}Z — every condition at or below \`${BUDGET_FILE}\`.\n`
        : renderAlert(result, budget, windows),
    );
  }

  // Exit code IS the alarm signal the workflow branches on.
  //   0 = within budget   1 = a condition breached   2 = the check itself broke
  // The 1-vs-2 split matters: node exits 1 on an uncaught throw too, so without
  // it a broken budget file or a GitHub query returning null fields would be
  // reported to the founders as a real ownership alarm — an alert that lies
  // about what it found is worse than no alert.
  process.exit(result.ok ? 0 : 1);
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'check-work-ownership.mjs';
if (invokedDirectly) {
  try {
    await main();
  } catch (e) {
    console.error(`✗ work-ownership check could not run: ${e.message}`);
    process.exit(2);
  }
}

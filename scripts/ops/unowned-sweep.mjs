#!/usr/bin/env node
// The unowned-work sweep — deterministic, zero-LLM, no opinions.
//
// THE BUG THIS EXISTS FOR. Every scanner in this repo pulls its queue with a
// *filter*, and every filter is a fence. Work that falls outside all of them is
// not "low priority" — it is invisible, forever, by construction:
//
//   * Kevin S1  filters `label:cie`         → anything unlabeled is invisible.
//   * Kevin S3  filters `author != wjduvall-cmd` and not cie/user-feedback
//                                            → Wyatt-authored tickets are invisible.
//   * Austin    filters Kevin's buckets, or `a11y` at P2/P3
//                                            → everything else is invisible.
//
// Nobody owns the complement of a union of filters, so nothing ever reports it.
// The 2026-08-11 audit found 39 open issues with zero labels, 16 of them
// Wyatt-authored and therefore outside *every* scanner at once; a `cie:safety`
// ticket parked by a hardcoded number list since July; a `needs-manual-a11y`
// queue with 5 open and 0 ever closed; and 12 dead social posts nobody was
// paged about. None of that was a capacity problem. It was a filter problem.
//
// This script computes that complement and prints it. It is deliberately dumb —
// no model, no judgement, no writes except the one `needs-triage` label that
// makes a new unlabeled issue visible to Kevin S3 on its next run.
//
// Usage:
//   node --use-env-proxy scripts/ops/unowned-sweep.mjs              # print the report
//   node --use-env-proxy scripts/ops/unowned-sweep.mjs --json       # machine-readable
//   node --use-env-proxy scripts/ops/unowned-sweep.mjs --autolabel  # apply `needs-triage` to unlabeled
//   node --use-env-proxy scripts/ops/unowned-sweep.mjs --file-issue # refresh the standing ledger issue
//   node --use-env-proxy scripts/ops/unowned-sweep.mjs --check      # exit 1 if anything is unowned
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';

export const REPO = 'JW-Incorporated/swift2';
export const TRIAGE_LABEL = 'needs-triage';
export const PARKED_LABEL = 'kevin-skip';
export const MANUAL_A11Y_LABEL = 'needs-manual-a11y';
export const LEDGER_TITLE = 'Unowned work sweep — standing ledger';
export const LEDGER_LABEL = 'unowned-sweep';

// Which desk picks up an issue carrying this label. ADD A ROW WHENEVER YOU ADD
// A QUEUE — a label absent from this table is, by definition, a label no
// scanner is known to read, and the sweep will report its issues as unowned.
// That is the intended failure mode: loud, not silent.
//
// `bug` / `enhancement` / `documentation` are deliberately NOT here. They are
// GitHub's default descriptive labels; no scanner routes on them, and Kevin S3
// would still refuse a `wjduvall-cmd`-authored `bug` on the author fence. Giving
// them a row would let the sweep claim an owner that will never arrive — the
// precise class of lie this script exists to detect. Such tickets earn an owner
// from `needs-triage`, not from a severity word.
export const OWNED_BY = new Map([
  ['cie', 'Kevin S1 — Karen ticket solver'],
  ['user-feedback', 'Kevin S2 — user-feedback digest'],
  ['feedback', 'Kevin S2 — user-feedback digest'],
  ['a11y', 'Laura files → Austin a11y lane (P2/P3) or in-session dev (P1)'],
  ['experience', 'Nils → Content Shift desk'],
  ['intake', 'Content Shift desk'],
  ['needs-sources', 'Content Shift desk'],
  ['content-shift', 'Content Shift desk'],
  ['curiosity-ledger', 'Lex → Answerer'],
  ['crosslink-candidate', 'Lex → Answerer'],
  ['founder-decision', "Marjorie — banked into the Founders' Brief"],
  ['launch-gate', 'docs/launch-readiness.md — founder-tracked'],
  ['go-live-blocker', 'docs/launch-readiness.md — founder-tracked'],
  ['security', 'Paul Blart desk'],
  ['dependencies', 'Paul Blart desk'],
  ['deployment', 'In-session engineering'],
  ['growth', 'Growth desk'],
  ['needs-human-review', 'Blocked on a named human — tracked, not unowned'],
  ['hold', 'Deliberately held by a human'],
  [TRIAGE_LABEL, 'Kevin S3 triage (author-independent)'],
  [PARKED_LABEL, 'Parked by a documented exclusion — see docs/kevin.md'],
]);

// Labels that take a `cie` ticket OUT of Kevin S1's auto-fix queue. This is the
// legible replacement for the hardcoded `{194,203,206,298,301,153,137,138}`
// number set that used to sit in his prompt with no reason and no expiry.
export const S1_EXCLUSIONS = ['cie:safety', 'cie:escalate', PARKED_LABEL];

// Issues that are an agent's own output, not work items. They are logs and
// digests; they close when their agent's next run supersedes them.
export const LEDGER_LABELS = new Set([
  'founders-brief',
  'kevin-triage',
  'kevin-radar',
  'kevin-digest',
  'routine-audit',
  'watchdog-alert',
  'austin-built',
  LEDGER_LABEL,
]);

const labelsOf = (issue) => (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
const authorOf = (issue) => issue.author?.login ?? issue.user?.login ?? '';

/**
 * Every desk that would see this issue. Empty ⇒ nothing in the fleet reads it.
 *
 * The Kevin S3 rule is reproduced exactly as its prompt states it, including
 * the `wjduvall-cmd` author exclusion — the point of this function is to model
 * the fleet as it actually runs, not as we wish it ran.
 */
export function ownersOf(issue) {
  const labels = labelsOf(issue);
  const set = new Set(labels);
  const owners = [];

  for (const l of labels) {
    const owner = OWNED_BY.get(l);
    if (owner && !owners.includes(owner)) owners.push(owner);
  }

  // Kevin S1's own exclusions. `cie` alone is not enough to be in his queue:
  // safety and escalation findings must never be auto-fixed, and a parked
  // ticket is parked. Each of these has another home (founder / human review),
  // supplied by its own row in the table above — so removing S1 here does not
  // strand the ticket, it just stops us claiming a solver that will skip it.
  if (S1_EXCLUSIONS.some((l) => set.has(l))) {
    const i = owners.indexOf(OWNED_BY.get('cie'));
    if (i !== -1) owners.splice(i, 1);
  }

  // Kevin S3 sweeps non-content tickets, but only from other authors. An
  // explicit `needs-triage` label overrides the author fence.
  const s3Eligible =
    !set.has('cie') &&
    !set.has('user-feedback') &&
    (set.has(TRIAGE_LABEL) || (authorOf(issue) !== 'wjduvall-cmd' && authorOf(issue) !== ''));
  const s3 = 'Kevin S3 triage (author-independent)';
  if (s3Eligible && !owners.includes(s3)) owners.push(s3);

  return owners;
}

export const isLedger = (issue) => labelsOf(issue).some((l) => LEDGER_LABELS.has(l));

export function daysSince(iso, now) {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Split open issues into the sweep's four buckets. Pure — tests drive it
 * directly with fixtures, no network.
 */
export function classify(issues, now = new Date()) {
  const unowned = [];
  const unlabeled = [];
  const parked = [];
  const manualA11y = [];

  for (const issue of issues) {
    if (isLedger(issue)) continue;
    const labels = labelsOf(issue);
    const age = daysSince(issue.createdAt ?? issue.created_at, now);
    const row = { number: issue.number, title: issue.title, author: authorOf(issue), age, labels };

    if (labels.length === 0) unlabeled.push(row);
    if (ownersOf(issue).length === 0) unowned.push(row);
    if (labels.includes(PARKED_LABEL)) parked.push(row);
    if (labels.includes(MANUAL_A11Y_LABEL)) manualA11y.push(row);
  }

  const bySeniority = (a, b) => b.age - a.age;
  return {
    unowned: unowned.sort(bySeniority),
    unlabeled: unlabeled.sort(bySeniority),
    parked: parked.sort(bySeniority),
    manualA11y: manualA11y.sort(bySeniority),
  };
}

/**
 * Dead social posts, grouped by failure signature. Twelve posts died in
 * `social/failed/` between 2026-07-21 and 2026-08-04 and the only reason anyone
 * noticed was a founder asking why a metric read zero: eleven were one single
 * X credential fault repeated eleven times, not eleven separate incidents.
 * Grouping is what makes that legible at a glance.
 */
export function summarizeFailed(items, now = new Date()) {
  const groups = new Map();
  for (const it of items) {
    const sig = signatureOf(it.error ?? '');
    if (!groups.has(sig))
      groups.set(sig, {
        signature: sig,
        platform: it.platform,
        count: 0,
        oldestDays: 0,
        files: [],
      });
    const g = groups.get(sig);
    g.count += 1;
    g.files.push(it.file);
    const age = it.scheduledAt ? daysSince(it.scheduledAt, now) : 0;
    if (age > g.oldestDays) g.oldestDays = age;
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

/** Collapse a provider error to a stable "same root cause" key. */
export function signatureOf(error) {
  const s = String(error);
  const http = s.match(/\((\d{3})\)/)?.[1];
  const code = s.match(/"code":\s*(\d+)/)?.[1];
  const platform = /instagram/i.test(s) ? 'Instagram' : /X post/i.test(s) ? 'X' : 'unknown';
  const detail = s.match(/"(?:detail|message)":\s*"([^"]{0,80})/)?.[1] ?? 'unknown error';
  return `${platform} ${http ? `HTTP ${http}` : code ? `code ${code}` : ''} — ${detail}`
    .replace(/\s+/g, ' ')
    .trim();
}

export function readFailedDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        return {
          file: f,
          platform: j.platform,
          scheduledAt: j.scheduledAt,
          error: j.error ?? j.lastError ?? '',
        };
      } catch {
        return {
          file: f,
          platform: 'unparseable',
          scheduledAt: null,
          error: 'file did not parse as JSON',
        };
      }
    });
}

const link = (n) => `[#${n}](https://github.com/${REPO}/issues/${n})`;
const rows = (list, limit = 60) =>
  list
    .slice(0, limit)
    .map((r) => `- ${link(r.number)} · \`${r.author}\` · ${r.age}d — ${r.title}`)
    .join('\n') + (list.length > limit ? `\n- _…and ${list.length - limit} more_` : '');

export function renderReport({ unowned, unlabeled, parked, manualA11y, failed }, now = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  const out = [];
  out.push(
    `_Deterministic sweep — \`node --use-env-proxy scripts/ops/unowned-sweep.mjs\`. No model ran. Last swept ${stamp}._`,
  );
  out.push('');
  out.push(
    '**Unowned = no scheduled scanner\'s filter reaches it.** Not "low priority" — invisible.',
  );
  out.push(
    'Ownership is defined by the `OWNED_BY` table in the script; add a row when you add a queue.',
  );
  out.push('');
  out.push(`| Queue | Count |`);
  out.push(`|---|---|`);
  out.push(`| 🔴 Unowned open issues | **${unowned.length}** |`);
  out.push(`| ⚪ Of those, carrying zero labels | ${unlabeled.length} |`);
  out.push(`| 🅿️ Parked by documented exclusion (\`${PARKED_LABEL}\`) | ${parked.length} |`);
  out.push(`| ♿ \`${MANUAL_A11Y_LABEL}\` open | ${manualA11y.length} |`);
  out.push(
    `| 📮 Dead social posts in \`social/failed/\` | ${failed.reduce((n, g) => n + g.count, 0)} |`,
  );
  out.push('');

  out.push(`### 🔴 Unowned (${unowned.length})`);
  out.push(
    unowned.length
      ? rows(unowned)
      : '_None. Every open issue is reachable by at least one scanner._',
  );
  out.push('');

  out.push(`### 🅿️ Parked — \`${PARKED_LABEL}\` (${parked.length})`);
  out.push(
    'Deliberately excluded from Kevin S1. Each needs a reason + review date recorded on the ticket (`docs/kevin.md` → "The parked set"). Listed every run so a park can never become permanent by silence.',
  );
  out.push(parked.length ? rows(parked) : '_None parked._');
  out.push('');

  out.push(`### ♿ Manual accessibility — \`${MANUAL_A11Y_LABEL}\` (${manualA11y.length})`);
  out.push(
    'Austin is barred from these by charter. They move only via the founder AT checklist (`docs/a11y-manual-queue.md`).',
  );
  out.push(manualA11y.length ? rows(manualA11y) : '_None open._');
  out.push('');

  out.push(`### 📮 Dead social posts (${failed.reduce((n, g) => n + g.count, 0)})`);
  if (!failed.length) out.push('_`social/failed/` is empty._');
  for (const g of failed) {
    out.push(
      `- **${g.count}× ${g.signature}** — oldest ${g.oldestDays}d. \`${g.files[0]}\`${g.count > 1 ? ` +${g.count - 1} more` : ''}`,
    );
  }
  out.push('');
  out.push(
    'Repeated identical signatures are **one fault, not N incidents** — fix the cause, then clear the directory.',
  );
  return out.join('\n');
}

// ---------------------------------------------------------------- I/O layer

async function fetchOpenIssues() {
  const { stdout } = await gh([
    'issue',
    'list',
    '--repo',
    REPO,
    '--state',
    'open',
    '--limit',
    '500',
    '--json',
    'number,title,labels,author,createdAt',
  ]);
  return JSON.parse(stdout || '[]');
}

async function applyTriageLabel(numbers) {
  for (const n of numbers) {
    await gh(['issue', 'edit', String(n), '--repo', REPO, '--add-label', TRIAGE_LABEL]);
    console.error(`  labeled #${n} ${TRIAGE_LABEL}`);
  }
}

async function refreshLedger(body) {
  const { stdout } = await gh([
    'issue',
    'list',
    '--repo',
    REPO,
    '--state',
    'open',
    '--label',
    LEDGER_LABEL,
    '--json',
    'number,title',
    '--limit',
    '5',
  ]);
  const existing = JSON.parse(stdout || '[]').find((i) => i.title === LEDGER_TITLE);
  const args = existing
    ? ['issue', 'edit', String(existing.number), '--repo', REPO, '--body', body]
    : [
        'issue',
        'create',
        '--repo',
        REPO,
        '--title',
        LEDGER_TITLE,
        '--label',
        LEDGER_LABEL,
        '--body',
        body,
      ];
  await gh(args);
  console.error(existing ? `refreshed ledger #${existing.number}` : 'created ledger issue');
}

async function main(argv) {
  const flags = new Set(argv);
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
  const issues = await fetchOpenIssues();
  const state = classify(issues);
  const failed = summarizeFailed(readFailedDir(join(root, 'social', 'failed')));
  const full = { ...state, failed };

  if (flags.has('--json')) {
    console.log(JSON.stringify(full, null, 2));
  } else {
    console.log(renderReport(full));
  }

  if (flags.has('--autolabel') && state.unlabeled.length) {
    console.error(`\napplying ${TRIAGE_LABEL} to ${state.unlabeled.length} unlabeled issue(s)…`);
    await applyTriageLabel(state.unlabeled.map((r) => r.number));
  }
  if (flags.has('--file-issue')) await refreshLedger(renderReport(full));

  if (flags.has('--check') && state.unowned.length) {
    console.error(`\nFAIL: ${state.unowned.length} open issue(s) no scanner owns.`);
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href
) {
  runMain(() => main(process.argv.slice(2)), { name: 'unowned-sweep' });
}

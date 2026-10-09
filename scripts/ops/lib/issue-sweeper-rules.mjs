// Pure decision logic for scripts/ops/issue-sweeper.mjs. No I/O, no clock reads:
// callers pass `now`, the open-PR reference set and a workflow-run lookup, so
// every rule is unit-testable. Closes (never deletes) machine-filed issues that
// deterministic rules prove stale.

export const FOUNDER_LOGIN = 'sffan15-sys';

export const PROTECTED_LABELS = [
  'founder-task',
  'hold',
  'founder-decision',
  'founder-assigned',
  'needs-human-review',
  'claimed',
  'in-progress',
  'status-page',
  'weekly-plan',
];

export const REPORT_LABELS = [
  'kevin-radar',
  'kevin-digest',
  'kevin-triage',
  'routine-audit',
  'automation-review',
];

export const INTAKE_TTL_DAYS = 14;

export const labelNames = (issue) =>
  (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));

const hasLabel = (issue, name) => labelNames(issue).includes(name);

export function isBotAuthor(login) {
  if (!login) return false;
  return login.startsWith('app/') || login.endsWith('[bot]');
}

export function authorLogin(issue) {
  return issue.author?.login ?? issue.user?.login ?? '';
}

/** Returns null when eligible, else the reason it is skipped. */
export function guardReason(issue, prRefs = new Set()) {
  const login = authorLogin(issue);
  if (!(isBotAuthor(login) || login === FOUNDER_LOGIN)) {
    return `human author (${login || 'unknown'})`;
  }
  if ((issue.assignees ?? []).length > 0) return 'assigned';
  const protectedLabel = PROTECTED_LABELS.find((l) => hasLabel(issue, l));
  if (protectedLabel) return `protected label (${protectedLabel})`;
  if (prRefs.has(issue.number)) return 'open PR references it';
  return null;
}

/** Numbers referenced as #<n> in a list of PR bodies/titles. */
export function collectPrRefs(prs) {
  const refs = new Set();
  for (const pr of prs) {
    const text = `${pr.title ?? ''}\n${pr.body ?? ''}`;
    for (const m of text.matchAll(/#(\d+)/g)) refs.add(Number(m[1]));
  }
  return refs;
}

const byCreatedDesc = (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

export function supersedeReport(issues) {
  const out = [];
  for (const label of REPORT_LABELS) {
    const group = issues.filter((i) => hasLabel(i, label)).sort(byCreatedDesc);
    if (group.length < 2) continue;
    const newest = group[0];
    for (const old of group.slice(1)) {
      out.push({
        number: old.number,
        rule: 'supersede-report',
        title: old.title,
        reason: `${label}: newer report #${newest.number}`,
        comment: `Superseded by #${newest.number} (newer report of the same kind). Reopen if still needed.`,
      });
    }
  }
  return out;
}

export function intakeTtl(issues, now) {
  const out = [];
  for (const i of issues) {
    if (!hasLabel(i, 'intake')) continue;
    const ageDays = (now.getTime() - Date.parse(i.updatedAt)) / 86_400_000;
    if (ageDays < INTAKE_TTL_DAYS) continue;
    out.push({
      number: i.number,
      rule: 'intake-ttl',
      title: i.title,
      reason: `intake untouched ${Math.floor(ageDays)} days`,
      comment:
        'Expired news intake (no activity 14+ days); Tree has used or passed on it. Reopen if still relevant.',
    });
  }
  return out;
}

export function workflowFileFromTitle(title) {
  const m = /([\w.-]+\.ya?ml)\b/.exec(title ?? '');
  return m ? m[1] : null;
}

/** `latestRun(file)` returns { conclusion, createdAt, url } or null (latest completed run). */
export function watchdogRecovered(issues, latestRun) {
  const out = [];
  for (const i of issues) {
    if (!hasLabel(i, 'watchdog-alert')) continue;
    const file = workflowFileFromTitle(i.title);
    if (!file) continue;
    const run = latestRun(file);
    if (!run || run.conclusion !== 'success') continue;
    if (Date.parse(run.createdAt) <= Date.parse(i.createdAt)) continue;
    out.push({
      number: i.number,
      rule: 'watchdog-recovered',
      title: i.title,
      reason: `${file} green since alert: ${run.url}`,
      comment: `The workflow has run green since this alert (${run.url}). Reopen if still needed.`,
    });
  }
  return out;
}

export function cieKey(title) {
  const m = /:\s+"(.*)"\s*$/.exec(title ?? '');
  return m ? m[1].trim().toLowerCase() : null;
}

export function cieDuplicate(issues) {
  const groups = new Map();
  for (const i of issues) {
    if (!hasLabel(i, 'cie') || !(hasLabel(i, 'cie:P1') || hasLabel(i, 'cie:P2'))) continue;
    const key = cieKey(i.title);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  }
  const out = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort(byCreatedDesc);
    for (const old of group.slice(1)) {
      out.push({
        number: old.number,
        rule: 'cie-duplicate',
        title: old.title,
        reason: `duplicate of #${group[0].number}`,
        comment: `Duplicate of #${group[0].number} (same CIE page, newer issue kept). Reopen if still needed.`,
      });
    }
  }
  return out;
}

/**
 * Applies the hard guard BEFORE every rule (rules only ever see eligible
 * issues), then returns { plan, skipped }. First rule to claim an issue wins.
 */
export function buildPlan({ issues, prRefs = new Set(), now = new Date(), latestRun = () => null }) {
  const eligible = [];
  const skipped = [];
  for (const i of issues) {
    const reason = guardReason(i, prRefs);
    if (reason) skipped.push({ number: i.number, title: i.title, reason });
    else eligible.push(i);
  }
  const candidates = [
    ...supersedeReport(eligible),
    ...intakeTtl(eligible, now),
    ...watchdogRecovered(eligible, latestRun),
    ...cieDuplicate(eligible),
  ];
  const seen = new Set();
  const plan = [];
  for (const c of candidates) {
    if (seen.has(c.number)) continue;
    seen.add(c.number);
    plan.push(c);
  }
  return { plan, skipped };
}

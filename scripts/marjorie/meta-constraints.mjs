// Standing measurement for the constraints that have already bitten us.
//
// ─── WHY ──────────────────────────────────────────────────────────────────
// Every meta-constraint failure so far was found by accident, after it hurt:
//   • 2026-07-27 — the account crossed 90% of its included Actions minutes.
//     Nobody knew until GitHub said so.
//   • 2026-07-30 — `build` went red on main and froze every merge for 24h
//     (#1641). Still open, still un-root-caused.
//   • 2026-07-25 — an audit found ~208 cloud agent sessions/day, ~69% of them
//     agents re-reading their own unchanged PRs. The audit was one human
//     effort. Nothing has measured it since, so the next drift will again be
//     found by accident.
//
// ─── DESIGN CONSTRAINTS ───────────────────────────────────────────────────
// A monitor that burns the budget it monitors is self-defeating. So:
//   • ZERO LLM tokens. This is a script.
//   • ZERO new GitHub Actions workflows — adding one would consume the very
//     minutes being measured. It runs in-process during the brief assembly,
//     which is a cloud session that was happening anyway.
//   • ZERO ledger files. GitHub already stores the daily history we need; a
//     ledger would only add a thing that can drift out of sync (the exact
//     failure mode `docs/agents/runners.md` documents for the runner list).
//   • ~5 REST calls total, all cheap list endpoints.
//
// ─── THE ACCESS QUESTION, ANSWERED ────────────────────────────────────────
// It is widely assumed in this repo that Actions billing needs `admin:org`.
// That is true of the OLD endpoint and false of the new one:
//
//   GET /orgs/{org}/settings/billing/actions
//        → 410 Gone ("This endpoint has been moved") AND needs admin:org
//   GET /organizations/{org}/settings/billing/usage?year=&month=
//        → 200 OK on the CURRENT token (scopes: gist, read:org, repo, workflow)
//
// Verified 2026-08-11 against JW-Incorporated. The enhanced billing platform
// endpoint returns per-day, per-repo, per-SKU line items — strictly better
// than the old aggregate. **No new scope is required for Actions minutes.**

import { ghApiSoft } from './lib/gh-api.mjs';

const DAY_MS = 86_400_000;

// GitHub's own multipliers: a macOS minute costs 10 included minutes.
export const SKU_MULTIPLIER = [
  [/macos/i, 10],
  [/windows/i, 2],
  [/linux/i, 1],
];

// Included Actions minutes per month by org plan (GitHub's published tiers).
export const INCLUDED_MINUTES_BY_PLAN = { free: 2000, team: 3000, business: 50000, enterprise: 50000 };

export function multiplierFor(sku) {
  for (const [re, m] of SKU_MULTIPLIER) if (re.test(sku)) return m;
  return 1;
}

/**
 * Roll the billing usage line items up into included-minute equivalents.
 *
 * The API reports raw minutes per SKU; the *allowance* is spent in multiplied
 * minutes. Reporting raw minutes against a multiplied allowance is how you
 * believe you are at 53% while GitHub thinks you are at 90%.
 */
export function summarizeActionsUsage(usageItems, { includedMinutes, now, monthStart }) {
  const items = (usageItems || []).filter((u) => u.product === 'actions' && /minute/i.test(u.unitType || ''));
  let billableMinutes = 0;
  let rawMinutes = 0;
  let netAmount = 0;
  const byRepo = new Map();
  const byDay = new Map();

  for (const u of items) {
    const mult = multiplierFor(u.sku || '');
    const billable = (u.quantity || 0) * mult;
    billableMinutes += billable;
    rawMinutes += u.quantity || 0;
    netAmount += u.netAmount || 0;
    byRepo.set(u.repositoryName, (byRepo.get(u.repositoryName) || 0) + billable);
    const day = String(u.date || '').slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + billable);
  }

  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const startMs = new Date(monthStart).getTime();
  const elapsedDays = Math.max(1 / 24, (nowMs - startMs) / DAY_MS);
  const daysInMonth = new Date(new Date(startMs).getUTCFullYear(), new Date(startMs).getUTCMonth() + 1, 0).getUTCDate();
  const perDay = billableMinutes / elapsedDays;
  const projected = perDay * daysInMonth;

  const pctUsed = includedMinutes ? (billableMinutes / includedMinutes) * 100 : null;
  const pctProjected = includedMinutes ? (projected / includedMinutes) * 100 : null;
  const remaining = includedMinutes ? includedMinutes - billableMinutes : null;
  const daysToExhaustion = includedMinutes && perDay > 0 ? remaining / perDay : null;

  return {
    billableMinutes: Math.round(billableMinutes),
    rawMinutes: Math.round(rawMinutes),
    includedMinutes,
    netAmountUsd: Number(netAmount.toFixed(2)),
    perDayMinutes: Math.round(perDay),
    projectedMonthMinutes: Math.round(projected),
    pctUsed: pctUsed === null ? null : Number(pctUsed.toFixed(1)),
    pctProjected: pctProjected === null ? null : Number(pctProjected.toFixed(1)),
    remainingMinutes: remaining === null ? null : Math.round(remaining),
    daysToExhaustion: daysToExhaustion === null ? null : Number(daysToExhaustion.toFixed(1)),
    elapsedDays: Number(elapsedDays.toFixed(2)),
    daysInMonth,
    byRepo: [...byRepo].map(([repo, min]) => ({ repo, minutes: Math.round(min) })).sort((a, b) => b.minutes - a.minutes),
    byDay: [...byDay].sort().map(([date, min]) => ({ date, minutes: Math.round(min) })),
  };
}

/**
 * Alert BEFORE it bites, not after.
 *
 * `warn` fires at 70% consumed or a projection over 90% — early enough that
 * throttling a runner still helps. `alarm` fires at 90% consumed (the exact
 * point reached on 2026-07-27) or a projection over 100%.
 *
 * TWO SIGNALS, AND THEY CAN DISAGREE. `netAmountUsd` is what GitHub has
 * actually charged beyond the included allowance — a hard fact. Minutes
 * against the plan's published allowance is a derived figure, and on
 * 2026-08-11 the two disagreed sharply: July consumed 4,445 billable minutes
 * against a Team allowance of 3,000 (148%) while netAmount was $0.00. One of
 * "the org has more allowance than the published tier" and "the discount
 * fields do not mean what they appear to" must be true, and only the org
 * billing page settles it. We report both numbers and say they disagree
 * rather than picking the comfortable one.
 */
export function gradeActionsUsage(u) {
  if (!u || u.pctUsed === null) return { level: 'unknown', message: 'Actions usage unavailable' };
  const billed = u.netAmountUsd > 0;
  const over = u.pctUsed >= 90 || (u.pctProjected ?? 0) > 100;
  const disagreement = over && !billed
    ? ' — but GitHub has billed $0.00, which contradicts that; confirm the real allowance (docs/ops/meta-constraints.md)'
    : '';

  if (over) {
    return {
      level: billed ? 'alarm' : 'warn',
      message: `Actions minutes ${u.pctUsed}% of the published ${u.includedMinutes}-min allowance, on pace for ${u.pctProjected}% by month end` +
        (u.daysToExhaustion !== null && u.daysToExhaustion > 0 ? ` (~${u.daysToExhaustion}d headroom)` : '') +
        (billed ? ` · $${u.netAmountUsd} already charged` : '') + disagreement,
    };
  }
  if (u.pctUsed >= 70 || (u.pctProjected ?? 0) >= 90) {
    return { level: 'warn', message: `Actions minutes ${u.pctUsed}% used, projecting ${u.pctProjected}% by month end` };
  }
  return { level: 'ok', message: `Actions ${u.pctUsed}% of ${u.includedMinutes} min (projecting ${u.pctProjected}%)` };
}

/**
 * Which workflow is eating the minutes.
 *
 * The billing API breaks usage down by repo and SKU but not by workflow, and
 * the exact per-run figure (`/actions/runs/{id}/timing`) costs one request per
 * run — 1,058 requests for a week, which is precisely the kind of monitor that
 * pays for itself in the wrong direction.
 *
 * So this approximates: wall-clock `updated_at - run_started_at`, summed by
 * workflow, over at most `maxPages` × 100 recent runs. It UNDER-counts runs
 * with parallel jobs (billing charges each job's minutes; wall clock counts
 * the span once) and over-counts runs that waited on a queue. It is therefore
 * only ever used to RANK workflows, never to state a minute total — the
 * billing API owns the total.
 */
export function attributeRunMinutes(runs) {
  const by = new Map();
  for (const r of runs || []) {
    const start = new Date(r.run_started_at ?? r.created_at).getTime();
    const end = new Date(r.updated_at).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    const mins = (end - start) / 60_000;
    const cur = by.get(r.name) || { workflow: r.name, runs: 0, approxMinutes: 0 };
    cur.runs += 1;
    cur.approxMinutes += mins;
    by.set(r.name, cur);
  }
  return [...by.values()]
    .map((x) => ({ ...x, approxMinutes: Math.round(x.approxMinutes) }))
    .sort((a, b) => b.approxMinutes - a.approxMinutes);
}

/**
 * Agent run volume — measured by the only thing GitHub can see.
 *
 * HONEST LIMITATION, STATED RATHER THAN PAPERED OVER: the authoritative count
 * of scheduled cloud sessions lives in the Claude Code routine list, not in
 * GitHub. Nothing here can see a session that produced no artifact — and the
 * 2026-07-25 audit's worst offenders were exactly that: 144 sessions/day whose
 * entire output was "still open, still green".
 *
 * What IS measurable, and what would still have caught the drift: artifacts
 * per runner per day, against the cadence the registry claims. `Lex depth` was
 * documented as disabled while running 12×/day; a duplicate Kevin fleet ran
 * 8×/day where 4 were intended. Both are cadence drift and both show up here.
 */
export function summarizeRunVolume(artifacts, expectations, { now, windowDays = 7 } = {}) {
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const since = nowMs - windowDays * DAY_MS;
  const rows = [];
  for (const exp of expectations) {
    const seen = artifacts.filter((a) => exp.match(a) && new Date(a.at).getTime() >= since);
    const observedPerDay = seen.length / windowDays;
    const expectedPerDay = exp.perDay;
    const ratio = expectedPerDay > 0 ? observedPerDay / expectedPerDay : (observedPerDay > 0 ? Infinity : 1);
    rows.push({
      runner: exp.name,
      expectedPerDay,
      observedPerDay: Number(observedPerDay.toFixed(2)),
      observedCount: seen.length,
      ratio: Number.isFinite(ratio) ? Number(ratio.toFixed(2)) : null,
      lastSeen: seen.length ? seen.map((a) => a.at).sort().at(-1) : null,
      // Over-running is a budget leak; under-running is a dead runner. Both matter.
      verdict: expectedPerDay === 0 && observedPerDay > 0 ? 'running-while-disabled'
        : observedPerDay === 0 && expectedPerDay > 0 ? 'silent'
          : ratio > 1.5 ? 'over-cadence'
            : ratio < 0.5 ? 'under-cadence' : 'ok',
    });
  }
  return rows;
}

/** PR/issue throughput and backlog age — the "is work flowing" numbers. */
export function summarizeThroughput({ prs = [], issues = [] }, { now, windowDays = 7 } = {}) {
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const since = nowMs - windowDays * DAY_MS;
  const inWindow = (iso) => iso && new Date(iso).getTime() >= since;

  const mergedInWindow = prs.filter((p) => inWindow(p.mergedAt));
  const openedInWindow = prs.filter((p) => inWindow(p.createdAt));
  const openPRs = prs.filter((p) => String(p.state).toLowerCase() === 'open');
  const openIssues = issues.filter((i) => String(i.state).toLowerCase() === 'open');
  const closedInWindow = issues.filter((i) => inWindow(i.closedAt));
  const issuesOpenedInWindow = issues.filter((i) => inWindow(i.createdAt));

  const ages = openIssues
    .map((i) => (nowMs - new Date(i.createdAt).getTime()) / DAY_MS)
    .sort((a, b) => a - b);
  const pct = (p) => (ages.length ? Number(ages[Math.min(ages.length - 1, Math.floor((p / 100) * ages.length))].toFixed(1)) : null);

  return {
    windowDays,
    prsMergedPerDay: Number((mergedInWindow.length / windowDays).toFixed(2)),
    prsOpenedPerDay: Number((openedInWindow.length / windowDays).toFixed(2)),
    openPRs: openPRs.length,
    // Below 1.0 means the open-PR pile grows every week — the merge-latency
    // condition that caused the self-check-in loops in the first place.
    prCloseRatio: openedInWindow.length ? Number((mergedInWindow.length / openedInWindow.length).toFixed(2)) : null,
    issuesClosedPerDay: Number((closedInWindow.length / windowDays).toFixed(2)),
    issuesOpenedPerDay: Number((issuesOpenedInWindow.length / windowDays).toFixed(2)),
    issueCloseRatio: issuesOpenedInWindow.length ? Number((closedInWindow.length / issuesOpenedInWindow.length).toFixed(2)) : null,
    openIssues: openIssues.length,
    backlogAgeP50Days: pct(50),
    backlogAgeP90Days: pct(90),
  };
}

export function gradeThroughput(t) {
  if (!t) return { level: 'unknown', message: 'throughput unavailable' };
  const problems = [];
  if (t.prCloseRatio !== null && t.prCloseRatio < 0.8) problems.push(`PR pile growing (${t.prsMergedPerDay}/day merged vs ${t.prsOpenedPerDay}/day opened)`);
  if (t.issueCloseRatio !== null && t.issueCloseRatio < 0.8) problems.push(`issue backlog growing (${t.issuesClosedPerDay} closed vs ${t.issuesOpenedPerDay} opened per day)`);
  if ((t.backlogAgeP90Days ?? 0) > 30) problems.push(`oldest tenth of the backlog is ${t.backlogAgeP90Days}d old`);
  return problems.length
    ? { level: 'warn', message: problems.join('; ') }
    : { level: 'ok', message: `${t.prsMergedPerDay} PRs/day merged · backlog p50 ${t.backlogAgeP50Days}d` };
}

/**
 * Fetch everything and grade it. ~3 REST calls plus whatever the caller
 * already had; `state` lets the brief pass in lists it has already fetched so
 * nothing is requested twice.
 */
export async function collectConstraints({ org, repo, now = Date.now(), plan = 'team', state = {}, expectations = [], artifacts = [], ciRuns = [] } = {}) {
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const d = new Date(nowMs);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const monthStart = Date.UTC(year, month - 1, 1);

  const billing = await ghApiSoft(`/organizations/${org}/settings/billing/usage?year=${year}&month=${month}`);
  const actions = billing.ok
    ? summarizeActionsUsage(billing.data?.usageItems, {
      includedMinutes: INCLUDED_MINUTES_BY_PLAN[plan] ?? null,
      now: nowMs,
      monthStart,
    })
    : null;

  // One extra page of runs (any workflow) so the burn can be attributed. Cheap
  // and bounded: 100 runs, one request.
  const recentRuns = await ghApiSoft(`/repos/${repo}/actions/runs?per_page=100`, { workflow_runs: [] });
  const topWorkflows = attributeRunMinutes(recentRuns.data?.workflow_runs ?? ciRuns).slice(0, 4);

  const throughput = summarizeThroughput({ prs: state.allPRs ?? [], issues: state.allIssues ?? [] }, { now: nowMs });
  const runVolume = summarizeRunVolume(artifacts, expectations, { now: nowMs });

  const grades = {
    actions: gradeActionsUsage(actions),
    throughput: gradeThroughput(throughput),
    runVolume: gradeRunVolume(runVolume),
  };
  const worst = ['alarm', 'warn', 'unknown', 'ok'].find((l) => Object.values(grades).some((g) => g.level === l)) || 'ok';

  return {
    asOf: new Date(nowMs).toISOString(),
    org,
    repo,
    plan,
    billingError: billing.ok ? null : billing.error,
    actions,
    topWorkflows,
    throughput,
    runVolume,
    grades,
    level: worst,
  };
}

export function gradeRunVolume(rows) {
  const bad = rows.filter((r) => r.verdict !== 'ok');
  if (rows.length === 0) return { level: 'unknown', message: 'no runner expectations configured' };
  if (bad.length === 0) return { level: 'ok', message: `${rows.length} runners on cadence` };
  const over = bad.filter((r) => r.verdict === 'over-cadence' || r.verdict === 'running-while-disabled');
  return {
    level: over.length ? 'alarm' : 'warn',
    message: bad.map((r) => `${r.runner}: ${r.verdict} (${r.observedPerDay}/day vs ${r.expectedPerDay})`).join('; '),
  };
}

/** The single line Section 2 prints. */
export function renderConstraintLine(c) {
  if (!c) return '- Meta-constraints: unavailable';
  const icon = { ok: '🟢', warn: '🟡', alarm: '🔴', unknown: '⚪' }[c.level] || '⚪';
  const parts = [];
  if (c.actions) {
    parts.push(`Actions ${c.actions.pctUsed}% of ${c.actions.includedMinutes}min (proj ${c.actions.pctProjected}%)`);
  } else {
    parts.push(`Actions usage unavailable${c.billingError ? ` — ${c.billingError.slice(0, 60)}` : ''}`);
  }
  parts.push(`${c.throughput.prsMergedPerDay} PRs/day merged, ${c.throughput.openPRs} open`);
  parts.push(`backlog p50 ${c.throughput.backlogAgeP50Days}d / p90 ${c.throughput.backlogAgeP90Days}d`);
  const drift = c.runVolume.filter((r) => r.verdict !== 'ok').length;
  parts.push(drift ? `${drift} runner(s) off cadence` : 'runners on cadence');
  return `- ${icon} **Budget & limits:** ${parts.join(' · ')}`;
}

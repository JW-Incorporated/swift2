// Pure summarisers for the ops maintenance snapshot.
//
// Every function here is deterministic and I/O-free: it takes already-fetched
// API payloads and reduces them to the few numbers the Founders' Brief's
// maintenance section needs. All network work lives in
// scripts/ops/collect-maintenance.mjs so this file stays unit-testable.
//
// THE ONE INVARIANT: `null` means "we could not find out", and `null` never
// renders as green. A source we failed to reach is listed by name in
// `unknown` and drags the overall verdict to amber. This is the same rule
// scripts/social/lib/growth.mjs applies to follower deltas ("yields null
// rather than a misleading 0 — the brief distinguishes 'flat' from
// 'unknown'"), applied to infrastructure health, where a silent false green
// is the exact failure mode the 2026-08-04 Supabase advisory demonstrated.

/** A Supabase advisor lint at this level is a hard red. */
export const SUPABASE_RED_LEVELS = ['ERROR'];

/** This many failed preview deployments for one project inside the window is a red. */
export const VERCEL_PREVIEW_FAILURE_RED = 3;

/**
 * Dependabot alerts at these severities count toward the red verdict once
 * they are older than DEPENDABOT_GRACE_DAYS. Fresh alerts are amber: the
 * weekly Dependabot lane usually lands the fix on its own.
 */
export const DEPENDABOT_RED_SEVERITIES = ['critical', 'high'];
export const DEPENDABOT_GRACE_DAYS = 7;

/** Fraction of the plan's included allowance above which spend goes amber. */
export const SPEND_AMBER_FRACTION = 0.8;

const MS_PER_HOUR = 3_600_000;

function hoursBetween(laterIso, earlierIso) {
  const later = Date.parse(laterIso);
  const earlier = Date.parse(earlierIso);
  if (!Number.isFinite(later) || !Number.isFinite(earlier)) return null;
  return (later - earlier) / MS_PER_HOUR;
}

/**
 * Reduce a Vercel `GET /v7/deployments` payload to per-project failure counts.
 *
 * `deployments` is the raw `.deployments` array. Only deployments created
 * inside `windowHours` of `now` are counted, so a project that failed
 * repeatedly last week but is healthy today does not stay red forever.
 *
 * Returns null when `deployments` is null (fetch failed) — NOT an empty
 * summary, because "no failures" and "we never asked" must not look alike.
 */
export function summarizeVercelDeployments(deployments, { now, windowHours = 24 } = {}) {
  if (!Array.isArray(deployments)) return null;
  const cutoff = Date.parse(now) - windowHours * MS_PER_HOUR;
  const byProject = new Map();

  for (const d of deployments) {
    const created = typeof d.createdAt === 'number' ? d.createdAt : Date.parse(d.created ?? '');
    if (!Number.isFinite(created) || created < cutoff) continue;
    const name = d.name ?? d.projectId ?? 'unknown';
    const entry = byProject.get(name) ?? {
      project: name,
      total: 0,
      errors: 0,
      productionErrors: 0,
      firstFailureAt: null,
      lastFailureAt: null,
    };
    entry.total += 1;
    const state = d.readyState ?? d.state;
    if (state === 'ERROR') {
      entry.errors += 1;
      if (d.target === 'production') entry.productionErrors += 1;
      const iso = new Date(created).toISOString();
      if (entry.firstFailureAt === null || iso < entry.firstFailureAt) entry.firstFailureAt = iso;
      if (entry.lastFailureAt === null || iso > entry.lastFailureAt) entry.lastFailureAt = iso;
    }
    byProject.set(name, entry);
  }

  const projects = [...byProject.values()]
    .filter((p) => p.errors > 0)
    .sort((a, b) => b.errors - a.errors || a.project.localeCompare(b.project));

  return {
    windowHours,
    projects,
    totalErrors: projects.reduce((sum, p) => sum + p.errors, 0),
    productionErrors: projects.reduce((sum, p) => sum + p.productionErrors, 0),
  };
}

/**
 * Reduce Vercel `GET /v1/billing/charges` (FOCUS v1.3 JSONL, already parsed
 * into an array of records) to a billed total per product.
 *
 * FOCUS names the payable figure `BilledCost` and the list-price figure
 * `ListCost`; we report both so "using a lot but still inside the plan" is
 * distinguishable from "actually being charged".
 */
export function summarizeVercelSpend(charges, { includedAllowanceUsd = null } = {}) {
  if (!Array.isArray(charges)) return null;
  const byProduct = new Map();
  let billed = 0;
  let list = 0;

  for (const c of charges) {
    const billedCost = Number(c.BilledCost ?? c.billedCost ?? 0);
    const listCost = Number(c.ListCost ?? c.listCost ?? billedCost);
    const product = c.ServiceName ?? c.serviceName ?? c.ChargeDescription ?? 'other';
    if (!Number.isFinite(billedCost)) continue;
    billed += billedCost;
    list += Number.isFinite(listCost) ? listCost : 0;
    byProduct.set(product, (byProduct.get(product) ?? 0) + billedCost);
  }

  const fractionOfAllowance =
    includedAllowanceUsd && includedAllowanceUsd > 0 ? list / includedAllowanceUsd : null;

  return {
    currency: charges[0]?.BillingCurrency ?? charges[0]?.billingCurrency ?? 'USD',
    billedUsd: round2(billed),
    listUsd: round2(list),
    onDemandUsd: round2(billed),
    includedAllowanceUsd,
    fractionOfAllowance: fractionOfAllowance === null ? null : round2(fractionOfAllowance),
    byProduct: [...byProduct.entries()]
      .map(([product, usd]) => ({ product, usd: round2(usd) }))
      .sort((a, b) => b.usd - a.usd),
  };
}

/**
 * Reduce a Supabase `GET /v1/projects/{ref}/advisors/security` payload
 * (`.lints`) to counts by level plus the worst few, named.
 */
export function summarizeSupabaseAdvisors(lints) {
  if (!Array.isArray(lints)) return null;
  const counts = { ERROR: 0, WARN: 0, INFO: 0 };
  for (const lint of lints) {
    const level = lint.level ?? 'INFO';
    if (level in counts) counts[level] += 1;
  }
  const order = { ERROR: 0, WARN: 1, INFO: 2 };
  const top = [...lints]
    .sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3))
    .slice(0, 3)
    .map((l) => ({ name: l.name, title: l.title, level: l.level }));
  return { counts, total: lints.length, top };
}

/**
 * Reduce a Supabase `GET /v1/projects/{ref}/health` payload (an array of
 * service health objects) to the list of services that are not ACTIVE_HEALTHY.
 *
 * Reads `status`, not the deprecated `healthy` boolean.
 */
export function summarizeSupabaseHealth(services) {
  if (!Array.isArray(services)) return null;
  const unhealthy = services
    .filter((s) => s.status !== 'ACTIVE_HEALTHY')
    .map((s) => ({ name: s.name, status: s.status ?? 'UNKNOWN' }));
  return { checked: services.length, unhealthy, allHealthy: unhealthy.length === 0 };
}

/**
 * Reduce GitHub's enhanced-billing usage payload
 * (`GET /organizations/{org}/settings/billing/usage` → `.usageItems`) to
 * Actions minutes and dollars for the current billing month.
 *
 * `netAmount > 0` is the signal that matters: gross minus the included-plan
 * discount. While the org is inside its allowance every item nets zero, so
 * any non-zero net is real money and worth the brief's attention.
 */
export function summarizeGithubActionsUsage(usageItems, { repo = null } = {}) {
  if (!Array.isArray(usageItems)) return null;
  let minutes = 0;
  let gross = 0;
  let net = 0;
  const byRepo = new Map();

  for (const item of usageItems) {
    if (item.product !== 'actions') continue;
    if (repo && item.repositoryName !== repo) continue;
    const q = Number(item.quantity ?? 0);
    const g = Number(item.grossAmount ?? 0);
    const n = Number(item.netAmount ?? 0);
    if (item.unitType === 'Minutes' && Number.isFinite(q)) minutes += q;
    if (Number.isFinite(g)) gross += g;
    if (Number.isFinite(n)) net += n;
    const name = item.repositoryName ?? 'unknown';
    const entry = byRepo.get(name) ?? { repo: name, minutes: 0, netUsd: 0 };
    if (item.unitType === 'Minutes' && Number.isFinite(q)) entry.minutes += q;
    if (Number.isFinite(n)) entry.netUsd += n;
    byRepo.set(name, entry);
  }

  return {
    minutes: Math.round(minutes),
    grossUsd: round2(gross),
    netUsd: round2(net),
    payingOverage: round2(net) > 0,
    byRepo: [...byRepo.values()]
      .map((r) => ({ ...r, minutes: Math.round(r.minutes), netUsd: round2(r.netUsd) }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}

/**
 * Reduce `GET /repos/{repo}/actions/runs` to failure counts per workflow
 * inside the window. `cancelled` is deliberately NOT counted: ci.yml cancels
 * superseded PR runs on purpose (see its `concurrency` block), so counting
 * them would report the cost control as a fault.
 */
export function summarizeWorkflowFailures(runs, { now, windowHours = 24 } = {}) {
  if (!Array.isArray(runs)) return null;
  const cutoff = Date.parse(now) - windowHours * MS_PER_HOUR;
  const byWorkflow = new Map();
  let total = 0;

  for (const run of runs) {
    const created = Date.parse(run.created_at ?? '');
    if (!Number.isFinite(created) || created < cutoff) continue;
    if (run.conclusion !== 'failure') continue;
    const name = run.name ?? 'unknown';
    byWorkflow.set(name, (byWorkflow.get(name) ?? 0) + 1);
    total += 1;
  }

  return {
    windowHours,
    total,
    workflows: [...byWorkflow.entries()]
      .map(([workflow, failures]) => ({ workflow, failures }))
      .sort((a, b) => b.failures - a.failures || a.workflow.localeCompare(b.workflow)),
  };
}

/**
 * Reduce `GET /repos/{repo}/dependabot/alerts?state=open` to severity counts,
 * splitting out the high/critical alerts that have been open past the grace
 * period — those are the ones the weekly Dependabot lane has demonstrably
 * failed to close on its own.
 */
export function summarizeDependabot(alerts, { now } = {}) {
  if (!Array.isArray(alerts)) return null;
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  const stale = [];

  for (const alert of alerts) {
    const severity = alert.security_advisory?.severity ?? 'low';
    if (severity in counts) counts[severity] += 1;
    if (!DEPENDABOT_RED_SEVERITIES.includes(severity)) continue;
    const ageHours = now ? hoursBetween(now, alert.created_at ?? '') : null;
    if (ageHours !== null && ageHours > DEPENDABOT_GRACE_DAYS * 24) {
      stale.push({
        package: alert.dependency?.package?.name ?? 'unknown',
        severity,
        ageDays: Math.floor(ageHours / 24),
      });
    }
  }

  return { counts, total: alerts.length, stale };
}

/**
 * The punchline. Collapses every section into one verdict and one sentence.
 *
 * Precedence: red beats amber beats green. A source in `unknown` can never
 * produce green — the brief says "cannot confirm", which is the honest
 * answer and the thing that gets a missing token noticed.
 */
export function rollUp(snapshot) {
  const reds = [];
  const ambers = [];
  const unknown = [];

  const { vercel, supabase, github } = snapshot;

  if (!vercel || (!vercel.deployments && !vercel.spend)) unknown.push('Vercel');
  if (vercel?.deployments) {
    const d = vercel.deployments;
    if (d.productionErrors > 0) {
      reds.push(`${d.productionErrors} failed production deploy(s) on Vercel`);
    }
    for (const p of d.projects) {
      if (p.productionErrors > 0) continue;
      if (p.errors >= VERCEL_PREVIEW_FAILURE_RED) {
        reds.push(`${p.project}: ${p.errors} failed previews in ${d.windowHours}h`);
      } else if (p.errors > 0) {
        ambers.push(`${p.project}: ${p.errors} failed preview(s)`);
      }
    }
  }
  if (vercel?.spend) {
    const s = vercel.spend;
    if (s.onDemandUsd > 0) ambers.push(`Vercel on-demand $${s.onDemandUsd.toFixed(2)} this cycle`);
    if (s.fractionOfAllowance !== null && s.fractionOfAllowance >= SPEND_AMBER_FRACTION) {
      ambers.push(
        `Vercel usage at ${Math.round(s.fractionOfAllowance * 100)}% of the included plan`,
      );
    }
  }

  if (!supabase || (!supabase.advisors && !supabase.health)) unknown.push('Supabase');
  if (supabase?.advisors) {
    const errors = supabase.advisors.counts.ERROR;
    const warns = supabase.advisors.counts.WARN;
    if (errors > 0) reds.push(`${errors} Supabase security advisor ERROR(s)`);
    else if (warns > 0) ambers.push(`${warns} Supabase security warning(s)`);
  }
  if (supabase?.health && !supabase.health.allHealthy) {
    reds.push(`Supabase services down: ${supabase.health.unhealthy.map((s) => s.name).join(', ')}`);
  }

  if (!github) unknown.push('GitHub');
  if (github?.actions?.payingOverage) {
    ambers.push(
      `GitHub Actions billing $${github.actions.netUsd.toFixed(2)} over the included plan`,
    );
  }
  if (github?.workflows && github.workflows.total > 0) {
    ambers.push(
      `${github.workflows.total} workflow failure(s) in ${github.workflows.windowHours}h`,
    );
  }
  if (github?.dependabot?.stale?.length) {
    reds.push(
      `${github.dependabot.stale.length} high/critical Dependabot alert(s) open >${DEPENDABOT_GRACE_DAYS}d`,
    );
  } else if (github?.dependabot && github.dependabot.total > 0) {
    ambers.push(`${github.dependabot.total} open Dependabot alert(s)`);
  }

  let status;
  if (reds.length > 0) status = 'red';
  else if (ambers.length > 0 || unknown.length > 0) status = 'amber';
  else status = 'green';

  let headline;
  if (reds.length > 0) headline = reds[0];
  else if (ambers.length > 0) headline = ambers[0];
  else if (unknown.length > 0) headline = `cannot confirm — no data from ${unknown.join(', ')}`;
  else headline = 'all green';

  return { status, headline, reds, ambers, unknown };
}

const EMOJI = { red: '🔴', amber: '🟡', green: '🟢' };

/**
 * Render the maintenance section as markdown lines, punchline first.
 *
 * Marjorie's runner prompt copies this output verbatim — she must never
 * re-derive these numbers from prose. Same contract as the Growth line
 * (docs/agents/runner-prompts/marjorie-brief.md step 3).
 */
export function formatMaintenanceSection(snapshot) {
  const v = snapshot.verdict ?? rollUp(snapshot);
  const lines = [`${EMOJI[v.status]} **Maintenance** — ${v.headline}`];

  const detail = [...v.reds, ...v.ambers];
  for (const item of detail.slice(0, 3)) {
    if (item === v.headline) continue;
    lines.push(`  - ${item}`);
  }
  if (v.unknown.length > 0) {
    lines.push(`  - Not checked (missing token): ${v.unknown.join(', ')}`);
  }
  return lines;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

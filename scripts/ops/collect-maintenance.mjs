#!/usr/bin/env node
// Maintenance snapshot collector — the deterministic, zero-LLM feed for the
// Founders' Brief's maintenance section (spec:
// docs/specs/2026-08-11-notification-noise-and-maintenance-section.md).
//
// WHY THIS EXISTS: the founder was getting ~30 vendor emails a day and the
// three that actually mattered — a Supabase security advisory (2026-08-04),
// a Vercel on-demand usage increase (2026-08-09), and repeated foray-web
// preview failures — went unread inside the noise. Silencing the noise is
// only half the fix; the other half is that the surviving signal has to
// arrive somewhere the founder already reads. This script produces that
// signal as data, once a day, so the brief can state it rather than an
// agent inferring it.
//
// CONTRACT (matches scripts/social/growth-snapshot.mjs, the collector
// precedent):
//   - Writes ops/metrics/YYYY-MM-DD.json. Prints nothing else to stdout.
//   - `--print` instead writes the rendered markdown section to stdout, for
//     a human or a runner prompt that just wants the lines.
//   - Every remote fetch is independently try/caught and yields `null` on
//     failure or on a missing token. It NEVER throws, NEVER retries, and
//     NEVER fabricates a zero. A source that yielded null is named in
//     `verdict.unknown` and the overall verdict cannot be green.
//   - Read-only. This script has no write scope against any vendor API and
//     must never acquire one.
//
// TOKENS (all optional; each missing one degrades exactly one source):
//   VERCEL_TOKEN        read-only Vercel access token   → deploy failures + spend
//   VERCEL_TEAM_ID      Vercel team/scope id            → required with VERCEL_TOKEN on a team account
//   SUPABASE_ACCESS_TOKEN  Supabase personal access token → advisors + service health
//   SUPABASE_PROJECT_REF   the project ref (from the dashboard URL)
//   GH_TOKEN / GITHUB_TOKEN  GitHub token                → Actions billing, workflow failures, Dependabot
//
// Run it by hand with nothing set and it will write a snapshot that honestly
// says "cannot confirm — no data from Vercel, Supabase, GitHub". That is the
// designed degraded state, not a failure.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatMaintenanceSection,
  rollUp,
  summarizeDependabot,
  summarizeGithubActionsUsage,
  summarizeSupabaseAdvisors,
  summarizeSupabaseHealth,
  summarizeVercelDeployments,
  summarizeVercelSpend,
  summarizeWorkflowFailures,
} from './lib/maintenance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const METRICS_DIR = path.join(ROOT, 'ops', 'metrics');

const WINDOW_HOURS = 24;
const REPO = process.env.GITHUB_REPOSITORY ?? 'JW-Incorporated/swift2';
const ORG = REPO.split('/')[0];
const FETCH_TIMEOUT_MS = 20_000;

/**
 * One fetch, one failure mode. Any non-2xx, timeout, or parse error is logged
 * to stderr (so an Action run shows what broke) and returns null.
 */
async function getJson(url, headers, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return JSON.parse(text);
  } catch (err) {
    console.error(`collect-maintenance: ${label} failed: ${err.message ?? err}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Newline-delimited JSON, as Vercel's /v1/billing/charges streams it. */
async function getJsonLines(url, headers, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (err) {
    console.error(`collect-maintenance: ${label} failed: ${err.message ?? err}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function collectVercel(now) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}` };
  const team = process.env.VERCEL_TEAM_ID
    ? `&teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
    : '';
  const since = Date.parse(now) - WINDOW_HOURS * 3_600_000;

  // GET /v7/deployments — `since` is a JS timestamp; `limit` caps the page.
  // We ask for everything in the window across all projects rather than
  // per-project, so a project nobody remembered to add still gets reported.
  const deploymentsBody = await getJson(
    `https://api.vercel.com/v7/deployments?since=${since}&limit=100${team}`,
    headers,
    'Vercel deployments',
  );

  // GET /v1/billing/charges — FOCUS v1.3, JSONL, 1-day granularity.
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const charges = await getJsonLines(
    `https://api.vercel.com/v1/billing/charges?from=${monthStart.toISOString()}&to=${new Date(now).toISOString()}${team}`,
    headers,
    'Vercel billing charges',
  );

  const allowance = process.env.VERCEL_INCLUDED_ALLOWANCE_USD
    ? Number(process.env.VERCEL_INCLUDED_ALLOWANCE_USD)
    : null;

  return {
    deployments: summarizeVercelDeployments(deploymentsBody?.deployments ?? null, {
      now,
      windowHours: WINDOW_HOURS,
    }),
    spend: summarizeVercelSpend(charges, { includedAllowanceUsd: allowance }),
  };
}

async function collectSupabase() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!token || !ref) return null;
  const headers = { Authorization: `Bearer ${token}` };

  // NOTE: the advisors endpoint is flagged **experimental** in Supabase's own
  // OpenAPI spec (and carries a `deprecated: true` marker with no replacement
  // path in the 115-path spec as of 2026-08-11). It is the only programmatic
  // route to the advisory that went unread on 2026-08-04, so it is worth
  // using — but it is the single most likely thing here to start returning
  // null one day, which is exactly why null degrades gracefully.
  const advisors = await getJson(
    `https://api.supabase.com/v1/projects/${encodeURIComponent(ref)}/advisors/security`,
    headers,
    'Supabase security advisors',
  );

  const services = 'auth,db,pooler,realtime,rest,storage';
  const health = await getJson(
    `https://api.supabase.com/v1/projects/${encodeURIComponent(ref)}/health?services=${services}`,
    headers,
    'Supabase service health',
  );

  return {
    advisors: summarizeSupabaseAdvisors(advisors?.lints ?? null),
    health: summarizeSupabaseHealth(health),
  };
}

async function collectGithub(now) {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) return null;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const d = new Date(now);
  // GET /organizations/{org}/settings/billing/usage — the enhanced billing
  // platform endpoint. The OLD /orgs/{org}/settings/billing/actions endpoint
  // (the one that needed `admin:org`) now returns HTTP 410 Gone; this
  // replacement is readable with the plain `repo` + `read:org` scopes the
  // existing tokens already carry. Verified against the live org 2026-08-11.
  const usage = await getJson(
    `https://api.github.com/organizations/${encodeURIComponent(ORG)}/settings/billing/usage?year=${d.getUTCFullYear()}&month=${d.getUTCMonth() + 1}`,
    headers,
    'GitHub billing usage',
  );

  // `status=failure` is load-bearing, not an optimisation. This repo produces
  // ~150 workflow runs a day, so an UNFILTERED first page of 100 spans about
  // 100 minutes (measured 2026-08-11: oldest 16:38Z, newest 18:19Z) and would
  // silently under-report a 24h window by an order of magnitude. Filtered to
  // failures, the same page reaches back 11 days. The summariser still
  // re-checks `conclusion` and the window itself, so this stays correct even
  // if the filter's semantics change.
  const runs = await getJson(
    `https://api.github.com/repos/${REPO}/actions/runs?status=failure&per_page=100`,
    headers,
    'GitHub workflow runs',
  );

  // Dependabot alerts need `security_events` (or `repo` on a classic token).
  const alerts = await getJson(
    `https://api.github.com/repos/${REPO}/dependabot/alerts?state=open&per_page=100`,
    headers,
    'GitHub Dependabot alerts',
  );

  return {
    actions: summarizeGithubActionsUsage(usage?.usageItems ?? null),
    workflows: summarizeWorkflowFailures(runs?.workflow_runs ?? null, {
      now,
      windowHours: WINDOW_HOURS,
    }),
    dependabot: summarizeDependabot(alerts, { now }),
  };
}

async function main() {
  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  const [vercel, supabase, github] = await Promise.all([
    collectVercel(now),
    collectSupabase(),
    collectGithub(now),
  ]);

  const snapshot = { date, generatedAt: now, windowHours: WINDOW_HOURS, vercel, supabase, github };
  snapshot.verdict = rollUp(snapshot);

  if (process.argv.includes('--print')) {
    console.log(formatMaintenanceSection(snapshot).join('\n'));
    return;
  }

  await mkdir(METRICS_DIR, { recursive: true });
  await writeFile(path.join(METRICS_DIR, `${date}.json`), JSON.stringify(snapshot, null, 2) + '\n');
  console.error(
    `collect-maintenance: wrote ops/metrics/${date}.json — ${snapshot.verdict.status}: ${snapshot.verdict.headline}`,
  );
}

main();

// A plain, read-only first job; workflow concurrency encloses guard and delivery.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ghJson } from './clock-watch.mjs';

const MARKER = /<!--\s*discord-message-id:\s*\d+\s*-->/;
const day = (time) => new Date(time).toISOString().slice(0, 10);

export function briefDecision({ ref, event, force = false, attempt = 1, current, runs = [], delivered = false }) {
  if (ref !== 'refs/heads/main' || !['schedule', 'workflow_dispatch'].includes(event)) return { proceed: false, reason: 'main-only' };
  if (attempt !== 1) return { proceed: false, reason: 'rerun' };
  if (event === 'workflow_dispatch' && force === true) return { proceed: true, reason: 'forced' };
  if (!current || !/^\d+$/.test(String(current.id)) || !Number.isFinite(Date.parse(current.created_at))) return { proceed: false, reason: 'unreadable-current' };
  if (delivered) return { proceed: false, reason: 'already-delivered' };
  const at = Date.parse(current.created_at);
  const prior = runs.some((r) => r.head_branch === 'main' && ['schedule', 'workflow_dispatch'].includes(r.event) &&
    Number.isFinite(Date.parse(r.created_at)) && /^\d+$/.test(String(r.id)) && day(r.created_at) === day(at) &&
    (Date.parse(r.created_at) < at || (Date.parse(r.created_at) === at && BigInt(r.id) < BigInt(current.id))));
  return { proceed: !prior, reason: prior ? 'earlier-run' : 'first-run' };
}

function pages(execImpl, endpoint) {
  const out = [];
  for (let page = 1; page <= 20; page += 1) {
    const rows = ghJson(execImpl, `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    if (!Array.isArray(rows)) throw new Error('unreadable');
    out.push(...rows);
    if (rows.length < 100) return out;
  }
  throw new Error('page cap');
}

export function guard({ env = process.env, execImpl = execFileSync, log = console.log } = {}) {
  const basic = { ref: env.GITHUB_REF, event: env.GITHUB_EVENT_NAME, force: env.FORCE === 'true', attempt: Number(env.GITHUB_RUN_ATTEMPT || '1') };
  const emit = (result, code = 0) => {
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `proceed=${result.proceed}\n`);
    log(`brief guard: ${result.reason}`);
    return code;
  };
  const early = briefDecision(basic);
  if (['main-only', 'forced', 'rerun'].includes(early.reason)) return emit(early);
  try {
    const repo = env.GITHUB_REPOSITORY;
    const id = env.GITHUB_RUN_ID;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '') || !/^\d+$/.test(id || '')) throw new Error('input');
    const current = ghJson(execImpl, `repos/${repo}/actions/runs/${id}`);
    if (String(current.id) !== id || current.head_branch !== 'main' || current.event !== basic.event || !Number.isFinite(Date.parse(current.created_at))) throw new Error('current');
    const today = day(current.created_at);
    const created = encodeURIComponent(`${today}T00:00:00Z..${today}T23:59:59Z`);
    const allRuns = [];
    let complete = false;
    for (let page = 1; page <= 10; page += 1) {
      const data = ghJson(execImpl, `repos/${repo}/actions/workflows/routine-marjorie-brief.yml/runs?branch=main&created=${created}&per_page=100&page=${page}`);
      if (!Array.isArray(data.workflow_runs) || !Number.isInteger(data.total_count)) throw new Error('runs');
      allRuns.push(...data.workflow_runs);
      if (allRuns.length === data.total_count) { complete = true; break; }
      if (data.workflow_runs.length < 100 || allRuns.length > data.total_count) throw new Error('incomplete');
    }
    if (!complete || !allRuns.some((r) => String(r.id) === id) || allRuns.some((r) => !r || !/^\d+$/.test(String(r.id)) || !Number.isFinite(Date.parse(r.created_at)) || typeof r.head_branch !== 'string' || typeof r.event !== 'string')) throw new Error('incomplete');
    const decision = briefDecision({ ...basic, current, runs: allRuns });
    if (!decision.proceed) return emit(decision);
    // Producer dates titles in LA; creation day also catches UTC-day copies.
    const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(current.created_at));
    const issues = pages(execImpl, `repos/${repo}/issues?state=all&labels=founders-brief&since=${encodeURIComponent(`${today}T00:00:00Z`)}`);
    for (const issue of issues) {
      if (issue.pull_request) continue;
      if (!Number.isFinite(Date.parse(issue.created_at)) || !Number.isInteger(issue.number)) throw new Error('issue');
      if (day(issue.created_at) !== today && issue.title !== `Founders' Brief — ${localDate}`) continue;
      if (MARKER.test(issue.body || '')) return emit({ proceed: false, reason: 'already-delivered' });
      const comments = pages(execImpl, `repos/${repo}/issues/${issue.number}/comments`);
      if (comments.some((c) => typeof c.body !== 'string')) throw new Error('comments');
      if (comments.some((c) => MARKER.test(c.body))) return emit({ proceed: false, reason: 'already-delivered' });
    }
    return emit(decision);
  } catch {
    return emit({ proceed: false, reason: 'unreadable-history' }, 1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = guard();

// Daily site-usage cache for the status page (lib/status-traffic.mjs). The one
// step in marjorie-status.yml that holds VERCEL_TOKEN: it asks Vercel Web
// Analytics for the last 7 days (and the 7 before), compacts the answer and
// writes it into the status issue's hidden `status-traffic` marker. Skips when
// the cache is under 20h old, so the hourly workflow costs one API read a day.
// Soft by design: no token, no issue, or a failed call logs one line and exits 0
// — the page keeps showing the previous numbers (dated), never an estimate.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { fetchTraffic } from './lib/growth-traffic.mjs';
import { findStatusIssue, updateBody } from './lib/status-issue.mjs';
import { compactTraffic, readTraffic, replaceTraffic, trafficStale } from './lib/status-traffic.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEEK_MS = 7 * 86_400_000;

export async function main({
  env = process.env, api = ghApi, gh = ghRun, now = Date.now(), log = console.log, fetchImpl = fetch, root = ROOT,
} = {}) {
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  const issue = await findStatusIssue(api, repo);
  if (!issue) {
    log('status traffic: no status-page issue yet; nothing to cache into');
    return 0;
  }
  const cached = readTraffic(issue.body);
  if (!trafficStale(cached, now)) {
    log(`status traffic: cache from ${cached.at} is fresh; not calling Vercel`);
    return 0;
  }
  let cfg = {};
  try { cfg = JSON.parse(readFileSync(path.join(root, 'scripts', 'marjorie', 'marjorie-config.json'), 'utf8')).traffic ?? {}; } catch { /* env may carry it */ }
  const { traffic, trafficNote } = await fetchTraffic({
    token: env.VERCEL_TOKEN, projectId: env.VERCEL_PROJECT_ID || cfg.projectId, teamId: env.VERCEL_TEAM_ID || cfg.teamId,
    win: { startMs: now - WEEK_MS, endMs: now }, fetchImpl,
  });
  const compact = traffic && compactTraffic(traffic, now);
  if (!compact) {
    log(`status traffic: ${trafficNote}${cached ? ' (keeping the previous numbers)' : ''}`);
    return 0;
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = (await findStatusIssue(api, repo)) || issue;
    await updateBody({ gh, repo, number: current.number, body: replaceTraffic(current.body, compact) });
    const check = await findStatusIssue(api, repo);
    if (readTraffic(check?.body)?.at === compact.at) {
      log(`status traffic: cached ${compact.v} visitors / ${compact.pv} pageviews on #${current.number}`);
      return 0;
    }
  }
  log('status traffic: the cache did not stick (a concurrent render overwrote it); the next run retries');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-traffic' });
}

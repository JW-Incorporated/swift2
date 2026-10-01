// Read-only data gathering for the status page (Bots v2 W4). GitHub reads go
// through an injected `api(path)` (scripts/lib/gh.mjs `ghApi` in production);
// files come from the checked-out repo. Every source fails soft into a named
// warning so one bad endpoint never blanks the page.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { listIssuesByLabels } from './issues-rest.mjs';
import { toPr, SHIPPED_WINDOW_DAYS } from './status-shipped.mjs';

const DAY_MS = 86_400_000;
const MAX_PAGES = 5;

export async function fetchMergedPrs(api, repo, now) {
  const cutoff = now - SHIPPED_WINDOW_DAYS * DAY_MS;
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const rows = (await api(`/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`)) || [];
    out.push(...rows.filter((r) => r.merged_at).map(toPr));
    const last = rows.at(-1);
    if (rows.length < 100 || Date.parse(last?.updated_at) < cutoff) break;
  }
  return out;
}

export async function fetchOpenPrs(api, repo) {
  const out = [];
  for (let page = 1; page <= 3; page += 1) {
    const rows = (await api(`/repos/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=100&page=${page}`)) || [];
    out.push(...rows.map(toPr));
    if (rows.length < 100) break;
  }
  return out;
}

export async function fetchPlan(api, repo) {
  const [plan] = await listIssuesByLabels(api, { repo, labels: ['weekly-plan'], state: 'open', limit: 1 });
  return plan ? { number: plan.number, title: plan.title, url: plan.url, body: plan.body } : null;
}

const DATE_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;

/** Newest snapshot, and the one nearest to (and not after) seven days earlier, else the oldest other one. */
export function readMetrics(root) {
  const dir = path.join(root, 'social', 'metrics');
  const dates = readdirSync(dir).map((f) => DATE_FILE.exec(f)?.[1]).filter(Boolean).sort();
  if (!dates.length) return { latest: null, prior: null };
  const read = (d) => JSON.parse(readFileSync(path.join(dir, `${d}.json`), 'utf8'));
  const latestDate = dates.at(-1);
  const target = new Date(Date.parse(`${latestDate}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10);
  const onOrBefore = dates.filter((d) => d <= target).at(-1);
  const priorDate = onOrBefore || dates.find((d) => d !== latestDate);
  return { latest: read(latestDate), prior: priorDate ? read(priorDate) : null };
}

/** Posts the poster recorded as published in the window, newest first. */
export function readPosted(root, now) {
  const dir = path.join(root, 'social', 'posted');
  const cutoff = now - SHIPPED_WINDOW_DAYS * DAY_MS;
  const rows = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json') || file.startsWith('pipeline-test')) continue;
    try {
      const row = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
      const at = Date.parse(row.postedAt);
      if (Number.isFinite(at) && at >= cutoff && at <= now) rows.push({ platform: row.platform, postedAt: row.postedAt, url: row.url || '' });
    } catch { /* an unreadable file is not a post */ }
  }
  return rows.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
}

/** Everything the renderer needs. `existingBody` is the current status issue body (for the preserved note). */
export async function gatherStatusData({ api, repo, root, now, existingBody = '', readPreserved }) {
  const warnings = [];
  const soft = async (name, fn, fallback) => {
    try { return await fn(); } catch { warnings.push(name); return fallback; }
  };
  const [mergedPrs, openPrs, plan] = await Promise.all([
    soft('merged PRs', () => fetchMergedPrs(api, repo, now), []),
    soft('open PRs', () => fetchOpenPrs(api, repo), []),
    soft('weekly plan', () => fetchPlan(api, repo), null),
  ]);
  const haMarkdown = await soft('HUMAN-ACTIONS.md', async () => readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8'), '');
  const { latest, prior } = await soft('growth metrics', async () => readMetrics(root), { latest: null, prior: null });
  const posted = await soft('published posts', async () => readPosted(root, now), []);
  const preserved = readPreserved(existingBody);
  return {
    haMarkdown, mergedPrs, openPrs, plan, posted, metricsLatest: latest, metricsPrior: prior,
    draftPrs: openPrs.filter((pr) => pr.labels.includes('social-draft')),
    note: preserved.note, ping: preserved.ping, warnings,
  };
}

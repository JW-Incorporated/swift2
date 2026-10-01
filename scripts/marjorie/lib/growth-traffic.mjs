// Site traffic for the weekly growth collector (W5), from Vercel's documented
// Web Analytics REST API (https://vercel.com/docs/analytics/web-analytics-api):
//   GET /v1/query/web-analytics/visits/count      → { data: { pageviews, visitors } }
//   GET /v1/query/web-analytics/visits/aggregate  → { data: [{ <dim>, pageviews, visitors }] }
// Read-only; production data only (the count endpoint's own scope). The token
// comes from the environment (VERCEL_TOKEN) and is never logged, echoed in an
// error, or written into the output. Any failure — no token, no project, HTTP
// error, an unexpected shape — returns `traffic: null` with a reason; a number
// is never estimated.
const API = 'https://api.vercel.com/v1/query/web-analytics/visits';
const TOP = 10;

export const NO_TOKEN_NOTE =
  'Traffic not collected: VERCEL_TOKEN is not set in this environment (the weekly-review workflow\'s collect job sets it; a local run does not).';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function call(kind, params, { token, teamId, fetchImpl }) {
  const url = new URL(`${API}/${kind}`);
  for (const [k, v] of Object.entries({ ...params, ...(teamId ? { teamId } : {}) })) url.searchParams.set(k, String(v));
  const res = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from the Vercel Web Analytics API (${kind})`);
  const body = await res.json();
  if (!body || body.data === undefined) throw new Error(`unexpected response shape from ${kind}`);
  return body.data;
}

async function totals(range, ctx) {
  const d = await call('count', { projectId: ctx.projectId, ...range }, ctx);
  const pageviews = num(d?.pageviews);
  const visitors = num(d?.visitors);
  if (pageviews === null || visitors === null) throw new Error('count response lacked pageviews/visitors');
  return { visitors, pageviews };
}

async function top(dimension, key, range, ctx) {
  const rows = await call('aggregate', { projectId: ctx.projectId, by: dimension, limit: TOP, ...range }, ctx);
  if (!Array.isArray(rows)) throw new Error(`aggregate by ${dimension} was not a list`);
  return rows
    .filter((r) => r && typeof r[dimension] === 'string' && r[dimension] !== 'Others')
    .map((r) => ({ [key]: r[dimension] || '(direct)', pageviews: num(r.pageviews) ?? 0, visitors: num(r.visitors) ?? 0 }))
    .sort((a, b) => b.pageviews - a.pageviews);
}

/**
 * `win` = { startMs, endMs } of the review week. Returns
 * `{ traffic, trafficNote }` — `traffic` is `{ source, visitors, pageviews,
 * topPaths, topReferrers, previousWeek: { visitors, pageviews } }` or `null`.
 */
export async function fetchTraffic({ token, projectId, teamId, win, fetchImpl = fetch }) {
  if (!token) return { traffic: null, trafficNote: NO_TOKEN_NOTE };
  if (!projectId) return { traffic: null, trafficNote: 'Traffic not collected: no Vercel projectId configured (scripts/marjorie/marjorie-config.json → traffic.projectId).' };
  const ctx = { token, projectId, teamId, fetchImpl };
  const week = { since: win.startMs, until: win.endMs };
  const prior = { since: win.startMs - (win.endMs - win.startMs), until: win.startMs };
  try {
    const [now, before, topPaths, topReferrers] = await Promise.all([
      totals(week, ctx), totals(prior, ctx), top('requestPath', 'path', week, ctx), top('referrerHostname', 'referrer', week, ctx),
    ]);
    return {
      traffic: { source: 'vercel-web-analytics', ...now, topPaths, topReferrers, previousWeek: before },
      trafficNote: 'Vercel Web Analytics (production). Visitors are unique per range, so they do not sum across rows or weeks.',
    };
  } catch (err) {
    return { traffic: null, trafficNote: `Traffic not collected: ${String(err?.message ?? err).replaceAll(token, '[token]').slice(0, 160)}` };
  }
}

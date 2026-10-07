// Site usage on the status page's Growth section (owner, 2026-10-01): 7-day
// visitors and pageviews against the week before, top 5 pages, top 5 referrers,
// from Vercel Web Analytics (growth-traffic.mjs). The numbers are collected at
// most once a day by a single workflow step that holds VERCEL_TOKEN, and cached
// in the status issue body as a hidden `<!-- status-traffic {...} -->` marker,
// so the hourly renders never touch the API (or the token) and just re-read it.
// A missing token or a failed call leaves the old cache in place; a number is
// never estimated.
export const TRAFFIC_STALE_MS = 20 * 60 * 60 * 1000;
const MARKER = /<!-- status-traffic (\{[^\n]*?\}) --!?>/;
const TOP = 5;
const LABEL_CAP = 44;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);

/** Public-input strings (paths, referrer hostnames): no markup, mentions or links. */
const label = (s) => {
  const flat = String(s ?? '').replace(/[[\]`<>|*_~]/g, '').replace(/(^|\s)@(?!\u200b)/g, '$1@​').replace(/\s+/g, ' ').trim() || '(direct)';
  return flat.length > LABEL_CAP ? `${flat.slice(0, LABEL_CAP - 1)}…` : flat;
};
const top = (rows, key) => (Array.isArray(rows) ? rows : []).slice(0, TOP)
  .map((r) => ({ l: label(r?.[key]), v: num(r?.pageviews) ?? 0 })).filter((r) => r.l);

/** The compact, cacheable shape of fetchTraffic()'s `traffic`. */
export function compactTraffic(traffic, atMs) {
  const v = num(traffic?.visitors);
  const pv = num(traffic?.pageviews);
  if (v === null || pv === null) return null;
  return {
    at: new Date(atMs).toISOString(), v, pv,
    v0: num(traffic.previousWeek?.visitors), pv0: num(traffic.previousWeek?.pageviews),
    paths: top(traffic.topPaths, 'path'), refs: top(traffic.topReferrers, 'referrer'),
  };
}

export function readTraffic(body) {
  const m = MARKER.exec(String(body || ''));
  if (!m) return null;
  try {
    const t = JSON.parse(m[1]);
    if (!t || !Number.isFinite(Date.parse(t.at)) || num(t.v) === null || num(t.pv) === null) return null;
    return {
      at: t.at, v: num(t.v), pv: num(t.pv), v0: num(t.v0), pv0: num(t.pv0),
      paths: top((t.paths || []).map((r) => ({ path: r?.l, pageviews: r?.v })), 'path'),
      refs: top((t.refs || []).map((r) => ({ referrer: r?.l, pageviews: r?.v })), 'referrer'),
    };
  } catch {
    return null;
  }
}

export const trafficStale = (t, now) => !t || now - Date.parse(t.at) > TRAFFIC_STALE_MS;

export const trafficMarker = (t) => `<!-- status-traffic ${JSON.stringify(t).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')} -->`;

/** Replaces the cached marker, or inserts it under the page's first line. Pure. */
export function replaceTraffic(body, t) {
  const src = String(body || '').replace(/\r\n/g, '\n');
  const marker = trafficMarker(t);
  if (MARKER.test(src)) return src.replace(MARKER, () => marker);
  const [first, ...rest] = src.split('\n');
  return [first, marker, ...rest].join('\n');
}

const pct = (now, before) => (before ? ` (${now >= before ? '+' : '-'}${Math.round((Math.abs(now - before) / before) * 100)}% vs prior week)` : '');
const list = (rows) => rows.map((r) => `${r.l} (${r.v})`).join(' · ');

/** Lines appended to the Growth section; [] when nothing is cached. */
export function renderTrafficLines(t) {
  if (!t) return [];
  const out = ['', `Site, last 7 days (as of ${t.at.slice(0, 10)}, Vercel Web Analytics)`,
    `- Visitors: **${t.v}**${t.v0 !== null ? pct(t.v, t.v0) : ''}`,
    `- Pageviews: **${t.pv}**${t.pv0 !== null ? pct(t.pv, t.pv0) : ''}`];
  if (t.paths.length) out.push(`- Top pages: ${list(t.paths)}`);
  if (t.refs.length) out.push(`- Top referrers: ${list(t.refs)}`);
  return out;
}

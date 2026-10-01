import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { TRAFFIC_STALE_MS, compactTraffic, readTraffic, renderTrafficLines, replaceTraffic, trafficMarker, trafficStale } from './status-traffic.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderGrowth } from './status-sections.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const raw = {
  visitors: 120, pageviews: 480, previousWeek: { visitors: 100, pageviews: 400 },
  topPaths: Array.from({ length: 8 }, (_, i) => ({ path: `/era/${i}`, pageviews: 50 - i, visitors: 10 })),
  topReferrers: [{ referrer: 'google.com', pageviews: 30 }, { referrer: '(direct)', pageviews: 20 }, { referrer: 'evil [x](http://a) @bob `c`', pageviews: 3 }],
};

describe('compactTraffic / readTraffic', () => {
  it('keeps totals, the prior week, and the top five of each list', () => {
    const t = compactTraffic(raw, NOW);
    expect(t).toMatchObject({ at: '2026-10-01T12:00:00.000Z', v: 120, pv: 480, v0: 100, pv0: 400 });
    expect(t.paths).toHaveLength(5);
    expect(t.refs).toHaveLength(3);
  });
  it('is null when the totals are not numbers: a number is never invented', () => {
    expect(compactTraffic({ ...raw, visitors: null }, NOW)).toBeNull();
    expect(compactTraffic(null, NOW)).toBeNull();
  });
  it('round-trips through the page body and rejects a mangled marker', () => {
    const t = compactTraffic(raw, NOW);
    expect(readTraffic(`x\n${trafficMarker(t)}\ny`)).toEqual(t);
    expect(readTraffic('<!-- status-traffic {"at":"nope","v":1,"pv":1} -->')).toBeNull();
    expect(readTraffic('<!-- status-traffic {broken} -->')).toBeNull();
    expect(readTraffic('')).toBeNull();
  });
  it('defangs public strings (referrers, paths) on the way back out', () => {
    const t = compactTraffic(raw, NOW);
    const lines = renderTrafficLines(readTraffic(trafficMarker(t))).join('\n');
    expect(lines).not.toMatch(/\]\(|`|@bob/);
    expect(lines).toContain('@​bob');
    expect(lines).toContain('google.com (30)');
  });
});

describe('the daily cache', () => {
  it('is stale after 20 hours, or when absent', () => {
    const t = compactTraffic(raw, NOW);
    expect(trafficStale(t, NOW + TRAFFIC_STALE_MS - 1)).toBe(false);
    expect(trafficStale(t, NOW + TRAFFIC_STALE_MS + 1)).toBe(true);
    expect(trafficStale(null, NOW)).toBe(true);
  });
  it('inserts the marker under the page\'s first line, then replaces it in place', () => {
    const t1 = compactTraffic(raw, NOW);
    const t2 = compactTraffic({ ...raw, visitors: 5 }, NOW + 1000);
    const page = '<!-- marjorie-status-page v1 -->\n\n# Status\n';
    const once = replaceTraffic(page, t1);
    expect(once.split('\n')[0]).toBe('<!-- marjorie-status-page v1 -->');
    expect(readTraffic(once)).toEqual(t1);
    const twice = replaceTraffic(once, t2);
    expect(readTraffic(twice)).toEqual(t2);
    expect(twice.match(/status-traffic/g)).toHaveLength(1);
  });
});

describe('Growth section', () => {
  it('shows visitors and pageviews against the prior week, top pages and referrers', () => {
    const out = renderGrowth({ latest: null, prior: null, traffic: readTraffic(trafficMarker(compactTraffic(raw, NOW))) });
    expect(out).toContain('Site, last 7 days (as of 2026-10-01, Vercel Web Analytics)');
    expect(out).toContain('- Visitors: **120** (+20% vs prior week)');
    expect(out).toContain('- Pageviews: **480** (+20% vs prior week)');
    expect(out).toContain('- Top pages: /era/0 (50) · /era/1 (49)');
    expect(out).toContain('- Top referrers: google.com (30) · (direct) (20)');
  });
  it('shows a drop, and says nothing about the site when no numbers are cached', () => {
    const down = compactTraffic({ ...raw, visitors: 50 }, NOW);
    expect(renderTrafficLines(down).join('\n')).toContain('(-50% vs prior week)');
    expect(renderGrowth({ latest: null, prior: null, traffic: null })).not.toContain('Site, last 7 days');
  });
});

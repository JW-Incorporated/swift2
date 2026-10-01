// Time-sensitive coverage and Tree-ask accounting for the weekly growth
// collector (W5). A "time-sensitive event" is a real-world intake issue
// (`intake` label, title `intake: <headline>` — the news desk's drops, e.g.
// the "Patient Zero" single). Coverage = did the SITE ship it (issue closed)
// and did a SOCIAL post go out, each within COVERAGE_HOURS of the event.
// Social matching is by headline keywords against posted body/campaign/why —
// a mechanical hint the reviewer re-checks, never a verdict on its own.
import { DAY_MS } from './growth-data.mjs';

export const COVERAGE_HOURS = 48;
const HOUR_MS = 3_600_000;
const STOP = new Set(['Taylor', 'Swift', 'Swift’s', "Swift's", 'Taylor’s', "Taylor's", 'The', 'And', 'For', 'With', 'Her', 'His', 'After', 'Over', 'New', 'Says', 'Why']);
const TITLE_PREFIX_RE = /^(Tree|Marjorie) → (Tree|Marjorie): /;

/** Quoted phrases in the headline, else its proper-noun words (never "Taylor Swift"). */
export function keywordsOf(title) {
  const text = String(title || '').replace(/^intake:\s*/i, '');
  const quoted = [...text.matchAll(/['"‘“]([^'"’”]{3,60})['"’”]/g)].map((m) => m[1].trim().toLowerCase());
  if (quoted.length) return { mode: 'phrase', words: [...new Set(quoted)] };
  const words = text.split(/[^A-Za-z0-9’']+/).filter((w) => /^[A-Z][A-Za-z0-9]{2,}$/.test(w) && !STOP.has(w));
  return { mode: 'words', words: [...new Set(words.map((w) => w.toLowerCase()))] };
}

export function textMatches(text, { mode, words }) {
  if (!words.length) return false;
  const hay = String(text || '').toLowerCase();
  const hits = words.filter((w) => hay.includes(w)).length;
  return mode === 'phrase' ? hits >= 1 : hits >= Math.min(2, words.length);
}

function classify({ siteHours, socialHours, ageHours }) {
  const site = siteHours !== null && siteHours <= COVERAGE_HOURS;
  const social = socialHours !== null && socialHours <= COVERAGE_HOURS;
  if (site && social) return 'covered';
  if (site) return 'site-only';
  if (social) return 'social-only';
  if (ageHours < COVERAGE_HOURS) return 'pending';
  return siteHours !== null || socialHours !== null ? 'late' : 'missed';
}

/**
 * Events from intake issues created inside the window, plus still-open ones
 * from the week before (carried over — an uncovered event does not stop
 * mattering at the week boundary).
 */
export function timeSensitiveCoverage(intakeIssues, posted, { startMs, endMs }) {
  const events = (intakeIssues || [])
    .filter((i) => /^intake:/i.test(i.title || ''))
    .filter((i) => {
      const at = Date.parse(i.createdAt);
      if (!Number.isFinite(at) || at > endMs) return false;
      return at > startMs || (at > startMs - 7 * DAY_MS && String(i.state).toUpperCase() === 'OPEN');
    })
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((issue) => {
      const created = Date.parse(issue.createdAt);
      const keywords = keywordsOf(issue.title);
      const matched = (posted || [])
        .filter((p) => Date.parse(p.postedAt) >= created && Date.parse(p.postedAt) <= endMs)
        .filter((p) => textMatches(`${p.body ?? ''} ${p.campaign ?? ''} ${p.why ?? ''}`, keywords))
        .sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt))
        .map((p) => ({ platform: p.platform, postedAt: p.postedAt, campaign: p.campaign ?? null, hoursAfter: Math.round((Date.parse(p.postedAt) - created) / HOUR_MS) }));
      const closed = String(issue.state).toUpperCase() === 'CLOSED' && issue.closedAt;
      const siteHours = closed ? Math.round((Date.parse(issue.closedAt) - created) / HOUR_MS) : null;
      const socialHours = matched.length ? matched[0].hoursAfter : null;
      const ageHours = Math.max(0, Math.round((endMs - created) / HOUR_MS));
      return {
        number: issue.number,
        headline: String(issue.title).replace(/^intake:\s*/i, '').slice(0, 110),
        createdAt: issue.createdAt,
        carriedOver: created <= startMs,
        state: String(issue.state).toLowerCase(),
        ageHours,
        siteHoursToShip: siteHours,
        socialHoursToFirstPost: socialHours,
        matchedPosts: matched.slice(0, 5),
        status: classify({ siteHours, socialHours, ageHours }),
      };
    });
  const byStatus = {};
  for (const e of events) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  return { coverageHours: COVERAGE_HOURS, events: events.length, byStatus, items: events };
}

const stripTitle = (t) => String(t || '').replace(TITLE_PREFIX_RE, '').slice(0, 110);
const desks = (i) => (i.labels || []).map((l) => l.name).filter((n) => n.startsWith('desk:'));

function askList(issues, { startMs, endMs }) {
  const rows = issues || [];
  const open = rows
    .filter((i) => String(i.state).toUpperCase() === 'OPEN')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((i) => ({ number: i.number, title: stripTitle(i.title), ageDays: Math.max(0, Math.floor((endMs - Date.parse(i.createdAt)) / DAY_MS)), desks: desks(i) }));
  const closedInWindow = rows.filter((i) => i.closedAt && Date.parse(i.closedAt) > startMs && Date.parse(i.closedAt) <= endMs).length;
  const openedInWindow = rows.filter((i) => Date.parse(i.createdAt) > startMs && Date.parse(i.createdAt) <= endMs).length;
  return { open: open.length, oldestOpenDays: open.length ? open[0].ageDays : null, openedInWindow, closedInWindow, items: open.slice(0, 20) };
}

/** Tree's asks of Marjorie (`tree-filed`) and Marjorie's asks of Tree (`desk:tree` + `marjorie-filed`). */
export function treeAsksSummary({ treeFiled, marjorieFiledForTree }, win) {
  return { fromTree: askList(treeFiled, win), toTree: askList(marjorieFiledForTree, win) };
}

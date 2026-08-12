// Is a gate stalled, or is the TRACKER just stale?
//
// This distinction is the difference between a useful brief and a harmful one.
//
// On 2026-08-11 the real brief told the founders that LEGAL and BACKUPS were
// "unstaffed" and had been red for 3+ weeks. Both statements came from
// docs/launch-readiness.md, whose LEGAL and BACKUPS rows had not been edited
// since 2026-07-11. On that same morning, PR #1889 ("legal: counsel-ready
// privacy policy + terms drafts") and PR #1890 ("backups: executable, verified
// restore drill") were both open. The work was moving. Only the bookkeeping
// was frozen — and the brief reported the bookkeeping as if it were the world.
//
// So before calling anything stalled, this module asks GitHub: has anything
// actually happened on the tickets this gate's own "next action" column names?
//
//   gate row → `#NNN` references → issue state + last update
//                                → open PRs that close or mention them
//
// A gate with no tracker movement AND no ticket movement is genuinely idle —
// that is a real blocker and belongs in front of the founders. A gate with no
// tracker movement but live ticket movement is a STALE TRACKER — which is a
// process failure worth naming, but not a launch blocker, and must never be
// reported to founders as "nobody is working on this".

import { GATES } from './gate-history.mjs';

const DAY_MS = 86_400_000;

/** Every `#NNN` in a tracker cell. The gate rows carry their tickets inline. */
export function extractTickets(cell) {
  const out = [];
  for (const m of String(cell || '').matchAll(/#(\d{2,6})\b/g)) {
    const n = Number(m[1]);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

/**
 * Ticket numbers a PR actually CLAIMS — closing keywords in the body, plus
 * anything in the title.
 *
 * Not every `#NNN` in the body: PR #1910 ("autonomy: work ownership as state")
 * is a docs PR whose prose cites a dozen tickets as examples, and a
 * whole-body scan attached it to LEGAL, BACKUPS and PLUMBING simultaneously —
 * three gates it does nothing for. A closing keyword is a claim; a mention is
 * a footnote.
 */
export function ticketsReferencedByPr(pr) {
  const body = String(pr.body || '');
  const closing = [...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s*#(\d{2,6})\b/gi)].map((m) => Number(m[1]));
  return [...new Set([...closing, ...extractTickets(pr.title || '')])];
}

/**
 * Fold issue + PR state into a per-gate activity record. Pure: the caller does
 * the fetching, so this is unit-testable without a network.
 *
 * `issues` and `prs` are plain arrays of `{ number, state, updatedAt, ... }`.
 */
export function buildGateActivity(currentGates, { issues = [], prs = [] } = {}) {
  const issueBy = new Map(issues.map((i) => [i.number, i]));
  const out = {};
  for (const gate of GATES) {
    const row = currentGates[gate];
    if (!row) continue;
    const ticketNums = extractTickets(row.nextAction);
    const tickets = ticketNums.map((n) => {
      const i = issueBy.get(n);
      return i
        ? { number: n, state: String(i.state || '').toLowerCase(), updatedAt: i.updatedAt, closedAt: i.closedAt ?? null, title: i.title }
        : { number: n, state: 'unknown', updatedAt: null, closedAt: null };
    });
    const openPRs = prs.filter((p) => ticketsReferencedByPr(p).some((n) => ticketNums.includes(n)));
    const stamps = [
      ...tickets.map((t) => t.updatedAt),
      ...openPRs.map((p) => p.updatedAt || p.createdAt),
    ].filter(Boolean).map((s) => new Date(s).getTime()).filter((n) => Number.isFinite(n));
    out[gate] = {
      tickets,
      openPRs: openPRs.map((p) => ({ number: p.number, title: p.title, createdAt: p.createdAt, updatedAt: p.updatedAt, isDraft: !!p.isDraft })),
      lastActivityMs: stamps.length ? Math.max(...stamps) : null,
      closedTickets: tickets.filter((t) => t.state === 'closed').map((t) => t.number),
    };
  }
  return out;
}

/**
 * `'idle'` — nothing has moved anywhere: a real blocker.
 * `'tracker-stale'` — the tracker row is old but the gate's tickets or PRs
 *                     moved inside the window: a bookkeeping failure.
 * `'unknown'` — the row names no tickets at all, so we cannot tell. Treated as
 *               idle for estimation (conservative) but labelled honestly.
 */
export function classifyStall(gate, activity, nowMs, windowDays) {
  const a = activity?.[gate];
  if (!a || a.tickets.length === 0) {
    return { kind: 'unknown', reason: 'tracker row names no ticket to check' };
  }
  if (a.openPRs.length > 0) {
    const list = a.openPRs.map((p) => `#${p.number}`).join(', ');
    return { kind: 'tracker-stale', reason: `open PR ${list} targets this gate's tickets`, prs: a.openPRs };
  }
  if (a.lastActivityMs !== null && nowMs - a.lastActivityMs < windowDays * DAY_MS) {
    const d = Math.floor((nowMs - a.lastActivityMs) / DAY_MS);
    return { kind: 'tracker-stale', reason: `gate tickets last moved ${d}d ago, tracker row is older` };
  }
  const d = a.lastActivityMs === null ? null : Math.floor((nowMs - a.lastActivityMs) / DAY_MS);
  return { kind: 'idle', reason: d === null ? 'no ticket activity on record' : `no ticket activity in ${d} days` };
}

/** How far behind reality the tracker file is, in days. */
export function trackerLagDays(series, activity, nowMs) {
  const lastTracker = series.length ? new Date(series.at(-1).iso).getTime() : null;
  const stamps = Object.values(activity || {}).map((a) => a.lastActivityMs).filter(Boolean);
  const lastReality = stamps.length ? Math.max(...stamps) : null;
  return {
    trackerUpdatedIso: lastTracker ? new Date(lastTracker).toISOString() : null,
    trackerAgeDays: lastTracker === null ? null : Math.floor((nowMs - lastTracker) / DAY_MS),
    lagDays: lastTracker === null || lastReality === null ? null : Math.max(0, Math.floor((lastReality - lastTracker) / DAY_MS)),
  };
}

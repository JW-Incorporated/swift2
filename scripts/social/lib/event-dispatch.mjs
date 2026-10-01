// Which time-sensitive intake events earn a same-day Tree draft (Bots v2 W8).
// Pure: the CLI (../dispatch-event-drafts.mjs) does the GitHub I/O.
//
// Why: 18 of 27 time-sensitive events in the weeks before 2026-09-30 never
// reached social (e.g. the "Patient Zero" single, intake #4587) because the
// only path to a post was the weekly calendar. An `intake:` issue (the news
// desk's drop) is the signal; this picks the ones worth a dedicated run.
// Deterministic and deliberately cheap — Tree's own run still decides draft vs.
// decline against the rubric and the #36 blocklist; this only bounds WHICH
// events get a run, and how many per day.
import { keywordsOf, textMatches } from '../../marjorie/lib/growth-coverage.mjs';

/** Dedupe marker, put on the intake issue BEFORE dispatching (never re-dispatched). */
export const DISPATCH_LABEL = 'tree-event-dispatched';
export const EVENT_WINDOW_HOURS = 24;
export const EVENT_DAILY_CAP = 2;

// Never auto-run on these (the #36 / Clownbot blocklist's shape: legal wrongdoing,
// violence, health, death, private individuals) — the calendar lane can still weigh them.
const SENSITIVE_RE = /\b(lawsuits?|sues?|sued|court|trial|attack(?:er|ed)?|arrest(?:ed)?|police|stalk(?:er|ing)?|assault|died|dies|death|funeral|illness|diagnos\w*|pregnan\w*|rehab|leaked?)\b/i;
// A genuinely time-boxed fan event: a release, a premiere, an announcement, a win.
const TIMELY_RE = /\b(releas\w*|drops?|dropped|premier\w*|announc\w*|tour|album|single|video|vmas?|grammys?|awards?|wins?|won|record|chart\w*|tickets?|trailer|teaser|performs?|surprise|livestream|countdown)\b/i;

// Who may trigger an Opus run. The intake issue form (.github/ISSUE_TEMPLATE/intake.yml)
// auto-labels `intake` for ANY GitHub user, so label + title prove nothing: the body is
// attacker-controlled text an agent would read, and a stranger could burn the daily cap.
// Only repo insiders, or the news desk's own identity (it files as claude[bot] — verified
// 2026-10-01: 48 of the 60 newest intake issues; the other 12 are the owner, a MEMBER), qualify.
export const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];
export const TRUSTED_LOGINS = ['claude[bot]', 'github-actions[bot]'];

export function isTrustedAuthor(issue) {
  return TRUSTED_LOGINS.includes(issue?.author) || TRUSTED_ASSOCIATIONS.includes(issue?.authorAssociation);
}

/** A REST `issues` row (`gh api repos/:r/issues`) in the shape pickEvents reads; null for a pull request. */
export function fromRestIssue(row) {
  if (!row || row.pull_request) return null;
  return {
    number: row.number, title: row.title, createdAt: row.created_at,
    labels: (row.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name)),
    author: row.user?.login ?? null, authorAssociation: row.author_association ?? null,
  };
}

/** `{ ok: true }` or `{ ok: false, why }` for one intake title. */
export function judgeTitle(title) {
  if (!/^intake:/i.test(title ?? '')) return { ok: false, why: 'not an intake: issue' };
  if (SENSITIVE_RE.test(title)) return { ok: false, why: 'sensitive topic — left to the calendar and the blocklist' };
  if (!TIMELY_RE.test(title)) return { ok: false, why: 'no time-boxed event (release, premiere, announcement, win…)' };
  return { ok: true };
}

/**
 * `issues`: `{ number, title, createdAt, labels: string[] }` (open intake issues);
 * `socialItems`: `{ data }` of everything posted/queued/in an open draft PR;
 * `dispatchedToday`: how many events were already dispatched this UTC day.
 * Returns `{ picks, skipped }` — newest first, at most `cap - dispatchedToday`.
 */
export function pickEvents({ issues, socialItems, nowMs, dispatchedToday = 0, cap = EVENT_DAILY_CAP, windowHours = EVENT_WINDOW_HOURS }) {
  const skipped = [];
  const eligible = [];
  for (const issue of issues ?? []) {
    const skip = (why) => skipped.push({ number: issue.number, why });
    if (!isTrustedAuthor(issue)) { skip('author is not the news desk or a repo insider'); continue; }
    if ((issue.labels ?? []).includes(DISPATCH_LABEL)) { skip('already dispatched'); continue; }
    if (!(Date.parse(issue.createdAt) >= nowMs - windowHours * 3_600_000)) { skip(`older than ${windowHours}h`); continue; }
    const verdict = judgeTitle(issue.title);
    if (!verdict.ok) { skip(verdict.why); continue; }
    const keywords = keywordsOf(issue.title);
    if ((socialItems ?? []).some(({ data }) => textMatches(`${data?.body ?? ''} ${data?.campaign ?? ''} ${data?.why ?? ''}`, keywords))) { skip('already covered by a posted/queued/drafted item'); continue; }
    eligible.push(issue);
  }
  eligible.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const room = Math.max(0, cap - dispatchedToday);
  for (const issue of eligible.slice(room)) skipped.push({ number: issue.number, why: `daily cap of ${cap} reached` });
  return { picks: eligible.slice(0, room).map((i) => ({ number: i.number, title: i.title })), skipped };
}

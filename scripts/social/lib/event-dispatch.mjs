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
// 48h, matching docs/marketing/social-strategy.md §1(e2)'s own same-day floor
// (was 24h until 2026-10-26, issue #6313: a single missed news-triage or scan run
// dropped an event out of the window for good, and the section it serves says 48).
export const EVENT_WINDOW_HOURS = 48;
export const EVENT_DAILY_CAP = 2;

// Never auto-run on these (the #36 / Clownbot blocklist's shape: legal wrongdoing,
// violence, health, death, private individuals) — the calendar lane can still weigh them.
// Applies to site-fronted moments too: being on the site is editorial reach, not a blocklist waiver.
const SENSITIVE_RE = /\b(lawsuits?|sues?|sued|court|trial|attack(?:er|ed)?|arrest(?:ed)?|police|stalk(?:er|ing)?|assault|died|dies|death|funeral|illness|diagnos\w*|pregnan\w*|rehab|leaked?)\b/i;
// A genuinely time-boxed fan event: a release, a premiere, an announcement, a win.
// Second group added 2026-10-26 (#6313) from the real intake corpus — the first group
// was matching wire headlines only incidentally (on a stray `album`/`single`/`video`
// noun) and missing the event families the news desk actually files: a live debut, an
// appearance, a chart week. Deliberately event language, never commentary language
// (`says`, `recounts`, `calls`, `defends`), which the daily cap would otherwise burn on.
const TIMELY_RE = /\b(releas\w*|drops?|dropped|premier\w*|announc\w*|tour|album|single|video|vmas?|grammys?|awards?|wins?|won|record|chart\w*|tickets?|trailer|teaser|performs?|surprise|livestream|countdown|debut\w*|goes\s+live|attends?|nominat\w*|anniversar\w*|tribute|setlist|no\.?\s*1|tops|milestone)\b/i;

// --- The site-fronted rule (#6313) -------------------------------------------
// A moment the site has already fronted (social/inbox/new-on-site-<date>.json,
// written by scripts/social/new-on-site.mjs) has passed the news desk's own
// editorial bar and is live and sourced on longlivets.com — so for those the
// keyword test is the wrong gate, and strategy §1(e2) makes the site's front page
// the trigger for a major moment outright. Such an intake issue is promoted past
// TIMELY_RE and sorts ahead of ordinary news, so a broadened keyword list can
// never crowd the curated lane out of a 2-a-day cap.
//
// The link is lexical because nothing records provenance from a vault moment back
// to the intake issue that sourced it (moment ids are slugs of the moment title).
// It is deliberately NOT growth-coverage's keywordsOf/textMatches, which is tuned
// for recall on coverage overlap: measured against this corpus its quoted-phrase
// mode reduced "She's not looking for the damn camera!" to the token `she` and
// matched 14 unrelated intake issues. Three shared distinctive tokens linked 5 of
// the week's 10 moments with no false positive at all; the other 5 are editorial
// rewrites ("Confetti on the debut page" for a "20 years of Taylor Swift" website
// tribute) that share almost no vocabulary with the filed headline, and no title
// rule bridges those — see the issue for the measurement.
const TOKEN_STOP = new Set(['taylor', 'swift', 'swifts', 'with', 'that', 'this', 'from', 'they', 'them', 'their', 'have', 'will', 'what', 'when', 'about', 'after', 'over', 'into', 'says', 'said', 'than', 'then', 'just', 'like', 'also', 'been', 'more', 'most', 'first', 'time', 'year', 'years', 'week', 'weeks', 'make', 'makes', 'made', 'next', 'does', 'intake']);
export const SITE_FRONTED_MIN_TOKENS = 3;

/** Distinctive lowercase words of a headline — the unit the site-fronted link counts. */
export function titleTokens(title) {
  const words = String(title ?? '')
    .replace(/^intake:\s*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length >= 4 && !TOKEN_STOP.has(w));
  return new Set(words);
}

/**
 * The site-fronted moment this intake title is the same story as, or null.
 * `siteMoments`: the latest new-on-site feed's `moments` (`{ id, title }`).
 */
export function siteFrontedMoment(title, siteMoments) {
  const words = titleTokens(title);
  if (words.size < SITE_FRONTED_MIN_TOKENS) return null;
  for (const moment of siteMoments ?? []) {
    const shared = [...titleTokens(moment?.title)].filter((w) => words.has(w));
    if (shared.length >= SITE_FRONTED_MIN_TOKENS) return { id: moment.id ?? null, title: moment.title, shared };
  }
  return null;
}

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

/**
 * `{ ok: true }` or `{ ok: false, why }` for one intake title.
 * `siteFronted`: the site already fronts this moment, so TIMELY_RE is skipped —
 * the blocklist is not.
 */
export function judgeTitle(title, { siteFronted = false } = {}) {
  if (!/^intake:/i.test(title ?? '')) return { ok: false, why: 'not an intake: issue' };
  if (SENSITIVE_RE.test(title)) return { ok: false, why: 'sensitive topic — left to the calendar and the blocklist' };
  if (!siteFronted && !TIMELY_RE.test(title)) return { ok: false, why: 'no time-boxed event (release, premiere, announcement, win…)' };
  return { ok: true, siteFronted };
}

/**
 * `issues`: `{ number, title, createdAt, labels: string[] }` (open intake issues);
 * `socialItems`: `{ data }` of everything posted/queued/in an open draft PR;
 * `siteMoments`: the latest new-on-site feed's `moments` — a match promotes an
 * issue past TIMELY_RE and sorts it ahead of ordinary news (§1(e2));
 * `dispatchedToday`: how many events were already dispatched this UTC day.
 * Returns `{ picks, skipped }` — site-fronted first then newest, at most
 * `cap - dispatchedToday`.
 */
export function pickEvents({ issues, socialItems, siteMoments, nowMs, dispatchedToday = 0, cap = EVENT_DAILY_CAP, windowHours = EVENT_WINDOW_HOURS }) {
  const skipped = [];
  const eligible = [];
  for (const issue of issues ?? []) {
    const skip = (why) => skipped.push({ number: issue.number, why });
    if (!isTrustedAuthor(issue)) { skip('author is not the news desk or a repo insider'); continue; }
    if ((issue.labels ?? []).includes(DISPATCH_LABEL)) { skip('already dispatched'); continue; }
    if (!(Date.parse(issue.createdAt) >= nowMs - windowHours * 3_600_000)) { skip(`older than ${windowHours}h`); continue; }
    const moment = siteFrontedMoment(issue.title, siteMoments);
    const verdict = judgeTitle(issue.title, { siteFronted: Boolean(moment) });
    if (!verdict.ok) { skip(verdict.why); continue; }
    const keywords = keywordsOf(issue.title);
    if ((socialItems ?? []).some(({ data }) => textMatches(`${data?.body ?? ''} ${data?.campaign ?? ''} ${data?.why ?? ''}`, keywords))) { skip('already covered by a posted/queued/drafted item'); continue; }
    eligible.push({ issue, moment });
  }
  eligible.sort((a, b) => Number(Boolean(b.moment)) - Number(Boolean(a.moment)) || Date.parse(b.issue.createdAt) - Date.parse(a.issue.createdAt));
  const room = Math.max(0, cap - dispatchedToday);
  for (const { issue } of eligible.slice(room)) skipped.push({ number: issue.number, why: `daily cap of ${cap} reached` });
  return {
    picks: eligible.slice(0, room).map(({ issue, moment }) => ({ number: issue.number, title: issue.title, siteFronted: moment ? moment.id : null })),
    skipped,
  };
}

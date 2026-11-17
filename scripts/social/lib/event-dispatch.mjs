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

// --- The already-covered gate (#6526) ----------------------------------------
// Until 2026-11-02 this was growth-coverage's keywordsOf/textMatches: the
// headline's capitalised words, SUBSTRING-matched, 2 hits anywhere in the whole
// posted corpus. On the week to 2026-11-01 that marked every one of the 27
// site-covered moments "already covered" and 0 reached social. `Eras` and `Tour`
// (#6448) hit every Eras Tour post ever made; `Sam` (#6484) hit the word "same";
// and the news desk's publisher/date tail — "(KVOA, Oct 30 2026)" — contributed
// matchable tokens of its own.
//
// growth-coverage keeps that matcher on purpose: it is tuned for recall on the
// weekly growth review, where its output is a hint a reviewer re-checks. A
// dispatch gate gets no second look, so it needs the opposite bias — hence this
// local rule: a recent item (48h, the same window the scan itself uses) that
// either names the intake issue or shares MOST of the headline's distinctive
// words as WHOLE words.
export const COVERED_WINDOW_HOURS = EVENT_WINDOW_HOURS;
/** Share of the headline's distinctive words a recent item must carry (floor of 2). */
export const COVERED_MIN_RATIO = 0.6;
// The news desk appends its source to every headline: "(The Times, Oct 29 2026)",
// "(SI/Fox News-OutKick, Oct 18 2026)". Those words are about provenance, never
// the story, and a post never repeats them — so they are dropped before counting.
const ATTRIBUTION_RE = /\s*\([^()]*\b(?:19|20)\d{2}\b[^()]*\)\s*$/;

/** The headline's own distinctive words, without the news desk's source/date tail. */
export function storyTokens(title) {
  return titleTokens(String(title ?? '').replace(ATTRIBUTION_RE, ''));
}

/** The prose a social item can show this story in. */
const itemText = (data) => `${data?.body ?? ''} ${data?.campaign ?? ''} ${data?.why ?? ''}`;

/** When a social item speaks for: posted time, else the slot it is scheduled into. */
function itemTimeMs(data) {
  for (const value of [data?.postedAt, data?.scheduledAt]) {
    const at = Date.parse(value ?? '');
    if (Number.isFinite(at)) return at;
  }
  return null;
}

/**
 * The recent social item that already covers this intake story, or null.
 * `issue`: `{ number, title }`; `socialItems`: `{ ref, data }` of everything
 * posted/queued/in an open draft PR.
 *
 * Two paths, either one enough: the item NAMES the intake issue (`#6448` in its
 * body/campaign/why — what an event draft writes), or it carries most of the
 * headline's distinctive words as whole words. Only items timestamped inside
 * `windowHours` count; an undated item still counts, because the only shape that
 * reaches here undated is a draft in flight, which is current by nature.
 */
export function coveredBy(issue, socialItems, { nowMs, windowHours = COVERED_WINDOW_HOURS } = {}) {
  const tokens = [...storyTokens(issue?.title)];
  const need = Math.max(2, Math.ceil(tokens.length * COVERED_MIN_RATIO));
  const floor = nowMs - windowHours * 3_600_000;
  const mention = Number.isFinite(Number(issue?.number)) ? new RegExp(`(^|[^\\w/])#${Number(issue.number)}(?!\\d)`) : null;
  for (const item of socialItems ?? []) {
    if (!item?.data) continue;
    const at = itemTimeMs(item.data);
    if (at !== null && at < floor) continue;
    const text = itemText(item.data);
    if (mention?.test(text)) return { ref: item.ref ?? null, via: 'intake issue reference' };
    const words = titleTokens(text);
    const shared = tokens.filter((t) => words.has(t));
    if (shared.length >= need) return { ref: item.ref ?? null, via: `${shared.length}/${tokens.length} headline words: ${shared.join(', ')}` };
  }
  return null;
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
 * `socialItems`: `{ ref, data }` of everything posted/queued/in an open draft
 * PR — only the last `windowHours` of it can mark a story covered (`coveredBy`);
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
    const covered = coveredBy(issue, socialItems, { nowMs, windowHours });
    if (covered) { skip(`already covered by a posted/queued/drafted item${covered.ref ? ` — ${covered.ref} (${covered.via})` : ''}`); continue; }
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

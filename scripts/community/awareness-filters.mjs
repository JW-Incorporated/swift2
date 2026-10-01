// Awareness image-reply lane — pure discovery filters (no I/O). The lane
// finds threads where a picture of our site, with no link, invites "what is
// that?!" (owner direction 2026-10-01, docs/strategy/growth-strategy.md).
// Everything here works from what Reddit RSS gives us (title, permalink,
// ISO date, feed rank): no comment bodies are read or stored (plan §6.3).
import { screenTopic } from '@swift2/shared/redline';

export const AWARENESS_KIND = 'awareness_reply';
export const DEFAULT_MAX_AGE_HOURS = 48;

/** Thread shapes where a site visual fits. Title-only, deliberately plain. */
export const THREAD_TYPES = [
  {
    id: 'ranking',
    re: /\b(rank(ing|ed|s)?|tier ?list|bracket|favou?rites?|best|worst|top (3|5|10|\d+)|underrated|overrated|which (era|album|song)|debate|unpopular opinion|comparison|compare[sd]?|vs\.?)\b/i,
  },
  {
    id: 'era_talk',
    re: /\b(folklore|evermore|midnights|reputation|fearless|speak now|1989|ttpd|tortured poets|showgirl|tloas|eras tour|(every|each|all) (era|album)s?|(an?|the|this|that|her) eras?)\b/i,
  },
  {
    id: 'timeline',
    re: /\b(when (did|was|were)|how long|timeline|what year|chronolog\w*|in order|release (date|order)|what happened (in|during))\b/i,
  },
  {
    id: 'easter_egg',
    re: /\b(easter ?eggs?|theor(y|ies)|clues?|hints?|foreshadow(ing|ed)?|cryptic|connections?|numerology|analy[sz]\w*|parallels?|symbolism|decode[sd]?)\b/i,
  },
  {
    id: 'nostalgia',
    re: /\b(anniversary|nostalgi\w*|throwback|\d+ years (ago|since|later)|remember when|childhood|growing up|take me back|first (concert|album|song)|og fans?|back then|used to)\b/i,
  },
  {
    id: 'news',
    re: /\b(announce[sd]?|just (dropped|announced|released)|new (album|single|video|tour|era|merch)|release date|tour dates?|reaction|trailer|premiere|breaking|encore|projected|billboard|charts?|no\.? ?1|number one|first week|sales|streams?)\b/i,
  },
];

/** Crafts, fan art, trades and personal photos: no discussion for a picture to join. */
const NOT_DISCUSSION_RE =
  /(\[oc\]|\bfan ?art\b|\bconcept\b|\btutorial\b|\bmashups?\b|\bbookmarks?\b|\bcrochet\w*|\bbracelets?\b|\btattoos?\b|\bi (made|drew|painted|baked|bought|got|found)\b|\bmy (bestie|friend|mom|dad|sister|daughter|dog|cat)\b|\bcosplay\b|\btickets?\b|\b(wtb|wts|wtt|iso)\b|\blooking for\b|\bhaul\b|\bunboxing\b|\boutfit\b|\bcover art\b)/i;

const MEGATHREAD_RE =
  /\b(mega ?thread|daily (discussion|thread)|weekly (discussion|thread)|discussion thread|free talk|live thread|general thread|monthly thread|sticky)\b/i;

/**
 * Extra personal-life terms on top of screenTopic() (guardrail 4: sensitive
 * personal-life topics are confirmed-only). Deliberately blunt: a skipped
 * thread costs nothing, a bad reply under a sensitive thread costs a lot.
 */
const PERSONAL_LIFE_RE =
  /\b(travis|kelce|engag(ed|ement)|wedding|married|marriage|pregnan\w*|breakup|break up|dating|relationships?|situationship|exes|boyfriend|girlfriend|fianc\w*|baby|surgery|diagnos\w*|health|died|death|passed away|rip|funeral|suicide|lawsuit|sued?|stalker|stalking|leak(ed|s)?|blake|justin bieber|kanye|kim k|scooter|swelce|nsfw|politic\w*|trump|harris|election)\b/i;

const TAYLOR_RE =
  /\b(taylor|swift|swifties?|eras?|folklore|evermore|midnights|reputation|lover|fearless|speak now|red|1989|ttpd|tortured poets|showgirl|debut)\b/i;

/** Hours since an ISO timestamp; Infinity when unparseable (so it is dropped). */
export function threadAgeHours(createdAt, now = new Date()) {
  const t = Date.parse(createdAt ?? '');
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - t) / 3_600_000;
}

export function isMegathread(title) {
  return MEGATHREAD_RE.test(String(title ?? ''));
}

/** Only meaningful for sources that carry the flags (JSON/relay); RSS never does, so absent flags mean "not known to be locked". */
export function isLockedOrArchived(post) {
  return post?.locked === true || post?.archived === true;
}

export function classifyThreadTypes(title) {
  const text = String(title ?? '');
  return THREAD_TYPES.filter((type) => type.re.test(text)).map((type) => type.id);
}

/** Why a title is unsafe for an image reply, or null when it is fine. */
export function sensitiveReason(title) {
  const text = String(title ?? '');
  const category = screenTopic(text);
  if (category) return `redline:${category}`;
  if (PERSONAL_LIFE_RE.test(text)) return 'personal-life';
  return null;
}

/**
 * Applies every discovery filter to one RSS post. Returns
 * `{ ok: true, types, ageHours }` or `{ ok: false, reason }` — the reason is
 * a stable token so a run can print counts per filter.
 */
export function evaluateThread(
  post,
  sub,
  { now = new Date(), maxAgeHours = DEFAULT_MAX_AGE_HOURS } = {},
) {
  if (!post?.id || !post.permalink || !post.title) return { ok: false, reason: 'malformed' };
  const ageHours = threadAgeHours(post.createdAt, now);
  if (!(ageHours <= maxAgeHours)) return { ok: false, reason: 'too-old' };
  if (isLockedOrArchived(post)) return { ok: false, reason: 'locked-or-archived' };
  if (isMegathread(post.title)) return { ok: false, reason: 'megathread' };
  if (NOT_DISCUSSION_RE.test(post.title)) return { ok: false, reason: 'not-discussion' };
  const sensitive = sensitiveReason(post.title);
  if (sensitive) return { ok: false, reason: sensitive };
  if (sub?.requireTaylor && !TAYLOR_RE.test(post.title)) return { ok: false, reason: 'off-topic' };
  const types = classifyThreadTypes(post.title);
  if (types.length === 0) return { ok: false, reason: 'no-fit' };
  return { ok: true, types, ageHours };
}

/** Candidate score: thread-type fit, feed rank (hot position), sub tier, mild preference for 2-36h old. */
export function scoreCandidate({ types, rank = 25, ageHours = 24 }, sub) {
  const tierBonus = { 1: 3, 2: 1.5, 3: 0 }[sub?.tier ?? 3] ?? 0;
  const freshness = ageHours >= 2 && ageHours <= 36 ? 1 : 0;
  return types.length * 2 + Math.max(0, 25 - rank) / 5 + tierBonus + freshness;
}

/**
 * Caps candidates: at most `perSubScanCap` per sub this run and never more
 * than `remainingToday[sub]` (the sub's daily candidate budget), best score
 * first, then `runCap` across subs. Returns the kept list.
 */
export function applyCandidateCaps(candidates, { perSubScanCap, remainingToday = {}, runCap }) {
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const taken = new Map();
  const kept = [];
  for (const candidate of ordered) {
    const sub = candidate.subreddit;
    const used = taken.get(sub) ?? 0;
    const room = Math.min(perSubScanCap, remainingToday[sub] ?? perSubScanCap);
    if (used >= room) continue;
    taken.set(sub, used + 1);
    kept.push(candidate);
    if (runCap && kept.length >= runCap) break;
  }
  return kept;
}

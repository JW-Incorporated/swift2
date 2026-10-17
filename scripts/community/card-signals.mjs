// P1-17: engagement signals for reply-lead cards, plus the rank/skip rules that
// use them. Pure. A signal that is not a finite number (the home reader's
// breaker may be backing off; an old row) is simply left out; nothing here ever
// renders "undefined", "NaN" or an unknown count as zero.

/** Skip a hot thread this crowded: a new reply sinks out of sight. */
export const SKIP_COMMENTS = 500;
/** Skip a thread this old (hours): the conversation has moved on. */
export const SKIP_AGE_HOURS = 72;

const count = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** 950 -> "950", 1234 -> "1.2k", 15400 -> "15k", 2300000 -> "2.3M". */
export function formatCount(value) {
  const n = Math.round(value);
  if (Math.abs(n) < 1000) return String(n);
  const [div, unit] = Math.abs(n) >= 1_000_000 ? [1_000_000, 'M'] : [1000, 'k'];
  const scaled = n / div;
  const text =
    Math.abs(scaled) < 10 ? scaled.toFixed(1).replace(/\.0$/, '') : String(Math.round(scaled));
  return `${text}${unit}`;
}

export function ageHours(lead, now = new Date()) {
  const created = Date.parse(lead?.thread_created_at ?? '');
  if (!Number.isFinite(created)) return null;
  const hours = (now.getTime() - created) / 3_600_000;
  return hours >= 0 ? hours : null;
}

export function formatAge(hours) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

function counts(lead) {
  const primary = lead?.platform === 'facebook' ? count(lead.reactions) : count(lead?.score);
  const comments = count(lead?.num_comments);
  // Every known count at 0 is almost certainly "not collected", not a real
  // empty thread; leave them all out rather than show a false zero.
  if ((primary ?? 0) === 0 && (comments ?? 0) === 0) return { primary: null, comments: null };
  return { primary, comments };
}

/**
 * Compact signal parts, e.g. ["▲ 1.2k", "340 comments", "3h"] (Reddit) or
 * ["👍 12", "4 comments", "3h"] (Facebook). Missing signals are omitted.
 */
export function signalParts(lead, now = new Date()) {
  const { primary, comments } = counts(lead);
  const mark = lead?.platform === 'facebook' ? '👍' : '▲';
  const age = ageHours(lead, now);
  return [
    primary === null ? null : `${mark} ${formatCount(primary)}`,
    comments === null ? null : `${formatCount(comments)} comment${comments === 1 ? '' : 's'}`,
    age === null ? null : formatAge(age),
  ].filter(Boolean);
}

/** Why a lead should not be shown, or null. A reply to our own comment is never skipped. */
export function skipReason(lead, now = new Date()) {
  if (lead?.kind === 'reply_to_us') return null;
  const { comments } = counts(lead);
  if (comments !== null && comments >= SKIP_COMMENTS) return 'crowded';
  const score = count(lead?.score);
  if (lead?.platform !== 'facebook' && score !== null && score < 0) return 'downvoted';
  const age = ageHours(lead, now);
  if (age !== null && age > SKIP_AGE_HOURS) return 'stale';
  return null;
}

/**
 * Rank key, higher is better, or null when nothing is known (those leads keep
 * their existing order). The reader's own `rank_score` wins when present;
 * otherwise damped interest (square roots, so one huge thread cannot swamp the
 * batch) divided by thread age.
 */
export function leadHeat(lead, now = new Date()) {
  const own = count(lead?.rank_score);
  if (own !== null) return own;
  const { primary, comments } = counts(lead);
  if (primary === null && comments === null) return null;
  const interest = Math.sqrt(Math.max(primary ?? 0, 0)) + Math.sqrt(Math.min(comments ?? 0, 100));
  return interest / ((ageHours(lead, now) ?? 0) + 2);
}

// The one place routine-failure issue keys and dedupe helpers live, shared by triage
// (which files and dedupes) and recovery (which closes), so the two can never disagree.
// Key = workflow + UTC day + sequence. Sequence 1 is the day's first issue (the
// pre-2026-11 format, unchanged); a failure after that issue was closed files
// sequence 2, 3, ... with a `#<seq>` marker suffix and a ` (<seq>)` title suffix.

export const TITLE_PREFIX = 'routine failure:';
export const COMMENT_MARKER = '<!-- routine-failure-comment -->';

const keyOf = (day, seq = 1) => (seq > 1 ? `${day}#${seq}` : day);
export const failureMarker = (workflow, day, seq = 1) => `<!-- routine-failure: ${workflow} ${keyOf(day, seq)} -->`;
export const failureTitle = (workflow, day, seq = 1) => `${TITLE_PREFIX} ${workflow} ${day}${seq > 1 ? ` (${seq})` : ''}`;
export const askKey = (workflow, day, seq = 1) => `routine-failure-${workflow}-${day}${seq > 1 ? `-${seq}` : ''}`;

const MARKER_RE = /<!-- routine-failure: ([a-z0-9][a-z0-9-]*) (\d{4}-\d{2}-\d{2})(?:#([1-9]\d*))? -->/g;

/** Every failure marker in a body, as { workflow, day, seq }. */
export function parseFailureMarkers(body) {
  return [...String(body ?? '').matchAll(MARKER_RE)].map((m) => ({ workflow: m[1], day: m[2], seq: m[3] ? Number(m[3]) : 1 }));
}

export const COMMENT_MIN_GAP_MS = 3_600_000;
export const COMMENT_MAX = 5;

/** Whole-URL match (run 111 is not run 1111) without a substring test on a URL. */
export function mentionsUrl(text, url) {
  const escaped = String(url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped + '(?![0-9A-Za-z/_-])').test(String(text ?? ''));
}

/** One comment per repeat failure, but never within an hour of the last triage comment or past five. */
export function shouldComment(comments, now) {
  const mine = (comments || []).filter((c) => String(c.body ?? '').includes(COMMENT_MARKER));
  if (mine.length >= COMMENT_MAX) return false;
  const latest = Math.max(0, ...mine.map((c) => Date.parse(c.created_at ?? c.createdAt) || 0));
  return !(latest && now - latest < COMMENT_MIN_GAP_MS);
}

/** The sequence of this workflow+day's marker in a body, or 0 when it has none. */
export function seqFor(body, workflow, day) {
  return parseFailureMarkers(body).find((m) => m.workflow === workflow && m.day === day)?.seq ?? 0;
}

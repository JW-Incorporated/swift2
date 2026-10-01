export const DAY_MS = 86_400_000;
export const AGE_STOP_COUNT = 3;

const MONTHS = new Map(
  [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ].map((month, index) => [month, index]),
);

export function exportFileName(slug, dateLabel) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('invalid group slug');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLabel)) throw new Error('invalid export date');
  return `fb-${slug}-${dateLabel}.html`;
}

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function weekOf(date = new Date()) {
  const sunday = new Date(date);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  return localDate(sunday);
}

export function relativeAgeMs(value, now = new Date()) {
  const text = String(value ?? '')
    .trim()
    .replace(/\u00a0/g, ' ');
  if (!text) return null;
  if (/^(?:just now|now)$/i.test(text)) return 0;
  if (/^yesterday(?: at \d{1,2}:\d{2}(?: [ap]m)?)?$/i.test(text)) return DAY_MS;
  const relative = text.match(
    /^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)(?:\s+ago)?$/i,
  );
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase()[0];
    const multiplier =
      unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : unit === 'd' ? DAY_MS : 7 * DAY_MS;
    return amount * multiplier;
  }
  const monthDay = text.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s+at\s+(\d{1,2}):(\d{2})(?:\s*([ap]m))?)?$/i,
  );
  if (monthDay) {
    const [, monthName, dayText, yearText, hourText, minuteText, meridiem] = monthDay;
    let hour = Number(hourText ?? 0);
    if (meridiem) {
      hour %= 12;
      if (meridiem.toLowerCase() === 'pm') hour += 12;
    }
    const year = Number(yearText ?? now.getFullYear());
    const absolute = new Date(
      year,
      MONTHS.get(monthName.toLowerCase()),
      Number(dayText),
      hour,
      Number(minuteText ?? 0),
    );
    if (
      absolute.getFullYear() !== year ||
      absolute.getMonth() !== MONTHS.get(monthName.toLowerCase()) ||
      absolute.getDate() !== Number(dayText) ||
      (!yearText && absolute.getTime() > now.getTime())
    )
      return null;
    return Math.max(0, now.getTime() - absolute.getTime());
  }
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ][0-9:.+-]+(?:Z)?)?$/.test(text)) return null;
  const absolute = new Date(text);
  return Number.isNaN(absolute.getTime()) ? null : Math.max(0, now.getTime() - absolute.getTime());
}

export function oldestVisibleAge(values, now = new Date()) {
  const ages = values.map((value) => relativeAgeMs(value, now)).filter(Number.isFinite);
  return ages.length ? Math.max(...ages) : null;
}

export function unitAgeMs(unit, now = new Date()) {
  return relativeAgeMs(unit.ownTimestamp ?? unit.timestamps?.[0], now);
}

export function oldestHarvestAge(units, now = new Date(), { ignorePinned = false } = {}) {
  const ages = units
    .filter((unit) => !ignorePinned || !unit.ignoreForAge)
    .map((unit) => unitAgeMs(unit, now))
    .filter(Number.isFinite);
  return ages.length ? Math.max(...ages) : null;
}

function unitsInFeedOrder(units) {
  return [...units].sort((left, right) => left.position - right.position);
}

// Codex round 4 #4: comment collection reports failures as one of these fixed codes, never as an
// exception message (which can carry DOM-derived private text). Anything else → 'unknown'.
export const COMMENT_ERROR_CODES = Object.freeze([
  'collector-missing',
  'collector-threw',
  'bad-shape',
  'budget-skip',
]);

export function commentErrorCode(value) {
  return COMMENT_ERROR_CODES.includes(value) ? value : 'unknown';
}

export function trailingOldBoundary(units, now = new Date(), count = AGE_STOP_COUNT) {
  const ordered = unitsInFeedOrder(units);
  const trailingOld = [];
  let boundaryIndex = ordered.length;
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const unit = ordered[index];
    if (unit.ignoreForAge) continue;
    const ageMs = unitAgeMs(unit, now);
    if (ageMs === null) continue;
    if (ageMs <= 7 * DAY_MS) break;
    trailingOld.unshift({ index, ageMs });
    boundaryIndex = index;
  }
  if (trailingOld.length < count) return null;
  const stopUnits = trailingOld.slice(-count);
  return {
    boundaryIndex,
    coverageAgeMs: Math.min(...stopUnits.map(({ ageMs }) => ageMs)),
  };
}

function isOld(ageMs) {
  return ageMs !== null && ageMs > 7 * DAY_MS;
}

// Two independent rules (Codex round 3 #6): the three-trailing-old-posts boundary decides where
// the feed STOPS; whatever it says, ANY unit (pinned or not) with a readable timestamp older than
// seven days is never part of the output — ignoreForAge only affects the stop boundary (Codex
// round 4 #3). (Mirrored in fb-extension/harvest-core.js.)
export function recentHarvestUnits(units, now = new Date()) {
  const ordered = unitsInFeedOrder(units);
  const boundary = trailingOldBoundary(ordered, now);
  const beforeBoundary = boundary
    ? ordered.filter(
        (unit, index) =>
          index < boundary.boundaryIndex || unitAgeMs(unit, now) === null || unit.ignoreForAge,
      )
    : ordered;
  return beforeBoundary.filter((unit) => !isOld(unitAgeMs(unit, now)));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function harvestCoverageAge(units, now = new Date(), stopReason = null) {
  const boundary = trailingOldBoundary(units, now);
  if (stopReason === 'seven-days' && boundary) return boundary.coverageAgeMs;
  const ages = recentHarvestUnits(units, now)
    .map((unit) => unitAgeMs(unit, now))
    .filter(Number.isFinite);
  if (!ages.length) return null;
  const comparison = ages.slice(-20);
  const outlierLimit = 2 * median(comparison);
  const inliers = ages.filter((ageMs) => ageMs <= outlierLimit);
  return inliers.length ? Math.max(...inliers) : null;
}

export function stopDecision({
  ageStopMet = false,
  stagnantScrolls,
  scrollCount,
  elapsedMs = 0,
  scrollCap = 250,
  wallBudgetMs = 20 * 60_000,
}) {
  if (ageStopMet) return { stop: true, reason: 'seven-days', ageRuleMet: true };
  if (stagnantScrolls >= 3) return { stop: true, reason: 'feed-end', ageRuleMet: true };
  if (scrollCount >= scrollCap) return { stop: true, reason: 'scroll-cap', ageRuleMet: false };
  if (elapsedMs >= wallBudgetMs) return { stop: true, reason: 'wall-budget', ageRuleMet: false };
  return { stop: false, reason: null, ageRuleMet: false };
}

export function classifyPage({ url = '', text = '', hasPassword = false, hasJoinGroup = false }) {
  const haystack = `${url}\n${text}`;
  if (/checkpoint|two[._ -]?step|two[._ -]?factor|2fa|approvals_code/i.test(haystack))
    return 'checkpoint';
  if (/captcha|security check|required to confirm/i.test(haystack)) return 'captcha';
  if (/this content isn['’]t available/i.test(haystack)) return 'unavailable';
  if (hasJoinGroup) return 'not-member';
  if (hasPassword || /facebook\.com\/login/i.test(url)) return 'login';
  return 'ready';
}

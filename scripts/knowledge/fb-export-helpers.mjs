const DAY_MS = 86_400_000;

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
  if (/^yesterday/i.test(text)) return DAY_MS;
  const relative = text.match(
    /^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)\b/i,
  );
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase()[0];
    const multiplier =
      unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : unit === 'd' ? DAY_MS : 7 * DAY_MS;
    return amount * multiplier;
  }
  const absolute = new Date(text.replace(/ at /i, ' '));
  return Number.isNaN(absolute.getTime()) ? null : Math.max(0, now.getTime() - absolute.getTime());
}

export function oldestVisibleAge(values, now = new Date()) {
  const ages = values.map((value) => relativeAgeMs(value, now)).filter(Number.isFinite);
  return ages.length ? Math.max(...ages) : null;
}

export function stopDecision({ oldestAgeMs, stagnantScrolls, scrollCount, scrollCap = 60 }) {
  if (oldestAgeMs !== null && oldestAgeMs > 7 * DAY_MS)
    return { stop: true, reason: 'seven-days', ageRuleMet: true };
  if (stagnantScrolls >= 3) return { stop: true, reason: 'feed-end', ageRuleMet: true };
  if (scrollCount >= scrollCap) return { stop: true, reason: 'scroll-cap', ageRuleMet: false };
  return { stop: false, reason: null, ageRuleMet: false };
}

export function classifyPage({ url = '', text = '', hasPassword = false, hasJoinGroup = false }) {
  const haystack = `${url}\n${text}`;
  if (/checkpoint|two.factor|2fa|approvals_code/i.test(haystack)) return 'checkpoint';
  if (/captcha|security check|required to confirm/i.test(haystack)) return 'captcha';
  if (hasJoinGroup) return 'not-member';
  if (hasPassword || /facebook\.com\/login/i.test(url)) return 'login';
  return 'ready';
}

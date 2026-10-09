// Warn-only rule (#5429 step 3, content-audit §5): a track seed whose prose
// uses confirm-language but whose `sources` are all wiki/fan (or absent) has
// no press/primary citation backing "Taylor confirmed it".
export const TRACK_CONFIRM_FIELDS = ['note', 'summary', 'inspiration'];

const NEGATED =
  /\b(?:unconfirmed|never\s+confirmed|not\s+confirmed|(?:hasn['’]t|has\s+not|haven['’]t|have\s+not|hadn['’]t|had\s+not)\s+confirmed)\b/gi;
const CONFIRM = /\bconfirm(?:ed|s)?\b|\bswift\s+said\b|\bshe\s+said\b/i;
// Case-sensitive on purpose: "told Rolling Stone", not "told me".
const TOLD_OUTLET = /\btold\s+[A-Z]/;
// vault-types.ts: fan_forum|wiki|social alone never satisfy a claim.
const WEAK_TYPES = new Set(['wiki', 'fan_forum', 'social', 'fan']);

export function hasConfirmLanguage(text) {
  if (typeof text !== 'string' || !text) return false;
  const t = text.replace(NEGATED, ' ');
  return CONFIRM.test(t) || TOLD_OUTLET.test(t);
}

export function onlyWeakSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return true;
  return sources.every((s) => WEAK_TYPES.has(s?.source_type));
}

/** Names of the prose fields on a track row that trip the rule. */
export function trackConfirmTierFields(row) {
  if (!row || !onlyWeakSources(row.sources)) return [];
  return TRACK_CONFIRM_FIELDS.filter((f) => hasConfirmLanguage(row[f]));
}

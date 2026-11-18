import type { VerificationStatus } from '@swift2/experience';

/** A "Verified live" claim older than this is no longer shown as live. */
export const LIVE_CLAIM_MAX_AGE_DAYS = 30;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_LABEL: Record<VerificationStatus, string> = {
  'verified-live': 'Verified live',
  'third-party-cited': 'Reported by a third party',
  'listed-only': 'Listed only',
  'blocked-unverified': 'Unconfirmed, platform blocks verification',
};

export interface VerificationLine {
  icon: string;
  /** Status text, without the date. */
  label: string;
  /** Date text, rendered no-wrap so "Aug 2026" never splits across lines. */
  date: string;
}

/**
 * ISO `YYYY-MM-DD` parsed by hand, never via `Date` on the string, so a
 * reader's negative-UTC-offset timezone never rolls the date back a day.
 */
function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || !MONTHS[m - 1]) return null;
  return { y, m, d };
}

/**
 * The card footer's verification line. A "Verified live" claim is only made
 * while the check is recent; once it ages past LIVE_CLAIM_MAX_AGE_DAYS the
 * footer drops the claim and shows a neutral "Checked Mon YYYY" instead.
 */
export function verificationLine(status: VerificationStatus, checkedAt: string, today: Date): VerificationLine {
  const parsed = parseIso(checkedAt);
  if (!parsed) return { icon: '◇', label: 'Checked', date: checkedAt };
  const monthYear = `${MONTHS[parsed.m - 1]} ${parsed.y}`;
  const checkedUtc = Date.UTC(parsed.y, parsed.m - 1, parsed.d);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const ageDays = Math.floor((todayUtc - checkedUtc) / 86_400_000);

  if (status === 'verified-live') {
    return ageDays <= LIVE_CLAIM_MAX_AGE_DAYS
      ? { icon: '✓', label: 'Verified live · checked', date: `${parsed.d} ${monthYear}` }
      : { icon: '◇', label: 'Checked', date: monthYear };
  }
  return { icon: '◇', label: `${STATUS_LABEL[status]} · checked`, date: monthYear };
}

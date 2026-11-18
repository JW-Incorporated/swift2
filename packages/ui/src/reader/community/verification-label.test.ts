import { describe, expect, it } from 'vitest';
import { LIVE_CLAIM_MAX_AGE_DAYS, verificationLine } from './verification-label';

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe('verificationLine', () => {
  it('claims "Verified live" with the full date while the check is recent', () => {
    expect(verificationLine('verified-live', '2026-08-14', day('2026-08-20'))).toEqual({
      icon: '✓',
      label: 'Verified live · checked',
      date: '14 Aug 2026',
    });
  });

  it(`still claims live on day ${LIVE_CLAIM_MAX_AGE_DAYS}, drops the claim the day after`, () => {
    expect(verificationLine('verified-live', '2026-08-14', day('2026-09-13')).label).toBe('Verified live · checked');
    expect(verificationLine('verified-live', '2026-08-14', day('2026-09-14'))).toEqual({
      icon: '◇',
      label: 'Checked',
      date: 'Aug 2026',
    });
  });

  it('shows a stale production check (14 Aug, read in November) as neutral, with the year', () => {
    const line = verificationLine('verified-live', '2026-08-14', day('2026-11-18'));
    expect(`${line.label} ${line.date}`).toBe('Checked Aug 2026');
  });

  it('keeps non-live statuses honest and dated by month and year, no em dash', () => {
    const blocked = verificationLine('blocked-unverified', '2026-08-14', day('2026-08-15'));
    expect(`${blocked.label} ${blocked.date}`).toBe('Unconfirmed, platform blocks verification · checked Aug 2026');
    expect(verificationLine('third-party-cited', '2026-08-14', day('2026-08-15')).icon).toBe('◇');
  });

  it('falls back to the raw string for a malformed date instead of crashing', () => {
    expect(verificationLine('verified-live', 'soon', day('2026-08-15')).date).toBe('soon');
  });
});

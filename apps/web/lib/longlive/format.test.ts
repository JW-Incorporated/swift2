import { describe, expect, it } from 'vitest';
import { formatFullDate, formatMonthYear, formatRelativeTime, truncate } from './format';

const NOW = Date.parse('2026-07-09T12:00:00.000Z');

describe('formatRelativeTime', () => {
  it('returns null for missing or unparseable input', () => {
    expect(formatRelativeTime(null, NOW)).toBeNull();
    expect(formatRelativeTime(undefined, NOW)).toBeNull();
    expect(formatRelativeTime('', NOW)).toBeNull();
    expect(formatRelativeTime('not-a-date', NOW)).toBeNull();
  });

  it('treats sub-minute (and slightly-future, clock-skewed) stamps as "just now"', () => {
    expect(formatRelativeTime('2026-07-09T11:59:30.000Z', NOW)).toBe('just now');
    expect(formatRelativeTime('2026-07-09T12:00:05.000Z', NOW)).toBe('just now');
  });

  it('formats minutes and hours with correct pluralization', () => {
    expect(formatRelativeTime('2026-07-09T11:59:00.000Z', NOW)).toBe('1 minute ago');
    expect(formatRelativeTime('2026-07-09T11:15:00.000Z', NOW)).toBe('45 minutes ago');
    expect(formatRelativeTime('2026-07-09T11:00:00.000Z', NOW)).toBe('1 hour ago');
    expect(formatRelativeTime('2026-07-08T13:00:00.000Z', NOW)).toBe('23 hours ago');
  });

  it('formats days, with "yesterday" for exactly one day', () => {
    expect(formatRelativeTime('2026-07-08T11:00:00.000Z', NOW)).toBe('yesterday');
    expect(formatRelativeTime('2026-07-06T12:00:00.000Z', NOW)).toBe('3 days ago');
    expect(formatRelativeTime('2026-06-09T12:00:00.000Z', NOW)).toBe('30 days ago');
  });

  it('degrades gracefully to months and years for old stamps', () => {
    expect(formatRelativeTime('2026-05-20T12:00:00.000Z', NOW)).toBe('1 month ago');
    expect(formatRelativeTime('2026-01-09T12:00:00.000Z', NOW)).toBe('5 months ago');
    expect(formatRelativeTime('2025-06-01T12:00:00.000Z', NOW)).toBe('1 year ago');
    expect(formatRelativeTime('2020-07-09T12:00:00.000Z', NOW)).toBe('6 years ago');
  });
});

describe('formatMonthYear', () => {
  it('formats a bare ISO date as "Month Year"', () => {
    expect(formatMonthYear('2025-10-05')).toBe('October 2025');
    expect(formatMonthYear('2014-08-18')).toBe('August 2014');
  });

  it('never shifts a day backward across timezones (UTC-anchored)', () => {
    // A first-of-month date is the case most likely to roll back a day in a
    // negative-offset local timezone if this weren't UTC-anchored.
    expect(formatMonthYear('2026-01-01')).toBe('January 2026');
  });
});

describe('formatFullDate', () => {
  it('formats a full ISO date, UTC-anchored', () => {
    expect(formatFullDate('2025-10-03')).toBe('October 3, 2025');
    expect(formatFullDate('2026-01-01')).toBe('January 1, 2026');
  });

  it('handles the partial forms dossier dates are authored in', () => {
    expect(formatFullDate('2025-10')).toBe('October 2025');
    expect(formatFullDate('2025')).toBe('2025');
  });

  it('returns unparseable input as-is rather than "Invalid Date"', () => {
    expect(formatFullDate('unknown')).toBe('unknown');
  });
});

describe('truncate', () => {
  it('returns short text unchanged (trimmed)', () => {
    expect(truncate('A short summary.', 140)).toBe('A short summary.');
    expect(truncate('  padded  ', 140)).toBe('padded');
  });

  it('cuts on a word boundary and appends one ellipsis', () => {
    const out = truncate('The quick brown fox jumps over the lazy dog', 20);
    expect(out).toBe('The quick brown fox…');
    expect(out.length).toBeLessThanOrEqual(21);
  });

  it('never leaves dangling punctuation before the ellipsis', () => {
    expect(truncate('Red lips, autumn leaves, and heartbreak across genres', 26)).toBe(
      'Red lips, autumn leaves…',
    );
  });

  it('hard-cuts a single enormous word instead of collapsing the preview', () => {
    const out = truncate('a '.repeat(2) + 'x'.repeat(300), 40);
    expect(out.length).toBeLessThanOrEqual(41);
    expect(out.endsWith('…')).toBe(true);
  });
});

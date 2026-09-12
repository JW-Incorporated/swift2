import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { activeGrantFor, eligibility, readGrants } from './autonomy.mjs';

const NOW = new Date('2026-09-14T12:00:00Z').getTime();
const TYPE = 'heartbeat:on-this-day';

// S3's pillarOf table (feedback.mjs) — the five queue-item campaign
// families the Wave 4 gate (spec AC#3) must run eligibility() against.
const FIVE_FAMILIES = ['launch:', 'thread:', 'timeline:', 'mood:', 'heartbeat:'];

function row(action: string, daysAgo: number, overrides: Record<string, unknown> = {}) {
  return {
    file: 'social/queue/2026-09-01-example-x.json',
    campaign: `${TYPE}:example`,
    action,
    ts: new Date(NOW - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function approvedRows(n: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: n }, (_, i) => row('approve', i + 1, overrides));
}

afterEach(() => {
  delete process.env.SOCIAL_FREEZE;
});

describe('eligibility — AC#1: eligible: false cases', () => {
  it('7 briefs at 100% approval — not enough briefs yet', () => {
    const result = eligibility(approvedRows(7), TYPE, NOW);
    expect(result.eligible).toBe(false);
    expect(result.briefs).toBe(7);
    expect(result.rejected).toBe(0);
    expect(result.reason).toBe('needs 8');
  });

  it('8 briefs with 1 rejection — a single rejection disqualifies regardless of rate', () => {
    const rows = [...approvedRows(7), row('reject', 8)];
    const result = eligibility(rows, TYPE, NOW);
    expect(result.eligible).toBe(false);
    expect(result.briefs).toBe(8);
    expect(result.rejected).toBe(1);
  });

  it('8 briefs with 1 edit — fails the 95% share at n=8 (zero edits permitted at n=8..19)', () => {
    const rows = [...approvedRows(7), row('edit', 8)];
    const result = eligibility(rows, TYPE, NOW);
    expect(result.eligible).toBe(false);
    expect(result.briefs).toBe(8);
    expect(result.rejected).toBe(0);
    expect(result.approvedPct).toBeLessThan(95);
  });

  it('any type while SOCIAL_FREEZE is set, even with otherwise-qualifying data', () => {
    process.env.SOCIAL_FREEZE = 'true';
    const result = eligibility(approvedRows(8), TYPE, NOW);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('SOCIAL_FREEZE is set');
  });

  it('a type with an existing active grant, even with otherwise-qualifying data (synthesized grant — no signed file needed)', () => {
    const grants = [{ type: TYPE, status: 'active' }];
    const result = eligibility(approvedRows(8), TYPE, NOW, grants);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('already has an active grant');
  });
});

describe('eligibility — AC#2: eligible: true', () => {
  it('exactly 8 briefs, 8 plain approvals, 0 edits, 0 rejections', () => {
    const result = eligibility(approvedRows(8), TYPE, NOW);
    expect(result).toEqual({ eligible: true, briefs: 8, approvedPct: 100, rejected: 0, reason: null });
  });
});

describe('eligibility — AC#3: the Wave 4 gate', () => {
  it('day 0, empty ledger — every one of the five queue-item campaign families is not eligible, no crash, no empty output', () => {
    for (const type of FIVE_FAMILIES) {
      const result = eligibility([], type, NOW);
      expect(result).toBeTruthy();
      expect(result.eligible).toBe(false);
      expect(result.briefs).toBe(0);
      expect(result.approvedPct).toBeNull();
      expect(result.rejected).toBe(0);
      expect(result.reason).toBeTruthy();
    }
  });
});

describe('eligibility — AC#12: no social/autonomy.json present at all', () => {
  it('behaves exactly as if there were no grants — the day-0 state, not an error', () => {
    expect(() => eligibility(approvedRows(8), TYPE, NOW)).not.toThrow();
    const result = eligibility(approvedRows(8), TYPE, NOW);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });
});

describe('eligibility — the 95%/28-day arithmetic', () => {
  it('permits zero edits at n=19 but exactly one at n=20 (spec: the arithmetic, not a rounding choice)', () => {
    const rows19 = [...approvedRows(18), row('edit', 19)];
    expect(eligibility(rows19, TYPE, NOW).eligible).toBe(false);

    const rows20 = [...approvedRows(19), row('edit', 20)];
    const result20 = eligibility(rows20, TYPE, NOW);
    expect(result20.approvedPct).toBe(95);
    expect(result20.eligible).toBe(true);
  });

  it('excludes reddit rows entirely, even when the campaign text would otherwise match', () => {
    const rows = approvedRows(8, { file: 'reddit:some-post-id' });
    const result = eligibility(rows, TYPE, NOW);
    expect(result.briefs).toBe(0);
    expect(result.eligible).toBe(false);
  });

  it('excludes a brief older than the trailing 28-day window', () => {
    const rows = [...approvedRows(7), row('approve', 29)];
    const result = eligibility(rows, TYPE, NOW);
    expect(result.briefs).toBe(7);
  });

  it('does not count a different type\'s briefs toward this one', () => {
    const rows = [...approvedRows(8), row('approve', 1, { campaign: 'mood:chip-poll:example' })];
    const result = eligibility(rows, TYPE, NOW);
    expect(result.briefs).toBe(8);
  });
});

describe('readGrants', () => {
  it('returns [] when the file does not exist — the normal day-0 state, not an error', () => {
    expect(readGrants('C:/definitely/does/not/exist/autonomy.json')).toEqual([]);
  });

  it('returns [] for malformed JSON rather than throwing', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const path = await import('node:path');
    const dir = mkdtempSync(path.join(tmpdir(), 'autonomy-test-'));
    const file = path.join(dir, 'autonomy.json');
    writeFileSync(file, 'not json', 'utf-8');
    expect(() => readGrants(file)).not.toThrow();
    expect(readGrants(file)).toEqual([]);
  });
});

describe('activeGrantFor', () => {
  it('returns null when no grant matches the type', () => {
    expect(activeGrantFor([], TYPE)).toBeNull();
    expect(activeGrantFor([{ type: 'mood:chip-poll', status: 'active' }], TYPE)).toBeNull();
  });

  it('ignores a revoked grant for the same type', () => {
    expect(activeGrantFor([{ type: TYPE, status: 'revoked' }], TYPE)).toBeNull();
  });

  it('finds an active grant for the type', () => {
    const grant = { type: TYPE, status: 'active' };
    expect(activeGrantFor([grant], TYPE)).toBe(grant);
  });
});

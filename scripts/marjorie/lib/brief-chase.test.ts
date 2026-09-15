import { describe, expect, it } from 'vitest';
import { renderDispatchedLine, buildSinceYesterdayLines, DAY_MS } from './brief-sections.mjs';

const now = Date.parse('2026-09-15T12:00:00Z');
const entry = (number: number, days: number, verdict = 'stale-48') => ({
  number, createdAt: new Date(now - 10 * DAY_MS).toISOString(),
  chase: { number, verdict, silenceMs: days * DAY_MS, holder: 'unclaimed', existingHumanAction: null },
});

describe('brief dispatch chase', () => {
  it('keeps the existing summary byte-for-byte with no stale work', () => {
    expect(renderDispatchedLine([entry(7, 1, 'fresh')], now)).toBe('- dispatched: 1 open, oldest 10d (#7)');
    expect(renderDispatchedLine([], now)).toBeNull();
  });
  it('uses silence age, names the PR and active HA, and excludes held/founder-blocked items', () => {
    const stale = entry(7, 5, 'stale-96');
    Object.assign(stale.chase, { holder: 'Austin PR #20 awaiting review', existingHumanAction: 80 });
    const result = renderDispatchedLine([entry(8, 2), stale, entry(9, 9, 'held'), entry(10, 9, 'blocked-on-founder')], now);
    expect(result).toContain('- stalled 2d+: #7 (5d, Austin PR #20 awaiting review, HA #80) · #8 (2d, unclaimed)');
    expect(result?.split('\n')[1]).not.toContain('#9');
    expect(result?.split('\n')[1]).not.toContain('#10');
  });
  it('sorts oldest first, caps at eight, and counts overflow', () => {
    const result = renderDispatchedLine(Array.from({ length: 10 }, (_, i) => entry(i + 1, i + 2)), now);
    const line = result?.split('\n')[1] || '';
    expect(line).toMatch(/^- stalled 2d\+: #10/);
    expect(line).toContain('+2 more');
    expect(line.match(/#\d+/g)).toHaveLength(8);
  });
  it('counts the stalled line separately toward the brief section budget', () => {
    const lines = buildSinceYesterdayLines({ dispatched: [entry(7, 3)], alerts: [], submissions: {}, allPRs: [] }, { merged24: [] }, now);
    expect(lines.some((line: string) => line.startsWith('- stalled 2d+:'))).toBe(true);
    expect(lines.every((line: string) => !line.includes('\n'))).toBe(true);
  });
});

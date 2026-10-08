import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildLadderStanding, discoverTypes, renderLadderStanding } from './ladder-standing.mjs';

const NOW = new Date('2026-09-14T12:00:00Z').getTime();
const FIVE_FAMILIES = ['launch:', 'thread:', 'timeline:', 'mood:', 'heartbeat:'];

function row(campaign: string, action: string, daysAgo: number, overrides: Record<string, unknown> = {}) {
  return {
    file: 'social/queue/2026-09-01-example-x.json',
    campaign,
    action,
    ts: new Date(NOW - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('discoverTypes', () => {
  it('falls back to the bare prefix for every family with no discovered type — all five, even against an empty ledger', () => {
    expect(discoverTypes([])).toEqual(FIVE_FAMILIES);
  });

  it('discovers a real type and leaves the other four families as placeholders', () => {
    const rows = [row('heartbeat:on-this-day:x', 'approve', 1)];
    expect(discoverTypes(rows)).toEqual(['launch:', 'thread:', 'timeline:', 'mood:', 'heartbeat:on-this-day']);
  });

  it('lists more than one discovered type under the same family, sorted, instead of collapsing to a placeholder', () => {
    const rows = [row('heartbeat:era-deep-cut:x', 'approve', 1), row('heartbeat:on-this-day:x', 'approve', 2)];
    expect(discoverTypes(rows)).toEqual(['launch:', 'thread:', 'timeline:', 'mood:', 'heartbeat:era-deep-cut', 'heartbeat:on-this-day']);
  });

  it('ignores reddit rows when discovering types', () => {
    const rows = [row('heartbeat:on-this-day:x', 'approve', 1, { file: 'reddit:abc' })];
    expect(discoverTypes(rows)).toEqual(FIVE_FAMILIES);
  });
});

describe('buildLadderStanding', () => {
  it('computes one eligibility() result per discovered type, including the placeholders', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row('heartbeat:on-this-day:x', 'approve', i + 1));
    const standing = buildLadderStanding(rows, NOW);
    expect(standing).toHaveLength(5);
    const heartbeat = standing.find((s: { type: string }) => s.type === 'heartbeat:on-this-day');
    expect(heartbeat).toMatchObject({ eligible: true, briefs: 8 });
    const launch = standing.find((s: { type: string }) => s.type === 'launch:');
    expect(launch).toMatchObject({ eligible: false, briefs: 0, reason: 'needs 8' });
  });
});

describe('renderLadderStanding — AC#10: every family, eligible or not', () => {
  it('renders a header plus one line per family, mixing eligible and not-eligible types', () => {
    const heartbeatRows = Array.from({ length: 8 }, (_, i) => row('heartbeat:on-this-day:x', 'approve', i + 1));
    const moodRows = Array.from({ length: 4 }, (_, i) => row('mood:chip-poll:x', 'approve', i + 1));
    const standing = buildLadderStanding([...heartbeatRows, ...moodRows], NOW);
    const out = renderLadderStanding(standing);
    expect(out).toContain('**Autonomy ladder standing:**');
    expect(out).toContain('heartbeat:on-this-day — 8 briefs, 100% ✅, eligible');
    expect(out).toContain('mood:chip-poll — 4 briefs, needs 8');
    expect(out).toContain('launch:'); // placeholder family still shown
    expect(out.split('\n')).toHaveLength(6); // header + 5 families
  });

  it('renders one honest sentence, never throws, when standings are missing entirely (older caller)', () => {
    expect(renderLadderStanding(undefined)).toBe('**Autonomy ladder standing:** no campaign families to report yet');
    expect(renderLadderStanding([])).toBe('**Autonomy ladder standing:** no campaign families to report yet');
  });
});

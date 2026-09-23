import { describe, expect, it } from 'vitest';
import {
  blendTierFor,
  reservedBeatsFor,
  isWindingDown,
  buildEventStatus,
  transitionKey,
  WIND_DOWN_MS,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './event-status.mjs';

describe('blendTierFor', () => {
  it('theory is always far, regardless of heat/proximity', () => {
    expect(blendTierFor('theory', undefined)).toBe('far');
  });

  it('countdown within 48h is near', () => {
    expect(blendTierFor('countdown', 1)).toBe('near');
    expect(blendTierFor('countdown', 2)).toBe('near');
  });

  it('countdown beyond 48h is far', () => {
    expect(blendTierFor('countdown', 2.01)).toBe('far');
    expect(blendTierFor('countdown', 10)).toBe('far');
  });

  it('countdown with no parseable daysToResolution fails safe to far', () => {
    expect(blendTierFor('countdown', undefined)).toBe('far');
    expect(blendTierFor('countdown', NaN)).toBe('far');
  });
});

describe('reservedBeatsFor', () => {
  it('near reserves both daily beats', () => {
    expect(reservedBeatsFor('near')).toBe(2);
  });
  it('far reserves one beat', () => {
    expect(reservedBeatsFor('far')).toBe(1);
  });
});

describe('isWindingDown', () => {
  const resolvedAt = '2026-09-01T00:00:00Z';
  const resolvedMs = Date.parse(resolvedAt);

  it('true immediately after resolution', () => {
    expect(isWindingDown(resolvedAt, resolvedMs + 1000)).toBe(true);
  });

  it('true right up to the 36h window edge', () => {
    expect(isWindingDown(resolvedAt, resolvedMs + WIND_DOWN_MS - 1)).toBe(true);
  });

  it('false once the window has fully elapsed', () => {
    expect(isWindingDown(resolvedAt, resolvedMs + WIND_DOWN_MS)).toBe(false);
    expect(isWindingDown(resolvedAt, resolvedMs + WIND_DOWN_MS + 1000)).toBe(false);
  });

  it('false for an unset or unparseable resolvedAt', () => {
    expect(isWindingDown(undefined, resolvedMs)).toBe(false);
    expect(isWindingDown('not-a-date', resolvedMs)).toBe(false);
  });

  it('false for a timestamp in the future relative to now (negative elapsed)', () => {
    expect(isWindingDown(resolvedAt, resolvedMs - 1000)).toBe(false);
  });
});

describe('buildEventStatus', () => {
  const NOW = Date.parse('2026-09-20T00:00:00Z');

  it('normal mode with no candidate and no wind-down context', () => {
    const status = buildEventStatus(undefined, NOW);
    expect(status).toEqual({
      mode: 'normal',
      kind: null,
      id: null,
      windingDown: false,
      blendTier: null,
      reservedBeats: 0,
    });
  });

  it('countdown far out reserves one beat', () => {
    const candidate = {
      kind: 'countdown',
      item: {
        id: 'ci-1',
        countdownTargetAt: new Date(NOW + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    const status = buildEventStatus(candidate, NOW);
    expect(status.mode).toBe('event');
    expect(status.kind).toBe('countdown');
    expect(status.id).toBe('ci-1');
    expect(status.blendTier).toBe('far');
    expect(status.reservedBeats).toBe(1);
    expect(status.daysToResolution).toBeCloseTo(5, 1);
  });

  it('countdown near deadline reserves both beats', () => {
    const candidate = {
      kind: 'countdown',
      item: { id: 'ci-2', countdownTargetAt: new Date(NOW + 12 * 60 * 60 * 1000).toISOString() },
    };
    const status = buildEventStatus(candidate, NOW);
    expect(status.blendTier).toBe('near');
    expect(status.reservedBeats).toBe(2);
  });

  it('theory always reserves one beat regardless of heat', () => {
    const candidate = { kind: 'theory', theory: { id: 'th-1', heat: 9 } };
    const status = buildEventStatus(candidate, NOW);
    expect(status.mode).toBe('event');
    expect(status.kind).toBe('theory');
    expect(status.heat).toBe(9);
    expect(status.blendTier).toBe('far');
    expect(status.reservedBeats).toBe(1);
    expect(status.daysToResolution).toBeUndefined();
  });

  it('no live candidate but within wind-down window stays in event mode with 1 reserved beat', () => {
    const resolvedAt = new Date(NOW - 10 * 60 * 60 * 1000).toISOString(); // 10h ago
    const status = buildEventStatus(undefined, NOW, { kind: 'countdown', id: 'ci-1', resolvedAt });
    expect(status.mode).toBe('event');
    expect(status.windingDown).toBe(true);
    expect(status.kind).toBe('countdown');
    expect(status.id).toBe('ci-1');
    expect(status.reservedBeats).toBe(1);
  });

  it('no live candidate and wind-down window elapsed reverts to normal', () => {
    const resolvedAt = new Date(NOW - 40 * 60 * 60 * 1000).toISOString(); // 40h ago, past 36h window
    const status = buildEventStatus(undefined, NOW, { kind: 'countdown', id: 'ci-1', resolvedAt });
    expect(status.mode).toBe('normal');
    expect(status.windingDown).toBe(false);
    expect(status.reservedBeats).toBe(0);
  });
});

describe('transitionKey', () => {
  it('is stable for equivalent mode/kind/id/windingDown regardless of other fields', () => {
    const a = {
      mode: 'event',
      kind: 'countdown',
      id: 'ci-1',
      windingDown: false,
      heat: 3,
      daysToResolution: 1.2,
    };
    const b = {
      mode: 'event',
      kind: 'countdown',
      id: 'ci-1',
      windingDown: false,
      heat: 99,
      daysToResolution: 999,
    };
    expect(transitionKey(a)).toBe(transitionKey(b));
  });

  it('differs across a normal<->event transition', () => {
    const normal = { mode: 'normal', kind: null, id: null, windingDown: false };
    const event = { mode: 'event', kind: 'theory', id: 'th-1', windingDown: false };
    expect(transitionKey(normal)).not.toBe(transitionKey(event));
  });

  it('differs across a windingDown flip even with the same kind/id', () => {
    const active = { mode: 'event', kind: 'countdown', id: 'ci-1', windingDown: false };
    const windDown = { mode: 'event', kind: 'countdown', id: 'ci-1', windingDown: true };
    expect(transitionKey(active)).not.toBe(transitionKey(windDown));
  });
});

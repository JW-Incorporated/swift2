import { describe, expect, it } from 'vitest';
import {
  expiresAt,
  isTheoryAbandoned,
  CURRENT_ITEM_EXPIRY_DAYS,
  FAN_SIGNAL_EXPIRY_DAYS,
  LIVE_THEORY_EXPIRY_DAYS,
  LIVE_THEORY_ABANDON_QUIET_DAYS,
} from './expiry';

describe('expiresAt', () => {
  it('adds the given number of days to the from-date', () => {
    const from = new Date('2026-08-23T00:00:00.000Z');
    expect(expiresAt(1, from)).toBe('2026-08-24T00:00:00.000Z');
  });

  it('matches the proposal cadence: current_item 90d, fan_signal 30d, live_theory 60d', () => {
    expect(CURRENT_ITEM_EXPIRY_DAYS).toBe(90);
    expect(FAN_SIGNAL_EXPIRY_DAYS).toBe(30);
    expect(LIVE_THEORY_EXPIRY_DAYS).toBe(60);
  });
});

describe('isTheoryAbandoned', () => {
  it('matches the proposal cadence: quiet 45d', () => {
    expect(LIVE_THEORY_ABANDON_QUIET_DAYS).toBe(45);
  });

  it('is false when last seen fewer than 45 days ago', () => {
    const today = new Date('2026-08-23T00:00:00.000Z');
    expect(isTheoryAbandoned('2026-08-01', today)).toBe(false);
  });

  it('is true at exactly 45 days quiet', () => {
    const today = new Date('2026-08-23T00:00:00.000Z');
    expect(isTheoryAbandoned('2026-07-09', today)).toBe(true);
  });

  it('is true well past 45 days quiet', () => {
    const today = new Date('2026-08-23T00:00:00.000Z');
    expect(isTheoryAbandoned('2026-01-01', today)).toBe(true);
  });
});

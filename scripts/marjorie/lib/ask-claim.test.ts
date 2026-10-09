import { describe, expect, it, vi } from 'vitest';
import { STALE_CLAIM_MS, SWEEP_AFTER_MS, isStale, releaseClaim, sweepClaims, takeOver } from './ask-claim.mjs';

const NOW = Date.parse('2026-10-08T12:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();

describe('isStale', () => {
  it('is false for a fresh pending claim and for any receipt, true past the threshold or when unparsable', () => {
    expect(isStale(`claimed ${iso(NOW - 60_000)} run 1-a`, NOW)).toBe(false);
    expect(isStale(`claimed ${iso(NOW - STALE_CLAIM_MS - 1)} run 1-a`, NOW)).toBe(true);
    expect(isStale('issue #12 at 2020-01-01T00:00:00.000Z', NOW)).toBe(false);
    expect(isStale('claimed, filing in progress', NOW)).toBe(true);
  });
});

describe('takeOver', () => {
  const opts = { nowMs: NOW, timeoutMs: 1000, settleMs: 0, sleep: async () => {} };

  it('wins only when the re-read shows its own id (last writer wins)', async () => {
    const gh = vi.fn(async (args: string[]) => {
      if (args[2] === 'PATCH') return { stdout: '{}' };
      return { stdout: JSON.stringify({ description: `claimed ${iso(NOW)} run me-1` }) };
    });
    expect(await takeOver(gh, 'o/r', 'k', { ...opts, owner: 'me-1' })).toBe(true);
  });

  it('loses when a concurrent taker wrote after us', async () => {
    const gh = vi.fn(async (args: string[]) => {
      if (args[2] === 'PATCH') return { stdout: '{}' };
      return { stdout: JSON.stringify({ description: `claimed ${iso(NOW)} run rival-9` }) };
    });
    expect(await takeOver(gh, 'o/r', 'k', { ...opts, owner: 'me-1' })).toBe(false);
  });
});

describe('releaseClaim', () => {
  it('never throws when the delete fails', async () => {
    const gh = vi.fn(async () => { throw new Error('HTTP 500'); });
    await expect(releaseClaim(gh, 'o/r', 'k', 1000)).resolves.toBeUndefined();
  });
});

describe('sweepClaims', () => {
  it('deletes only old receipts whose issue exists; keeps pending and recent ones', async () => {
    const labels = [
      { name: 'loop-claim:old', description: `issue #1 at ${iso(NOW - SWEEP_AFTER_MS - 1000)}` },
      { name: 'loop-claim:new', description: `issue #2 at ${iso(NOW - 1000)}` },
      { name: 'loop-claim:pending', description: `claimed ${iso(NOW - SWEEP_AFTER_MS * 2)} run x-1` },
      { name: 'loop-claim:gone', description: `issue #3 at ${iso(NOW - SWEEP_AFTER_MS - 1000)}` },
      { name: 'bug', description: 'x' },
    ];
    const deleted: string[] = [];
    const gh = vi.fn(async (args: string[]) => {
      if (args[2] === 'DELETE') { deleted.push(decodeURIComponent(args[3].split('/labels/')[1])); return { stdout: '' }; }
      if (args[1].includes('/labels?')) return { stdout: JSON.stringify(labels) };
      const n = Number(args[1].match(/issues\/(\d+)$/)![1]);
      if (n === 3) throw new Error('HTTP 404');
      return { stdout: JSON.stringify({ number: n }) };
    });
    await sweepClaims(gh, 'o/r', { nowMs: NOW, timeoutMs: 1000 });
    expect(deleted).toEqual(['loop-claim:old']);
  });

  it('is best effort: an API failure does not throw', async () => {
    const gh = vi.fn(async () => { throw new Error('HTTP 500'); });
    await expect(sweepClaims(gh, 'o/r', { nowMs: NOW, timeoutMs: 1000 })).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import {
  parseArgs,
  resolveGroups,
  outputFilePath,
  randomDelayMs,
} from './fb-group-export.mjs';

describe('parseArgs', () => {
  it('defaults out-dir to the home Downloads folder', () => {
    const flags = parseArgs(['--profile-dir', 'C:\\profile']);
    expect(flags.profileDir).toBe('C:\\profile');
    expect(flags.profileName).toBe('Default');
    expect(flags.dryRun).toBe(false);
    expect(flags.outDir).toMatch(/Downloads$/);
  });

  it('collects repeated --group flags', () => {
    const flags = parseArgs(['--group', 'a', '--group', 'b']);
    expect(flags.groups).toEqual(['a', 'b']);
  });

  it('parses --dry-run', () => {
    const flags = parseArgs(['--dry-run']);
    expect(flags.dryRun).toBe(true);
  });

  it('has no headless flag at all -- always launches headed, by design', () => {
    const flags = parseArgs(['--headless', '--headless=true']);
    expect(flags).not.toHaveProperty('headless');
  });
});

describe('resolveGroups', () => {
  const checklist = [
    { slug: 'confirmed-a', label: 'A' },
    { slug: 'confirmed-b', label: 'B' },
    { slug: 'candidate-c', label: 'C', candidate: true },
  ];

  it('defaults to every non-candidate checklist row', () => {
    const flags = parseArgs([]);
    const groups = resolveGroups(flags, checklist);
    expect(groups.map((g) => g.slug)).toEqual(['confirmed-a', 'confirmed-b']);
  });

  it('an explicit --group for a confirmed row selects it', () => {
    const flags = parseArgs(['--group', 'confirmed-b']);
    const groups = resolveGroups(flags, checklist);
    expect(groups.map((g) => g.slug)).toEqual(['confirmed-b']);
  });

  it('a candidate row is NEVER eligible, even via an explicit --group', () => {
    const flags = parseArgs(['--group', 'candidate-c']);
    const groups = resolveGroups(flags, checklist);
    expect(groups).toEqual([]);
  });

  it('mixed explicit selection silently drops the candidate entry, keeps the confirmed one', () => {
    const flags = parseArgs(['--group', 'candidate-c', '--group', 'confirmed-a']);
    const groups = resolveGroups(flags, checklist);
    expect(groups.map((g) => g.slug)).toEqual(['confirmed-a']);
  });
});

describe('outputFilePath', () => {
  it('matches the manual-export naming convention fb-<slug>-<date>.html', () => {
    const result = outputFilePath('/tmp/out', 'taylor-swifts-vault', new Date('2026-09-18T00:00:00Z'));
    expect(result).toBe('/tmp/out/fb-taylor-swifts-vault-2026-09-18.html');
  });
});

describe('randomDelayMs', () => {
  it('always returns a value within the mandatory 3-15s human-pacing window', () => {
    for (let i = 0; i < 200; i += 1) {
      const ms = randomDelayMs();
      expect(ms).toBeGreaterThanOrEqual(3000);
      expect(ms).toBeLessThanOrEqual(15000);
    }
  });

  it('is freshly randomized, not a fixed interval', () => {
    const samples = new Set();
    for (let i = 0; i < 50; i += 1) samples.add(randomDelayMs());
    expect(samples.size).toBeGreaterThan(1);
  });

  it('hits both boundary endpoints deterministically under a stubbed RNG', () => {
    const originalRandom = Math.random;
    try {
      Math.random = () => 0;
      expect(randomDelayMs()).toBe(3000);
      Math.random = () => 1 - Number.EPSILON;
      expect(randomDelayMs()).toBe(15000);
    } finally {
      Math.random = originalRandom;
    }
  });
});

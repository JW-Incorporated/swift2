import { describe, expect, it } from 'vitest';
import {
  parseArgs,
  resolveGroups,
  outputFilePath,
  randomDelayMs,
} from './fb-group-export.mjs';

describe('parseArgs', () => {
  it('defaults out-dir to the home Downloads folder and headless to false', () => {
    const flags = parseArgs(['--profile-dir', 'C:\\profile']);
    expect(flags.profileDir).toBe('C:\\profile');
    expect(flags.profileName).toBe('Default');
    expect(flags.headless).toBe(false);
    expect(flags.dryRun).toBe(false);
    expect(flags.outDir).toMatch(/Downloads$/);
  });

  it('collects repeated --group flags', () => {
    const flags = parseArgs(['--group', 'a', '--group', 'b']);
    expect(flags.groups).toEqual(['a', 'b']);
  });

  it('parses --headless=true and --dry-run', () => {
    const flags = parseArgs(['--headless=true', '--dry-run']);
    expect(flags.headless).toBe(true);
    expect(flags.dryRun).toBe(true);
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

  it('an explicit --group list overrides the candidate filter', () => {
    const flags = parseArgs(['--group', 'candidate-c']);
    const groups = resolveGroups(flags, checklist);
    expect(groups.map((g) => g.slug)).toEqual(['candidate-c']);
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
});

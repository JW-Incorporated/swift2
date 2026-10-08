import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MANIFEST_FILE,
  OVERRIDE_LABEL,
  eraSlugs,
  evaluateGate,
  fileEra,
  parseManifest,
  validateManifest,
} from './check-content-ownership.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

// A self-consistent fixture world (real founders/logins, real era slugs).
const FOUNDERS = { joey: ['sffan15-sys'], wyatt: ['wjduvall-cmd'] };
const world = (claims: unknown[]) => ({ version: 1, founders: FOUNDERS, claims });

// Files that touch every era + corpus — the adversarial input for the no-op proof.
const ALL_ERA_FILES = [
  'supabase/seed/content/midnights.mjs',
  'supabase/seed/theories/midnights.mjs',
  'supabase/seed/tracks/midnights.dossiers.mjs',
  'supabase/seed/era-secrets/tortured-poets.mjs',
  'supabase/seed/content/debut.mjs',
];

describe('fileEra — which era a changed path belongs to', () => {
  it('maps per-era seed files (incl. dotted suffixes) to their era', () => {
    expect(fileEra('supabase/seed/content/midnights.mjs')).toBe('midnights');
    expect(fileEra('supabase/seed/tracks/debut.dossiers.mjs')).toBe('debut');
    expect(fileEra('supabase/seed/era-secrets/1989.mjs')).toBe('1989');
    expect(fileEra('supabase/seed/theories/the-life-of-a-showgirl.mjs')).toBe(
      'the-life-of-a-showgirl',
    );
  });
  it('returns null for cross-era, non-corpus, template, and non-seed paths', () => {
    expect(fileEra('supabase/seed/eras-data.mjs')).toBeNull(); // cross-era, no corpus dir
    expect(fileEra('supabase/seed/content/_example.mjs')).toBeNull(); // template
    expect(fileEra('supabase/seed/videos/1989.mjs')).toBeNull(); // corpus not lockable
    expect(fileEra('apps/web/lib/longlive/content-vault.generated.ts')).toBeNull();
    expect(fileEra('docs/agents/runners.md')).toBeNull();
  });
});

describe('evaluateGate — the runtime lock decision', () => {
  // THE HARD SAFETY REQUIREMENT: empty claims => no-op, for ANY files/author.
  it('empty claims is a NO-OP: proceeds even for a non-owner touching every era', () => {
    const res = evaluateGate({
      changedFiles: ALL_ERA_FILES,
      manifest: world([]),
      authorLogin: 'wjduvall-cmd', // the fleet account
      hasOverride: false,
    });
    expect(res.decision).toBe('proceed');
    expect(res.blocked).toEqual([]);
  });

  it('a claimed era touched by a NON-owner without override => hold', () => {
    const res = evaluateGate({
      changedFiles: ['supabase/seed/content/midnights.mjs'],
      manifest: world([{ era: 'midnights', owner: 'joey', claimed: '2026-08-11' }]),
      authorLogin: 'wjduvall-cmd', // fleet, not joey
      hasOverride: false,
    });
    expect(res.decision).toBe('hold');
    expect(res.blocked).toEqual([
      { era: 'midnights', owner: 'joey', files: ['supabase/seed/content/midnights.mjs'] },
    ]);
  });

  it('the OWNER editing their own claimed era => proceed', () => {
    const res = evaluateGate({
      changedFiles: ['supabase/seed/content/midnights.mjs', 'supabase/seed/tracks/midnights.mjs'],
      manifest: world([{ era: 'midnights', owner: 'joey' }]),
      authorLogin: 'sffan15-sys', // joey
      hasOverride: false,
    });
    expect(res.decision).toBe('proceed');
    expect(res.blocked).toEqual([]);
  });

  it('a human-applied override label lets a non-owner through', () => {
    const res = evaluateGate({
      changedFiles: ['supabase/seed/content/midnights.mjs'],
      manifest: world([{ era: 'midnights', owner: 'joey' }]),
      authorLogin: 'wjduvall-cmd',
      hasOverride: true,
    });
    expect(res.decision).toBe('proceed');
    expect(res.blocked.map((b) => b.era)).toEqual(['midnights']); // still reported, just waved through
  });

  it('a claim on one era does not lock a PR touching a DIFFERENT era', () => {
    const res = evaluateGate({
      changedFiles: ['supabase/seed/content/debut.mjs'],
      manifest: world([{ era: 'midnights', owner: 'joey' }]),
      authorLogin: 'wjduvall-cmd',
      hasOverride: false,
    });
    expect(res.decision).toBe('proceed');
    expect(res.blocked).toEqual([]);
  });

  it('reports every blocked era when several are claimed', () => {
    const res = evaluateGate({
      changedFiles: ALL_ERA_FILES,
      manifest: world([
        { era: 'midnights', owner: 'joey' },
        { era: 'tortured-poets', owner: 'joey' },
      ]),
      authorLogin: 'wjduvall-cmd',
      hasOverride: false,
    });
    expect(res.decision).toBe('hold');
    expect(res.blocked.map((b) => b.era).sort()).toEqual(['midnights', 'tortured-poets']);
  });
});

describe('validateManifest — schema gate for build', () => {
  it('the shipped, empty manifest is valid', () => {
    const shipped = parseManifest(read(MANIFEST_FILE));
    expect(validateManifest(shipped)).toEqual([]);
    expect(shipped.claims).toEqual([]); // shipped default is "nothing claimed"
  });

  it('a valid, non-empty claim passes', () => {
    expect(
      validateManifest(world([{ era: 'midnights', owner: 'joey', note: 'gate', claimed: '2026-08-11' }])),
    ).toEqual([]);
  });

  it('rejects an unknown era slug', () => {
    const problems = validateManifest(world([{ era: 'not-an-era', owner: 'joey' }]));
    expect(problems.some((p) => p.includes('not a real era slug'))).toBe(true);
  });

  it('rejects an unknown owner', () => {
    const problems = validateManifest(world([{ era: 'midnights', owner: 'stranger' }]));
    expect(problems.some((p) => p.includes('not a known founder'))).toBe(true);
  });

  it('rejects a duplicate era claim', () => {
    const problems = validateManifest(
      world([
        { era: 'midnights', owner: 'joey' },
        { era: 'midnights', owner: 'wyatt' },
      ]),
    );
    expect(problems.some((p) => p.includes('claimed twice'))).toBe(true);
  });

  it('rejects a bad version and a non-array claims', () => {
    expect(validateManifest({ version: 2, founders: FOUNDERS, claims: [] }).some((p) => p.includes('version'))).toBe(
      true,
    );
    expect(
      validateManifest({ version: 1, founders: FOUNDERS, claims: {} }).some((p) => p.includes('"claims" must be an array')),
    ).toBe(true);
  });

  it('rejects a malformed claimed date', () => {
    const problems = validateManifest(world([{ era: 'midnights', owner: 'joey', claimed: '08/11/2026' }]));
    expect(problems.some((p) => p.includes('ISO date'))).toBe(true);
  });
});

describe('the shipped manifest and its consumers agree', () => {
  it('every founders login is a plausible GitHub handle and eras derive from the real table', () => {
    const shipped = parseManifest(read(MANIFEST_FILE));
    for (const logins of Object.values(shipped.founders as Record<string, string[]>)) {
      for (const l of logins) expect(l).toMatch(/^[A-Za-z0-9-]+$/);
    }
    expect(eraSlugs().has('midnights')).toBe(true);
  });

  it('OVERRIDE_LABEL matches what the workflow greps for', () => {
    const wf = read('.github/workflows/auto-merge-content.yml');
    expect(wf).toContain(OVERRIDE_LABEL);
  });
});

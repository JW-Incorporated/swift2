import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOWLIST_FILE,
  EXCLUDED,
  WORKFLOW_FILE,
  checkAllowlist,
  covers,
  parseAllowlist,
} from './check-automerge-allowlist.mjs';
import { GENERATED, ROOT, SYNC_TARGETS, listGeneratedOnDisk } from './lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

// ── a minimal, self-consistent world the unit tests mutate ────────────────
const OK_ALLOWLIST = [
  '# a comment',
  '',
  'supabase/seed/',
  'apps/web/lib/longlive/a.generated.ts',
  'apps/web/lib/longlive/b.generated.ts  # trailing comment',
].join('\n');
const OK_WORKFLOW = `ALLOWLIST_PATH: ${ALLOWLIST_FILE}\n`;
const OK_TARGETS = [
  { sync: 'scripts/sync-a.mjs', out: 'apps/web/lib/longlive/a.generated.ts' },
  { sync: 'scripts/sync-b.mjs', out: 'apps/web/lib/longlive/b.generated.ts' },
];
const OK_ON_DISK = OK_TARGETS.map((t) => t.out);

// Every path in the fixture world "exists"; directories are the ones ending `/`.
const fakePathKind =
  (dirs: string[], files: string[]) =>
  (p: string): 'file' | 'dir' | null => {
    if (dirs.includes(p)) return 'dir';
    if (files.includes(p)) return 'file';
    return null;
  };
const DEFAULT_KIND = fakePathKind(
  ['supabase/seed', 'social/queue', 'docs/audits'],
  [...OK_ON_DISK, ...OK_TARGETS.map((t) => t.sync)],
);

const realPathKind = (p: string): 'file' | 'dir' | null => {
  try {
    return statSync(join(ROOT, ...p.split('/'))).isDirectory() ? 'dir' : 'file';
  } catch {
    return null;
  }
};

const run = (over: Record<string, unknown> = {}) =>
  checkAllowlist({
    allowlistText: OK_ALLOWLIST,
    workflowText: OK_WORKFLOW,
    generatedOnDisk: OK_ON_DISK,
    syncTargets: OK_TARGETS,
    excluded: {},
    pathKind: DEFAULT_KIND,
    ...over,
  });

describe('parseAllowlist', () => {
  it('drops comments and blank lines, and trims', () => {
    expect(parseAllowlist(OK_ALLOWLIST).map((p) => p.entry)).toEqual([
      'supabase/seed/',
      'apps/web/lib/longlive/a.generated.ts',
      'apps/web/lib/longlive/b.generated.ts',
    ]);
  });

  it('reports 1-based line numbers so errors are citable', () => {
    expect(parseAllowlist('\n\nsupabase/seed/\n')[0].line).toBe(3);
  });
});

describe('covers — mirrors the workflow shell match', () => {
  it('matches a directory prefix', () => {
    expect(covers('supabase/seed/', 'supabase/seed/theories/debut.mjs')).toBe(true);
  });
  it('matches an exact file entry', () => {
    expect(covers('a/b.generated.ts', 'a/b.generated.ts')).toBe(true);
  });
  it('does not match a sibling directory', () => {
    expect(covers('supabase/seed/', 'supabase/migrations/1.sql')).toBe(false);
  });
});

describe('checkAllowlist', () => {
  it('passes a consistent world', () => {
    expect(run()).toEqual([]);
  });

  // The actual regression: a generated file exists but nobody listed it.
  it('fails loudly when a generated file is not covered by any entry', () => {
    const problems = run({
      generatedOnDisk: [...OK_ON_DISK, 'apps/web/lib/longlive/c.generated.ts'],
      syncTargets: [
        ...OK_TARGETS,
        { sync: 'scripts/sync-c.mjs', out: 'apps/web/lib/longlive/c.generated.ts' },
      ],
      pathKind: fakePathKind(
        ['supabase/seed'],
        [
          ...OK_ON_DISK,
          'apps/web/lib/longlive/c.generated.ts',
          'scripts/sync-a.mjs',
          'scripts/sync-b.mjs',
          'scripts/sync-c.mjs',
        ],
      ),
    });
    expect(
      problems.some((p) => p.includes('c.generated.ts') && p.includes('can NEVER auto-merge')),
    ).toBe(true);
  });

  it('fails when a generated file on disk is missing from the manifest', () => {
    const problems = run({
      generatedOnDisk: [...OK_ON_DISK, 'apps/web/lib/longlive/c.generated.ts'],
    });
    expect(problems.some((p) => p.includes('c.generated.ts') && p.includes('SYNC_TARGETS'))).toBe(
      true,
    );
  });

  it('fails when the manifest names a file that no longer exists', () => {
    const problems = run({ generatedOnDisk: [OK_ON_DISK[0]] });
    expect(
      problems.some((p) => p.includes('b.generated.ts') && p.includes('does not exist on disk')),
    ).toBe(true);
  });

  it('fails when a manifest sync script is missing', () => {
    const problems = run({
      pathKind: fakePathKind(['supabase/seed'], [...OK_ON_DISK, 'scripts/sync-a.mjs']),
    });
    expect(problems.some((p) => p.includes('scripts/sync-b.mjs'))).toBe(true);
  });

  it('accepts an explicit, reasoned exclusion instead of an allowlist entry', () => {
    const allowlistText = 'supabase/seed/\napps/web/lib/longlive/a.generated.ts\n';
    expect(
      run({
        allowlistText,
        excluded: { 'apps/web/lib/longlive/b.generated.ts': 'derived from a live API, needs eyes' },
      }),
    ).toEqual([]);
  });

  it('rejects an exclusion with no reason, and a stale one', () => {
    const allowlistText = 'supabase/seed/\napps/web/lib/longlive/a.generated.ts\n';
    expect(
      run({ allowlistText, excluded: { 'apps/web/lib/longlive/b.generated.ts': '' } }).length,
    ).toBeGreaterThan(0);
    expect(
      run({ excluded: { 'apps/web/lib/longlive/gone.generated.ts': 'why' } }).some((p) =>
        p.includes('stale'),
      ),
    ).toBe(true);
  });

  it('rejects a file that is both allowlisted and excluded', () => {
    expect(
      run({ excluded: { 'apps/web/lib/longlive/a.generated.ts': 'why' } }).some((p) =>
        p.includes('pick one'),
      ),
    ).toBe(true);
  });

  it('rejects an entry that does not exist (rename / typo)', () => {
    expect(
      run({ allowlistText: `${OK_ALLOWLIST}\nsupabase/seeds/\n` }).some((p) =>
        p.includes('does not exist'),
      ),
    ).toBe(true);
  });

  it('requires a trailing slash on directory entries', () => {
    const problems = run({
      allowlistText:
        'docs/audits\napps/web/lib/longlive/a.generated.ts\napps/web/lib/longlive/b.generated.ts\n',
    });
    expect(problems.some((p) => p.includes('docs/audits') && p.includes('must end with'))).toBe(
      true,
    );
  });

  it('rejects shell metacharacters, globs, absolute paths and `..`', () => {
    for (const bad of ['supabase/seed/*', '$(rm -rf /)', '/etc/passwd', 'supabase/../.github/']) {
      expect(run({ allowlistText: `${OK_ALLOWLIST}\n${bad}\n` }).length).toBeGreaterThan(0);
    }
  });

  it('rejects duplicate entries', () => {
    expect(
      run({ allowlistText: `${OK_ALLOWLIST}\nsupabase/seed/\n` }).some((p) =>
        p.includes('duplicates line'),
      ),
    ).toBe(true);
  });

  it('refuses an empty allowlist rather than silently gating nothing', () => {
    expect(run({ allowlistText: '# only comments\n' }).some((p) => p.includes('no entries'))).toBe(
      true,
    );
  });

  it('fails if the workflow stops reading the allowlist file', () => {
    expect(
      run({ workflowText: 'name: auto-merge-content\n' }).some((p) =>
        p.includes('exactly one source of truth'),
      ),
    ).toBe(true);
  });

  it('fails if the generated-file list gets re-inlined into the workflow', () => {
    const workflowText = `${OK_WORKFLOW}          apps/web/lib/longlive/tracks.generated.ts\n`;
    expect(run({ workflowText }).some((p) => p.includes('inline copy'))).toBe(true);
  });
});

// ── the real repo must pass, and the specific regression must stay fixed ──
describe('the committed allowlist', () => {
  const allowlistText = read(ALLOWLIST_FILE);

  it('has no problems', () => {
    const problems = checkAllowlist({
      allowlistText,
      workflowText: read(WORKFLOW_FILE),
      generatedOnDisk: listGeneratedOnDisk(),
      syncTargets: SYNC_TARGETS,
      excluded: EXCLUDED,
      pathKind: realPathKind,
    });
    expect(problems).toEqual([]);
  });

  it('covers all five generated vault modules — including the three that were missing', () => {
    const entries = parseAllowlist(allowlistText).map((p) => p.entry);
    for (const f of GENERATED) {
      expect(
        entries.some((e) => covers(e, f)),
        `${f} is not auto-mergeable`,
      ).toBe(true);
    }
    expect(GENERATED).toContain('apps/web/lib/longlive/theories.generated.ts');
    expect(GENERATED).toContain('apps/web/lib/longlive/videos.generated.ts');
    expect(GENERATED).toContain('apps/web/lib/longlive/song-moods.generated.ts');
  });

  it('would let PRs #1891 / #1762 (theory seed + regenerated vault) auto-merge', () => {
    const entries = parseAllowlist(allowlistText).map((p) => p.entry);
    const prFiles = [
      'apps/web/lib/longlive/theories.generated.ts',
      'supabase/seed/theories/speak-now.mjs',
      'supabase/seed/theories/debut.mjs',
    ];
    for (const f of prFiles) {
      expect(
        entries.some((e) => covers(e, f)),
        `${f} blocks auto-merge`,
      ).toBe(true);
    }
  });

  it('still refuses app code, non-social public media, and the merge rules', () => {
    const entries = parseAllowlist(allowlistText).map((p) => p.entry);
    for (const f of [
      'apps/web/app/page.tsx',
      'apps/web/lib/longlive/tracks.ts',
      // Non-social public media stays human-merge — only the social/ subtree
      // was granted (docs/decisions.md 2026-08-11; docs/decisions.md 2026-07-28
      // still governs the rest of apps/web/public/**).
      'apps/web/public/eras/midnights.png',
      'apps/web/public/og-image.png',
      '.github/workflows/auto-merge-content.yml',
      '.github/content-automerge-allowlist.txt',
      'package.json',
    ]) {
      expect(
        entries.some((e) => covers(e, f)),
        `${f} must NOT auto-merge`,
      ).toBe(false);
    }
  });

  it('allows social images (the check-drafts-gated carve-out, docs/decisions.md 2026-08-11)', () => {
    const entries = parseAllowlist(allowlistText).map((p) => p.entry);
    for (const f of [
      'apps/web/public/social/2026-07-17-electric-lady-1.png',
      'apps/web/public/social/library/thread-fashion-screen.png',
    ]) {
      expect(
        entries.some((e) => covers(e, f)),
        `${f} should be auto-mergeable (gated by check-drafts.mjs in the workflow)`,
      ).toBe(true);
    }
    // The grant is exactly the social/ subtree and no broader — a sibling
    // public dir must not be swept in by the prefix.
    expect(entries.some((e) => covers(e, 'apps/web/public/socialite/x.png'))).toBe(false);
  });
});

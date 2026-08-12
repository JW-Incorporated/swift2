import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOWLIST_FILE,
  EXCLUDED,
  NEVER_ALLOWLIST,
  NEVER_ALLOWLIST_EXCEPTIONS,
  WORKFLOW_FILE,
  barredPrefixes,
  checkAllowlist,
  covers,
  overlaps,
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
    expect(
      run({ allowlistText: '# only comments\n' }).some((p) => p.includes('no allow entries')),
    ).toBe(true);
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

// ── DENY (`!`) prefixes: the app-code widening (2026-08-11) ───────────────
describe('deny (`!`) prefixes', () => {
  // A world where the app dirs exist, so a broad app allow is "real".
  const APP_KIND = fakePathKind(
    ['supabase/seed', 'apps/web/app', 'apps/web/components', 'apps/web/lib', 'packages'],
    [...OK_ON_DISK, ...OK_TARGETS.map((t) => t.sync)],
  );
  // A workflow that reads the allowlist AND handles deny_prefixes.
  const APP_WORKFLOW = `${OK_WORKFLOW}          deny_prefixes=$(printf '%s\\n' "$allowed" | grep '^!')\n`;
  const appRun = (allowlistText: string, over: Record<string, unknown> = {}) =>
    run({ allowlistText, workflowText: APP_WORKFLOW, pathKind: APP_KIND, ...over });

  it('parseAllowlist marks deny lines and strips the `!`', () => {
    expect(parseAllowlist('apps/web/app/\n!apps/web/app/api/\n')).toEqual([
      { entry: 'apps/web/app/', line: 1, deny: false },
      { entry: 'apps/web/app/api/', line: 2, deny: true },
    ]);
  });

  it('a deny fully covering a barred area clears the self-amendment bar for a broad allow', () => {
    // Without denies, `apps/web/app/` is barred because it covers apps/web/app/api/.
    expect(barredPrefixes('apps/web/app/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS)).toContain(
      'apps/web/app/api/',
    );
    // Denying every barred subtree clears it.
    expect(
      barredPrefixes('apps/web/app/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS, [
        'apps/web/app/api/',
        'apps/web/app/privacy/',
        'apps/web/app/terms/',
      ]),
    ).toEqual([]);
  });

  it('a deny covering only PART of a barred area does NOT clear the bar', () => {
    // apps/web/public/ is barred; denying only its social/ slice leaves the rest.
    expect(
      barredPrefixes('apps/web/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS, [
        'apps/web/public/social/',
      ]),
    ).toContain('apps/web/public/');
  });

  it('accepts a broad app allow when its barred subtrees are denied', () => {
    const allowlistText = [
      'supabase/seed/',
      'apps/web/lib/longlive/a.generated.ts',
      'apps/web/lib/longlive/b.generated.ts',
      'apps/web/app/',
      'apps/web/components/',
      'apps/web/lib/',
      'packages/',
      '!apps/web/app/api/',
      '!apps/web/app/privacy/',
      '!apps/web/app/terms/',
    ].join('\n');
    expect(appRun(allowlistText)).toEqual([]);
  });

  it('rejects the broad app allow when the deny carve-out is missing', () => {
    const allowlistText =
      'supabase/seed/\napps/web/lib/longlive/a.generated.ts\napps/web/lib/longlive/b.generated.ts\napps/web/app/\n';
    expect(
      appRun(allowlistText).some((p) => p.includes('apps/web/app/api/') && p.includes('NEVER')),
    ).toBe(true);
  });

  it('rejects a path listed as BOTH an allow and a deny', () => {
    const allowlistText =
      'supabase/seed/\napps/web/lib/longlive/a.generated.ts\napps/web/lib/longlive/b.generated.ts\napps/web/app/\n!apps/web/app/\n';
    expect(appRun(allowlistText).some((p) => p.includes('BOTH an allow and a deny'))).toBe(true);
  });

  it('fails when the workflow lacks deny_prefixes handling but denies exist', () => {
    const allowlistText =
      'supabase/seed/\napps/web/lib/longlive/a.generated.ts\napps/web/lib/longlive/b.generated.ts\n!apps/web/app/api/\n';
    // default OK_WORKFLOW has no deny_prefixes
    expect(run({ allowlistText, pathKind: APP_KIND }).some((p) => p.includes('deny_prefixes'))).toBe(
      true,
    );
  });

  it('refuses a deny-only allowlist (no allow prefixes)', () => {
    expect(appRun('!apps/web/app/api/\n').some((p) => p.includes('no allow entries'))).toBe(true);
  });
});

// ── The runtime allow/deny decision the enable job computes, unit-proven on
//    the REAL shipped allowlist (a file is auto-mergeable iff it matches an
//    allow prefix and no deny prefix — exactly the shell loop). ──────────────
describe('runtime allow/deny matching on the committed allowlist', () => {
  const parsed = parseAllowlist(read(ALLOWLIST_FILE));
  const allow = parsed.filter((p) => !p.deny).map((p) => p.entry);
  const deny = parsed.filter((p) => p.deny).map((p) => p.entry);
  const mergeable = (f: string) => allow.some((a) => f.startsWith(a)) && !deny.some((d) => f.startsWith(d));

  it('app components / lib / pages and shared packages auto-merge', () => {
    expect(mergeable('apps/web/components/VaultReader.tsx')).toBe(true);
    expect(mergeable('apps/web/lib/utils.ts')).toBe(true);
    expect(mergeable('apps/web/app/vault/page.tsx')).toBe(true);
    expect(mergeable('apps/web/app/page.tsx')).toBe(true);
    expect(mergeable('packages/core/src/map.ts')).toBe(true);
    expect(mergeable('packages/shared/src/vault-nav.ts')).toBe(true);
  });

  it('API routes, legal pages, migrations, and the gate itself do NOT', () => {
    expect(mergeable('apps/web/app/api/feedback/route.ts')).toBe(false);
    expect(mergeable('apps/web/app/privacy/page.tsx')).toBe(false);
    expect(mergeable('apps/web/app/terms/page.tsx')).toBe(false);
    expect(mergeable('supabase/migrations/003_x.sql')).toBe(false);
    expect(mergeable('.github/workflows/auto-merge-content.yml')).toBe(false);
    expect(mergeable('.github/content-automerge-allowlist.txt')).toBe(false);
    expect(mergeable('scripts/check-automerge-allowlist.mjs')).toBe(false);
    expect(mergeable('package.json')).toBe(false);
    expect(mergeable('apps/web/public/hero.png')).toBe(false);
  });

  it('the checker-gated social image carve-out still matches (path level)', () => {
    expect(mergeable('apps/web/public/social/queue-item.png')).toBe(true);
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

  it('now MERGES app code (widened 2026-08-11) but still refuses the gate, legal, API, and non-social images', () => {
    const parsed = parseAllowlist(allowlistText);
    const allow = parsed.filter((p) => !p.deny).map((p) => p.entry);
    const deny = parsed.filter((p) => p.deny).map((p) => p.entry);
    const mergeable = (f: string) => allow.some((e) => covers(e, f)) && !deny.some((d) => covers(d, f));

    // Widened: app code now auto-merges on full green (docs/decisions.md 2026-08-11).
    for (const f of ['apps/web/app/page.tsx', 'apps/web/lib/longlive/tracks.ts', 'packages/core/src/map.ts']) {
      expect(mergeable(f), `${f} should now auto-merge`).toBe(true);
    }
    // Still human-only: the gate itself, API/data layer, legal, and public
    // media outside the one carved-out social directory.
    for (const f of [
      'apps/web/app/api/feedback/route.ts',
      'apps/web/app/privacy/page.tsx',
      'apps/web/public/eras/red.png',
      'apps/web/public/favicon.ico',
      '.github/workflows/auto-merge-content.yml',
      '.github/content-automerge-allowlist.txt',
      'package.json',
    ]) {
      expect(mergeable(f), `${f} must NOT auto-merge`).toBe(false);
    }
  });

  // Flipped 2026-08-11 (docs/decisions.md, same date): this test used to
  // assert the opposite — that apps/web/public/social/2026-07-17-electric-
  // lady-1.png could never be covered by any allowlist entry, per the
  // 2026-07-28 "a bot-picked image gets human eyes" policy. A same-day
  // decisions.md entry (approved by Joey; Wyatt verbally, relayed by Joey
  // 2026-08-11 evening) carves out `apps/web/public/social/` specifically,
  // superseding 2026-07-28 for that one directory: a queue item's own
  // dedicated photo, already validated by check-drafts.mjs's media rules,
  // can now auto-merge alongside its queue JSON.
  it('covers a real committed image under the carved-out apps/web/public/social/ directory', () => {
    const entries = parseAllowlist(allowlistText).map((p) => p.entry);
    expect(entries.some((e) => covers(e, 'apps/web/public/social/2026-07-17-electric-lady-1.png'))).toBe(true);
  });

  // What this file's `covers()` CANNOT express, and does not try to: a path
  // being allowlisted is necessary but not sufficient for
  // apps/web/public/social/** specifically — the `enable` job in
  // .github/workflows/auto-merge-content.yml applies its own per-file
  // constraints at runtime (extension must be .png/.jpg/.jpeg, size ≤1.5MB,
  // git blob type must be "file" — not a symlink/submodule) BEFORE treating
  // a covered image path as mergeable, since a plain path-prefix file has no
  // way to express file properties. A non-image extension, an oversized
  // file, or a symlink under this same directory therefore still declines —
  // enforced by that workflow step, not by this allowlist file or this
  // test suite (which only covers the allowlist FILE's own format and
  // coverage rules, not PR-time file content).
});

// ── the self-amendment bar (2026-08-11) ───────────────────────────────────
describe('NEVER_ALLOWLIST — the self-amendment bar', () => {
  it('overlaps() matches in both directions', () => {
    // entry sits inside a barred area
    expect(overlaps('docs/agents/austin.md', 'docs/agents/')).toBe(true);
    // entry is broad enough to swallow a barred area
    expect(overlaps('docs/', 'docs/agents/')).toBe(true);
    expect(overlaps('', '.github/')).toBe(true);
    // unrelated siblings do not
    expect(overlaps('docs/audits/', 'docs/agents/')).toBe(false);
    expect(overlaps('supabase/seed/', 'supabase/migrations/')).toBe(false);
  });

  it('refuses every barred prefix, by name, with its reason', () => {
    for (const [prefix, reason] of Object.entries(NEVER_ALLOWLIST)) {
      const problems = run({
        allowlistText: `supabase/seed/\n${prefix}\n`,
        generatedOnDisk: [],
        syncTargets: [],
        pathKind: () => 'dir',
      });
      expect(problems.join('\n'), prefix).toContain('may NEVER be auto-merged');
      expect(problems.join('\n'), prefix).toContain(reason);
    }
  });

  it('refuses a broad entry that would swallow a barred area', () => {
    // The realistic mistake: someone allowlists `docs/` to unblock doc chores
    // and silently hands away the charters and the decision log with it.
    const problems = run({
      allowlistText: 'docs/\n',
      generatedOnDisk: [],
      syncTargets: [],
      pathKind: () => 'dir',
    });
    expect(problems.join('\n')).toContain('docs/agents/');
    expect(problems.join('\n')).toContain('docs/decisions.md');
  });

  it('refuses a barred path even when it exists on disk (authority, not typo)', () => {
    const problems = run({
      allowlistText: '.github/workflows/auto-merge-content.yml\n',
      generatedOnDisk: [],
      syncTargets: [],
      pathKind: () => 'file',
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('must itself always need a human');
    expect(problems[0]).not.toContain('does not exist');
  });

  it('leaves legitimate content paths alone', () => {
    for (const entry of ['supabase/seed/', 'social/queue/', 'docs/audits/']) {
      const problems = run({
        allowlistText: `${entry}\n`,
        generatedOnDisk: [],
        syncTargets: [],
        pathKind: () => 'dir',
      });
      expect(problems, entry).toEqual([]);
    }
  });

  it('every bar carries a real reason — the set has to stay arguable', () => {
    for (const [prefix, reason] of Object.entries(NEVER_ALLOWLIST)) {
      expect(reason.length, prefix).toBeGreaterThan(25);
    }
  });

  it('the committed allowlist satisfies the bar (after the social exception and the app-code denies)', () => {
    const parsed = parseAllowlist(read(ALLOWLIST_FILE));
    const denies = parsed.filter((p) => p.deny).map((p) => p.entry);
    for (const { entry } of parsed.filter((p) => !p.deny)) {
      expect(
        barredPrefixes(entry, NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS, denies),
        `${entry} is barred`,
      ).toEqual([]);
    }
  });
});

// ── the one narrowing: the apps/web/public/social/ carve-out ───────────────
describe('NEVER_ALLOWLIST_EXCEPTIONS — the social-image narrowing', () => {
  it('exempts the exact granted subtree and nothing broader or adjacent', () => {
    // the granted subtree passes the bar
    expect(barredPrefixes('apps/web/public/social/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS)).toEqual([]);
    // the whole public dir does NOT — an exception narrows, it does not open
    expect(
      barredPrefixes('apps/web/public/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS),
    ).toContain('apps/web/public/');
    // a sibling that merely shares a prefix string is NOT swept in
    expect(
      barredPrefixes('apps/web/public/socialite/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS),
    ).toContain('apps/web/public/');
    // an unrelated public dir stays barred
    expect(
      barredPrefixes('apps/web/public/eras/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS),
    ).toContain('apps/web/public/');
    // and a broad `apps/` entry, which overlaps the bar, is not exempted either
    expect(
      barredPrefixes('apps/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS),
    ).toContain('apps/web/public/');
  });

  it('an exception can only narrow the bar it lives inside, never a different one', () => {
    // Every exception key must itself sit inside some barred prefix — otherwise
    // it would be a free-floating grant, not a narrowing.
    for (const x of Object.keys(NEVER_ALLOWLIST_EXCEPTIONS)) {
      const inside = Object.keys(NEVER_ALLOWLIST).some((p) => x.startsWith(p));
      expect(inside, `${x} must live inside a barred prefix`).toBe(true);
    }
  });

  it('the committed allowlist actually exercises the exception (social is present and clears the bar)', () => {
    const entries = parseAllowlist(read(ALLOWLIST_FILE)).map((p) => p.entry);
    expect(entries).toContain('apps/web/public/social/');
    expect(
      barredPrefixes('apps/web/public/social/', NEVER_ALLOWLIST, NEVER_ALLOWLIST_EXCEPTIONS),
    ).toEqual([]);
  });

  it('checkAllowlist lets the social entry through but still bars the rest of public/', () => {
    const base = 'supabase/seed/\napps/web/public/social/\n';
    const kind = (p: string): 'file' | 'dir' | null =>
      ['supabase/seed', 'apps/web/public/social', 'apps/web/public/eras'].includes(p) ? 'dir' : null;
    expect(
      run({ allowlistText: base, generatedOnDisk: [], syncTargets: [], pathKind: kind }),
    ).toEqual([]);
    const withEras = `${base}apps/web/public/eras/\n`;
    const problems = run({ allowlistText: withEras, generatedOnDisk: [], syncTargets: [], pathKind: kind });
    expect(problems.some((p) => p.includes('apps/web/public/eras/') && p.includes('may NEVER'))).toBe(true);
  });
});

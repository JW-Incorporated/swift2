// tree-approve-gate: the decision logic behind social-tree-approve.yml. Pure
// evaluateGate cases, plus the git layer against a REAL throwaway repo (symlink,
// local-diff-tied-to-SHA, stamp-diff), plus API-metadata assembly.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_MEDIA_BYTES,
  TREE_COMMIT_AUTHORS,
  TREE_DISPATCHERS,
  TREE_PR_AUTHORS,
  buildMeta,
  collectChanges,
  evaluateGate,
  isTreeDraftRef,
  normalizePrNumber,
  parseNameStatusZ,
  runGate,
  verifyStampDiff,
} from './tree-approve-gate.mjs';

const SHA = 'a'.repeat(40);
const QUEUE = 'social/queue/2026-10-10-a-x.json';
const PNG = 'apps/web/public/social/library/photos/a.png';

const goodPr = { state: 'open', base: 'main', headRef: 'tree/draft/2026-10-09', headSha: SHA, author: 'claude[bot]', cross: false };
const draft = { platform: 'x', body: 'hi', media: ['/social/library/photos/a.png'] };

function input(over: Record<string, unknown> = {}) {
  return {
    actor: 'sffan15-sys',
    pr: goodPr,
    commitAuthors: ['github-actions[bot]'],
    changes: [
      { status: 'A', path: QUEUE, mode: '100644', size: 900 },
      { status: 'A', path: PNG, mode: '100644', size: 40000 },
    ],
    drafts: { [QUEUE]: draft } as Record<string, unknown>,
    ...over,
  };
}
const gate = (over: Record<string, unknown> = {}) => evaluateGate(input(over) as never);
const problemsOf = (over: Record<string, unknown> = {}) => gate(over).problems.join('\n');

describe('evaluateGate — the allowed shape', () => {
  it('passes a Tree draft PR: one queue file + the png it references', () => {
    const r = gate();
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.queueFiles).toEqual([QUEUE]);
    expect(r.mediaFiles).toEqual([PNG]);
  });

  it('allows a media-free draft and a modify of an existing queue file', () => {
    const r = gate({ changes: [{ status: 'M', path: QUEUE, mode: '100755', size: 5 }], drafts: { [QUEUE]: { platform: 'x', body: 'hi' } } });
    expect(r.ok).toBe(true);
  });

  it('allows a card sidecar json only next to a referenced card png', () => {
    const card = 'apps/web/public/social/cards/c1.png';
    const side = 'apps/web/public/social/cards/c1.json';
    const changes = [
      { status: 'A', path: QUEUE, mode: '100644', size: 9 },
      { status: 'A', path: card, mode: '100644', size: 9 },
      { status: 'A', path: side, mode: '100644', size: 200 },
    ];
    expect(gate({ changes, drafts: { [QUEUE]: { media: ['/social/cards/c1.png'] } } }).ok).toBe(true);
    expect(problemsOf({ changes, drafts: { [QUEUE]: { media: ['/social/cards/other.png'] } } })).toMatch(/sidecar of a referenced card/);
  });
});

describe('evaluateGate — H1 media allowlist negatives', () => {
  it('refuses a symlink, a submodule, and any non-regular mode', () => {
    for (const mode of ['120000', '160000-commit', '040000-tree', 'missing', '']) {
      const r = gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status: 'A', path: PNG, mode, size: 10 }] });
      expect(r.ok, mode).toBe(false);
      expect(r.problems.join(), mode).toMatch(/not a regular file blob/);
    }
  });

  it('refuses an .svg / .html / .js / no-extension / uppercase-extension file under apps/web/public/social/', () => {
    for (const p of ['apps/web/public/social/x.svg', 'apps/web/public/social/x.html', 'apps/web/public/social/x.js', 'apps/web/public/social/noext', 'apps/web/public/social/X.PNG', 'apps/web/public/social/x.png.html']) {
      const r = gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status: 'A', path: p, mode: '100644', size: 10 }] });
      expect(r.ok, p).toBe(false);
      expect(r.problems.join(), p).toMatch(/refusing|sidecar/);
    }
  });

  it('refuses an oversize image (> 1.5MB) but accepts exactly 1.5MB', () => {
    const big = gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status: 'A', path: PNG, mode: '100644', size: MAX_MEDIA_BYTES + 1 }] });
    expect(big.ok).toBe(false);
    expect(big.problems.join()).toMatch(/1\.5MB/);
    expect(gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status: 'A', path: PNG, mode: '100644', size: MAX_MEDIA_BYTES }] }).ok).toBe(true);
  });

  it('refuses an image no stamped draft references', () => {
    const r = gate({ drafts: { [QUEUE]: { platform: 'x', body: 'hi', media: ['/social/library/photos/other.png'] } } });
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/not referenced by any draft/);
  });

  it('refuses a draft whose media path tries to escape (reference does not count)', () => {
    const r = gate({ drafts: { [QUEUE]: { media: ['/social/../../etc/passwd.png'] } } });
    expect(r.ok).toBe(false);
  });
});

describe('evaluateGate — H2 paths and statuses', () => {
  it('refuses code, workflows, docs, other social dirs and path tricks', () => {
    for (const p of ['scripts/social/x.mjs', '.github/workflows/x.yml', 'social/posted/a.json', 'social/queue/sub/a.json', 'social/queue/a.txt', 'apps/web/public/other/a.png', 'social/queue/../../x.json', '/etc/x', 'social/queue/a\\b.json']) {
      const r = gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status: 'A', path: p, mode: '100644', size: 10 }] });
      expect(r.ok, p).toBe(false);
    }
  });

  it('refuses deleted, renamed, copied and type-changed files', () => {
    for (const status of ['D', 'R', 'C', 'T', 'U']) {
      const r = gate({ changes: [{ status: 'A', path: QUEUE, mode: '100644', size: 9 }, { status, path: 'social/queue/b.json', mode: '100644', size: 9 }] });
      expect(r.ok, status).toBe(false);
      expect(r.problems.join(), status).toMatch(/only added\/modified/);
    }
  });

  it('refuses an empty change set and a PR with no queue draft', () => {
    expect(gate({ changes: [] }).ok).toBe(false);
    expect(problemsOf({ changes: [{ status: 'A', path: PNG, mode: '100644', size: 9 }] })).toMatch(/no social\/queue/);
  });

  it('refuses an unreadable or non-object draft', () => {
    expect(gate({ drafts: { [QUEUE]: null } }).ok).toBe(false);
    expect(gate({ drafts: { [QUEUE]: [1] } }).ok).toBe(false);
  });
});

describe('evaluateGate — H3 identities and refs', () => {
  it('pins the committed identity constants (Tree gateway = sffan15-sys; routines = the Claude app)', () => {
    expect(TREE_DISPATCHERS).toEqual(['sffan15-sys']);
    expect(TREE_PR_AUTHORS).toEqual(['claude[bot]', 'sffan15-sys']);
    expect(TREE_COMMIT_AUTHORS).toEqual(['claude[bot]', 'github-actions[bot]', 'sffan15-sys']);
    for (const excluded of ['wjduvall-cmd', 'dependabot[bot]', 'copilot']) {
      expect([...TREE_DISPATCHERS, ...TREE_PR_AUTHORS, ...TREE_COMMIT_AUTHORS]).not.toContain(excluded);
    }
  });

  it('refuses a foreign dispatcher', () => {
    for (const actor of ['wjduvall-cmd', 'github-actions[bot]', 'claude[bot]', 'dependabot[bot]', '', undefined]) {
      expect(gate({ actor }).ok, String(actor)).toBe(false);
    }
  });

  it('refuses a foreign PR author', () => {
    for (const author of ['wjduvall-cmd', 'dependabot[bot]', 'someone-else', undefined]) {
      expect(gate({ pr: { ...goodPr, author } }).ok, String(author)).toBe(false);
    }
  });

  it('refuses a foreign or unresolved commit author, even among allowed ones', () => {
    expect(gate({ commitAuthors: ['claude[bot]', 'wjduvall-cmd'] }).ok).toBe(false);
    expect(gate({ commitAuthors: ['claude[bot]', null] }).ok).toBe(false);
    expect(problemsOf({ commitAuthors: ['stranger'] })).toMatch(/commit author "stranger"/);
    expect(gate({ commitAuthors: [] }).ok).toBe(false);
  });

  it('refuses a non tree/draft/* ref (and traversal tricks)', () => {
    for (const headRef of ['feature/x', 'tree/plan/2026-10-09', 'tree/strategy/x', 'tree/draft/', 'tree/draft', 'tree/draft/../main', 'tree/draftx/y', 'tree/draft/a b', 'xtree/draft/a']) {
      expect(gate({ pr: { ...goodPr, headRef } }).ok, headRef).toBe(false);
      expect(isTreeDraftRef(headRef), headRef).toBe(false);
    }
    expect(isTreeDraftRef('tree/draft/2026-10-09')).toBe(true);
    expect(isTreeDraftRef('tree/draft/2026-10-09/a')).toBe(true);
  });

  it('refuses a fork, a closed PR, a non-main base and a short head sha', () => {
    expect(gate({ pr: { ...goodPr, cross: true } }).ok).toBe(false);
    expect(gate({ pr: { ...goodPr, state: 'closed' } }).ok).toBe(false);
    expect(gate({ pr: { ...goodPr, base: 'release' } }).ok).toBe(false);
    expect(gate({ pr: { ...goodPr, headSha: 'abc' } }).ok).toBe(false);
  });
});

describe('normalizePrNumber (L8)', () => {
  it('strips leading zeros and rejects everything that is not plain digits', () => {
    expect(normalizePrNumber('007')).toBe('7');
    expect(normalizePrNumber('5479')).toBe('5479');
    for (const bad of ['0', '00', '', 'abc', '1e3', ' 5', '5 ', '-5', '5;ls', '123456789', '0x10']) {
      expect(() => normalizePrNumber(bad), bad).toThrow();
    }
  });
});

describe('parseNameStatusZ', () => {
  it('parses NUL-separated status/path pairs and rejects odd output', () => {
    expect(parseNameStatusZ('A\0a.json\0M\0b.json\0')).toEqual([
      { status: 'A', path: 'a.json' },
      { status: 'M', path: 'b.json' },
    ]);
    expect(() => parseNameStatusZ('A\0')).toThrow();
  });
});

describe('buildMeta', () => {
  it('assembles state, authors (null when unresolved) and merge base from API reads', () => {
    const calls: string[] = [];
    const ghApi = (p: string) => {
      calls.push(p);
      if (p.includes('/commits')) return [{ author: { login: 'claude[bot]' } }, { author: null }];
      if (p.includes('/compare/')) return { merge_base_commit: { sha: 'b'.repeat(40) } };
      return { state: 'open', base: { ref: 'main', repo: { full_name: 'o/r' } }, head: { ref: 'tree/draft/x', sha: SHA, repo: { full_name: 'o/r' } }, user: { login: 'claude[bot]' } };
    };
    const meta = buildMeta({ repo: 'o/r', pr: '5', ghApi });
    expect(meta).toEqual({
      pr: { state: 'open', base: 'main', headRef: 'tree/draft/x', headSha: SHA, author: 'claude[bot]', cross: false },
      commitAuthors: ['claude[bot]', null],
      mergeBase: 'b'.repeat(40),
    });
    expect(calls.find((c) => c.includes('/compare/'))).toContain(`main...${SHA}`);
  });

  it('flags a fork (or deleted head repo) as cross-repository', () => {
    const ghApi = (p: string) =>
      p.includes('/commits') ? [] : p.includes('/compare/') ? { merge_base_commit: { sha: 'b'.repeat(40) } } : { state: 'open', base: { ref: 'main', repo: { full_name: 'o/r' } }, head: { ref: 'x', sha: SHA, repo: null }, user: { login: 'u' } };
    expect(buildMeta({ repo: 'o/r', pr: '5', ghApi }).pr.cross).toBe(true);
  });
});

// ── the git layer, against a real repo ───────────────────────────────────────
let repo: string;
const g = (...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', ...args], { cwd: repo, encoding: 'utf8' }).trim();
function put(rel: string, content: string | Buffer) {
  const abs = path.join(repo, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  g('add', '--', rel);
}
function commit(msg: string) {
  g('commit', '-q', '-m', msg);
  return g('rev-parse', 'HEAD');
}
const meta = (headSha: string) => ({ pr: { ...goodPr, headSha }, commitAuthors: ['github-actions[bot]'] });

beforeEach(() => {
  repo = mkdtempSync(path.join(tmpdir(), 'tree-gate-'));
  g('init', '-q', '-b', 'main');
  put('README.md', 'base');
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('git layer (real repo)', () => {
  it('a clean draft + referenced png passes; the diff is computed from the pinned SHAs', () => {
    const base = commit('base');
    put(QUEUE, JSON.stringify(draft));
    put(PNG, Buffer.alloc(100, 1));
    const head = commit('draft');
    const r = runGate({ actor: 'sffan15-sys', meta: meta(head), baseSha: base, headSha: head, cwd: repo });
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('H2: a later push (the race) is NOT in the pinned head, and IS caught when the head moves', () => {
    const base = commit('base');
    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi' }));
    const pinned = commit('draft');
    put('scripts/evil.mjs', 'process.exit(0)');
    const raced = commit('sneaky');
    expect(runGate({ actor: 'sffan15-sys', meta: meta(pinned), baseSha: base, headSha: pinned, cwd: repo }).ok).toBe(true);
    const later = runGate({ actor: 'sffan15-sys', meta: meta(raced), baseSha: base, headSha: raced, cwd: repo });
    expect(later.ok).toBe(false);
    expect(later.problems.join()).toMatch(/scripts\/evil\.mjs/);
  });

  it('refuses a real symlink (mode 120000) posing as an image', () => {
    const base = commit('base');
    put(QUEUE, JSON.stringify(draft));
    const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: repo, input: '../../../../etc/passwd', encoding: 'utf8' }).trim();
    g('update-index', '--add', '--cacheinfo', `120000,${blob},${PNG}`);
    const head = commit('symlink');
    const changes = collectChanges(base, head, { cwd: repo });
    expect(changes.find((c: { path: string }) => c.path === PNG)).toMatchObject({ mode: '120000' });
    const r = runGate({ actor: 'sffan15-sys', meta: meta(head), baseSha: base, headSha: head, cwd: repo });
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/not a regular file blob/);
  });

  it('refuses a real submodule entry and a real oversize png and a real svg', () => {
    const base = commit('base');
    put(QUEUE, JSON.stringify(draft));
    g('update-index', '--add', '--cacheinfo', `160000,${'c'.repeat(40)},${PNG}`);
    const sub = commit('submodule');
    expect(runGate({ actor: 'sffan15-sys', meta: meta(sub), baseSha: base, headSha: sub, cwd: repo }).ok).toBe(false);

    g('reset', '-q', '--hard', base);
    put(QUEUE, JSON.stringify(draft));
    put(PNG, Buffer.alloc(MAX_MEDIA_BYTES + 1, 2));
    const big = commit('big');
    expect(runGate({ actor: 'sffan15-sys', meta: meta(big), baseSha: base, headSha: big, cwd: repo }).problems.join()).toMatch(/1\.5MB/);

    g('reset', '-q', '--hard', base);
    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi', media: ['/social/library/photos/a.svg'] }));
    put('apps/web/public/social/library/photos/a.svg', '<svg onload="alert(1)"/>');
    const svg = commit('svg');
    expect(runGate({ actor: 'sffan15-sys', meta: meta(svg), baseSha: base, headSha: svg, cwd: repo }).problems.join()).toMatch(/refusing/);
  });

  it('refuses an unreferenced real png, a foreign author, and a non-tree ref', () => {
    const base = commit('base');
    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi' }));
    put(PNG, Buffer.alloc(10, 3));
    const head = commit('unreferenced');
    expect(runGate({ actor: 'sffan15-sys', meta: meta(head), baseSha: base, headSha: head, cwd: repo }).problems.join()).toMatch(/not referenced/);
    const foreign = { pr: { ...goodPr, headSha: head }, commitAuthors: ['wjduvall-cmd'] };
    expect(runGate({ actor: 'sffan15-sys', meta: foreign, baseSha: base, headSha: head, cwd: repo }).ok).toBe(false);
    const wrongRef = { pr: { ...goodPr, headSha: head, headRef: 'feature/x' }, commitAuthors: ['claude[bot]'] };
    expect(runGate({ actor: 'sffan15-sys', meta: wrongRef, baseSha: base, headSha: head, cwd: repo }).ok).toBe(false);
  });

  it('H2: verifyStampDiff accepts a stamp commit that changes only the queue files, and rejects anything else', () => {
    commit('base');
    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi' }));
    const head = commit('draft');
    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi', approval: { v: 4 } }));
    const stamp = commit('stamp');
    expect(verifyStampDiff(head, stamp, [QUEUE], { cwd: repo })).toEqual({ ok: true, problems: [] });

    put(QUEUE, JSON.stringify({ platform: 'x', body: 'hi', approval: { v: 4 }, n: 2 }));
    put('scripts/evil.mjs', 'x');
    const bad = commit('stamp+evil');
    const r = verifyStampDiff(head, bad, [QUEUE], { cwd: repo });
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/scripts\/evil\.mjs/);
    expect(verifyStampDiff(head, head, [QUEUE], { cwd: repo }).ok).toBe(false); // an empty stamp commit
  });
});

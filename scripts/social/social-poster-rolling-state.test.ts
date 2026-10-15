// P0-05: the social-poster fold-back's ONE rolling state PR, executed for
// real. The rolling step's and the PR step's `run:` bodies are lifted out of
// social-poster.yml and run with bash + git against throwaway repos: a bare
// "origin" and a fresh SHALLOW clone per poster run, like actions/checkout's.
// `gh` is a shell function that only logs; nothing touches the network.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const wf = readFileSync(join(ROOT, '.github', 'workflows', 'social-poster.yml'), 'utf8');
const BRANCH = 'social-poster/state-rolling';
const hasBash = (() => {
  try {
    execFileSync('bash', ['-c', 'true'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

/** The dedented `run: |` body of the named step — the same bytes CI runs. */
function stepScript(name: string): string {
  const lines = wf.split('\n');
  const start = lines.findIndex((l) => l.includes(`- name: ${name}`));
  expect(start, name).toBeGreaterThan(-1);
  const runAt = lines.findIndex((l, i) => i > start && /^\s+run: \|\s*$/.test(l));
  const indent = lines[runAt + 1].match(/^(\s*)/)![1].length;
  const body: string[] = [];
  for (let i = runAt + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') {
      body.push('');
      continue;
    }
    if (l.match(/^(\s*)/)![1].length < indent) break;
    body.push(l.slice(indent));
  }
  return body.join('\n');
}

const FOLD_STEP = 'Fold ledger back into main (via PR — visibility only, not correctness-critical)';
const PR_STEP = 'Open or update the one rolling state PR';
const GH_STUB = [
  'gh() {',
  '  echo "$*" >> "$GH_STUB_LOG"',
  '  case "$1 $2" in',
  '    "pr list") if [ -f "$GH_STUB_PR" ]; then cat "$GH_STUB_PR"; fi ;;',
  '    "pr create") echo 101 > "$GH_STUB_PR" ;;',
  '  esac',
  '}',
].join('\n');

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const slash = (p: string) => p.replace(/\\/g, '/');
const POSTED_A = '{"platform":"x","body":"a","url":"u-a"}\n';

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'social-poster-rolling-'));
  const origin = join(dir, 'origin.git');
  const url = pathToFileURL(origin).href;
  git(dir, ['init', '--bare', '-q', '-b', 'main', origin]);
  const seed = join(dir, 'seed');
  git(dir, ['init', '-q', '-b', 'main', seed]);
  for (const d of ['social/queue', 'social/posted', 'social/failed']) {
    mkdirSync(join(seed, d), { recursive: true });
    writeFileSync(join(seed, d, '.gitkeep'), '');
  }
  for (const f of ['a', 'b', 'r']) writeFileSync(join(seed, `social/queue/${f}.json`), `{"body":"${f}"}\n`);
  writeFileSync(join(seed, 'README.md'), 'v1\n');
  git(seed, ['add', '-A']);
  git(seed, ['-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'seed']);
  git(seed, ['push', '-q', url, 'HEAD:main']);
  let runs = 0;
  const ghLog = join(dir, 'gh.log');
  const env = (out: string) => ({
    ...process.env,
    rolling_branch: BRANCH,
    commit_message: 'social-poster: queue run',
    pr_title: 'social-poster: queue state',
    body_file: slash(join(dir, 'body.md')),
    GITHUB_OUTPUT: slash(out),
    GH_STUB_LOG: slash(ghLog),
    GH_STUB_PR: slash(join(dir, 'gh-pr')),
  });
  return {
    dir,
    origin,
    /** A poster run's checkout: shallow, at origin main as of now. */
    checkout() {
      const work = join(dir, `run${++runs}`);
      git(dir, ['clone', '-q', '--depth', '1', '--branch', 'main', url, work]);
      return work;
    },
    /** Another writer moves origin main (a founder or content PR). */
    advanceMain(edit: (repo: string) => void) {
      const other = join(dir, `main${runs}-${Date.now()}`);
      git(dir, ['clone', '-q', url, other]);
      edit(other);
      git(other, ['add', '-A']);
      git(other, ['-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'main moves']);
      git(other, ['push', '-q', 'origin', 'HEAD:main']);
    },
    /** Runs the rolling git step; returns its `mode` output and stdout. */
    fold(work: string) {
      const out = join(work, '..', `${work.split(/[\\/]/).pop()}.out`);
      writeFileSync(out, '');
      const stdout = execFileSync('bash', ['-c', stepScript(FOLD_STEP)], { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: env(out) });
      const mode = readFileSync(out, 'utf8').match(/^mode=(\w+)$/m)?.[1];
      return { mode, stdout };
    },
    /** Runs the PR step with the logging `gh` stub. */
    pr(work: string) {
      execFileSync('bash', ['-c', `${GH_STUB}\n${stepScript(PR_STEP)}`], { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: env(join(dir, 'pr.out')) });
    },
    ghCalls: () => readFileSync(ghLog, 'utf8').trim().split('\n'),
    tip: () => git(origin, ['rev-parse', `refs/heads/${BRANCH}`]),
    parents: (sha: string) => git(origin, ['rev-list', '--parents', '-n', '1', sha]).split(' ').slice(1),
    files: (sha: string) => git(origin, ['ls-tree', '-r', '--name-only', sha]).split('\n'),
    /** What the rolling PR would show against main: social state only. */
    prDiff: () => git(origin, ['diff', '--name-only', `main...${BRANCH}`]).split('\n').sort(),
  };
}

/** The poster posted `name` this run: queue file gone, posted record written. */
function post(work: string, name: string, record = `{"platform":"x","body":"${name}","url":"u-${name}"}\n`) {
  rmSync(join(work, `social/queue/${name}.json`));
  writeFileSync(join(work, `social/posted/${name}.json`), record);
}

describe.skipIf(!hasBash)('social-poster.yml — one rolling state PR (P0-05), executed', () => {
  it('(a) two runs whose state PRs are both unmerged → one branch, ONE PR, both runs\' changes present', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();
      expect(s.parents(tip1)).toEqual([git(run1, ['rev-parse', 'HEAD'])]);

      // main moves before run 2, so run 2's depth-1 checkout no longer holds
      // run 1's base: merge-tree only works because the step deepens history.
      s.advanceMain((repo) => writeFileSync(join(repo, 'README.md'), 'v2\n'));
      const run2 = s.checkout();
      expect(readFileSync(join(run2, 'social/queue/a.json'), 'utf8')).toContain('"a"'); // run 1's PR is unmerged
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A); // the social-ledger overlay
      post(run2, 'b');
      expect(s.fold(run2).mode).toBe('rolling');
      s.pr(run2);

      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(git(s.origin, ['merge-base', '--is-ancestor', tip1, tip2])).toBe(''); // a fast-forward
      const files = s.files(tip2);
      expect(files).toEqual(expect.arrayContaining(['social/posted/a.json', 'social/posted/b.json', 'social/queue/r.json']));
      expect(files).not.toContain('social/queue/a.json'); // run 1's deletion carried, not dropped
      expect(files).not.toContain('social/queue/b.json');
      expect(git(s.origin, ['show', `${tip2}:README.md`])).toBe('v2');
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/a.json', 'social/queue/b.json']);

      const calls = s.ghCalls();
      expect(calls.filter((c) => c.startsWith('pr create'))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith('pr edit 101'))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith(`pr merge ${BRANCH} --squash --auto`))).toHaveLength(2);
    } finally {
      rmSync(s.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('(b) main moves mid-run → state stays on the run-start HEAD and the push is still a fast-forward', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      const tip1 = s.tip();

      const run2 = s.checkout();
      const runStart = git(run2, ['rev-parse', 'HEAD']);
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A);
      post(run2, 'b');
      // Mid-run, after run 2's checkout: a founder retires queue/r.json on main.
      s.advanceMain((repo) => rmSync(join(repo, 'social/queue/r.json')));
      const mainNow = git(s.origin, ['rev-parse', 'main']);
      expect(mainNow).not.toBe(runStart);

      expect(s.fold(run2).mode).toBe('rolling');
      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, runStart]);
      expect(git(s.origin, ['merge-base', '--is-ancestor', tip1, tip2])).toBe('');
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/a.json', 'social/queue/b.json']);
      // Landing the PR on the moved main keeps the founder's deletion.
      const landed = git(s.origin, ['merge-tree', '--write-tree', 'main', BRANCH]);
      const landedFiles = s.files(landed);
      expect(landedFiles).not.toContain('social/queue/r.json');
      expect(landedFiles).toEqual(expect.arrayContaining(['social/posted/a.json', 'social/posted/b.json']));
    } finally {
      rmSync(s.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('(c) a merge-tree conflict → the timestamped fallback with a ::warning::, rolling branch and checkout untouched', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      writeFileSync(join(run1, 'social/queue/r.json'), '{"body":"r","attempts":1,"lastAttemptAt":"t1"}\n');
      expect(s.fold(run1).mode).toBe('rolling');
      const tip1 = s.tip();

      // Run 1's PR is unmerged, so run 2 retries from main's attempts 0 again.
      const run2 = s.checkout();
      const head = git(run2, ['rev-parse', 'HEAD']);
      writeFileSync(join(run2, 'social/queue/r.json'), '{"body":"r","attempts":1,"lastAttemptAt":"t2"}\n');
      const { mode, stdout } = s.fold(run2);

      expect(mode).toBe('fallback');
      expect(stdout).toMatch(/^::warning::social-poster: merge-tree conflict/m);
      expect(s.tip()).toBe(tip1);
      expect(git(run2, ['rev-parse', 'HEAD'])).toBe(head);
      expect(git(run2, ['status', '--porcelain', '--', 'social'])).toBe('M social/queue/r.json'); // left for commit-and-pr
    } finally {
      rmSync(s.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('a run with no queue/posted/failed change pushes nothing and opens no PR', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      expect(s.fold(run1).mode).toBe('none');
      expect(git(s.origin, ['branch', '--list', BRANCH])).toBe('');
    } finally {
      rmSync(s.dir, { recursive: true, force: true });
    }
  }, 60_000);
});

describe('social-poster.yml — rolling fold-back wiring (P0-05)', () => {
  it('the PR step runs only after a rolling push, and the timestamped commit-and-pr path only on fallback or a crashed rolling step', () => {
    expect(wf).toContain("if: always() && steps.rolling.outputs.mode == 'rolling'");
    const fallbackAt = wf.indexOf('- name: Fold back via a timestamped PR (rolling-branch fallback)');
    expect(fallbackAt).toBeGreaterThan(wf.indexOf(`- name: ${PR_STEP}`));
    const fallback = wf.slice(fallbackAt, wf.indexOf('- name: Alert on a permanent post failure'));
    expect(fallback).toContain("if: always() && (steps.rolling.outputs.mode == 'fallback' || steps.rolling.outcome == 'failure')");
    expect(fallback).toContain('uses: ./.github/actions/commit-and-pr');
    expect(fallback).toContain('branch: ${{ env.branch }}');
  });

  it('the rolling branch is derived from STATE_BRANCH_PREFIX, so every social-poster/state-* gate still matches it', () => {
    expect(wf).toContain('echo "rolling_branch=${STATE_BRANCH_PREFIX}rolling"');
    expect(BRANCH.startsWith('social-poster/state-')).toBe(true);
  });
});

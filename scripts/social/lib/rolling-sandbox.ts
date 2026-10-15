// Test-only: a throwaway origin + shallow per-run clones for executing
// social-poster.yml's rolling fold-back steps for real (P0-05). The steps'
// `run:` bodies are lifted out of the workflow and run with bash + git; `gh`
// is a shell function that only logs, so nothing touches the network.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../../lib/generated-content.mjs';

export const wf = readFileSync(join(ROOT, '.github', 'workflows', 'social-poster.yml'), 'utf8');
export const BRANCH = 'social-poster/state-rolling';
export const FOLD_STEP = 'Fold ledger back into main (via PR — visibility only, not correctness-critical)';
export const PR_STEP = 'Open or update the one rolling state PR';
export const POSTED_A = '{"platform":"x","body":"a","url":"u-a"}\n';
export const FEEDBACK = 'social/feedback/2026-W42.jsonl';

export const hasBash = (() => {
  try {
    execFileSync('bash', ['-c', 'true'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

/** The dedented `run: |` body of the named step — the same bytes CI runs. */
export function stepScript(name: string): string {
  const lines = wf.split('\n');
  const start = lines.findIndex((l) => l.includes(`- name: ${name}`));
  const runAt = lines.findIndex((l, i) => start > -1 && i > start && /^\s+run: \|\s*$/.test(l));
  if (start < 0 || runAt < 0) throw new Error(`no run body for step "${name}"`);
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

const GH_STUB = [
  'gh() {',
  '  echo "$*" >> "$GH_STUB_LOG"',
  '  case "$1 $2" in',
  '    "pr list") if [ -f "$GH_STUB_PR" ]; then cat "$GH_STUB_PR"; fi ;;',
  '    "pr create") echo 101 > "$GH_STUB_PR" ;;',
  '  esac',
  '}',
].join('\n');

export const git = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const slash = (p: string) => p.replace(/\\/g, '/');
const commitAs = ['-c', 'user.name=t', '-c', 'user.email=t@example.com'];

/** The poster posted `name` this run: queue file gone, posted record written. */
export function post(work: string, name: string, record = `{"platform":"x","body":"${name}","url":"u-${name}"}\n`) {
  rmSync(join(work, `social/queue/${name}.json`));
  writeFileSync(join(work, `social/posted/${name}.json`), record);
}

export function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'social-poster-rolling-'));
  const origin = join(dir, 'origin.git');
  const url = pathToFileURL(origin).href;
  git(dir, ['init', '--bare', '-q', '-b', 'main', origin]);
  const seed = join(dir, 'seed');
  git(dir, ['init', '-q', '-b', 'main', seed]);
  for (const d of ['social/queue', 'social/posted', 'social/failed', 'social/feedback']) {
    mkdirSync(join(seed, d), { recursive: true });
    writeFileSync(join(seed, d, '.gitkeep'), '');
  }
  for (const f of ['a', 'b', 'r']) writeFileSync(join(seed, `social/queue/${f}.json`), `{"body":"${f}"}\n`);
  writeFileSync(join(seed, FEEDBACK), '{"row":1}\n');
  writeFileSync(join(seed, 'README.md'), 'v1\n');
  git(seed, ['add', '-A']);
  git(seed, [...commitAs, 'commit', '-q', '-m', 'seed']);
  git(seed, ['push', '-q', url, 'HEAD:main']);
  let clones = 0;
  const ghLog = join(dir, 'gh.log');
  const ghPr = join(dir, 'gh-pr');
  writeFileSync(ghLog, '');
  const env = (out: string) => ({
    ...process.env,
    rolling_branch: BRANCH,
    commit_message: 'social-poster: queue run',
    pr_title: 'social-poster: queue state',
    body_file: slash(join(dir, 'body.md')),
    GITHUB_OUTPUT: slash(out),
    GH_STUB_LOG: slash(ghLog),
    GH_STUB_PR: slash(ghPr),
  });
  const runStep = (work: string, name: string, out: string) =>
    execFileSync('bash', ['-c', `${GH_STUB}\n${stepScript(name)}`], { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: env(out) });
  const s = {
    dir,
    origin,
    /** A poster run's checkout: shallow, at origin main as of now. */
    checkout() {
      const work = join(dir, `clone${++clones}`);
      git(dir, ['clone', '-q', '--depth', '1', '--branch', 'main', url, work]);
      return work;
    },
    /** Another writer moves origin main (a founder, a content PR). */
    advanceMain(edit: (repo: string) => void) {
      const other = s.checkout();
      edit(other);
      git(other, ['add', '-A']);
      git(other, [...commitAs, 'commit', '-q', '-m', 'main moves']);
      git(other, ['push', '-q', 'origin', 'HEAD:main']);
    },
    /** Runs the rolling git step; returns its `mode` output and stdout. */
    fold(work: string) {
      const out = `${work}.out`;
      writeFileSync(out, '');
      const stdout = runStep(work, FOLD_STEP, out);
      return { mode: readFileSync(out, 'utf8').match(/^mode=(\w+)$/m)?.[1], stdout };
    },
    /** Runs the PR step (open-or-edit + arm auto-merge) against the stub. */
    pr(work: string) {
      runStep(work, PR_STEP, `${work}.pr.out`);
    },
    /** GitHub squash-merges the open rolling PR: main gets its tree, no ancestry. */
    squashMerge() {
      const tree = git(origin, ['merge-tree', '--write-tree', 'main', BRANCH]);
      const squash = git(origin, [...commitAs, 'commit-tree', tree, '-p', 'main', '-m', 'squash']);
      git(origin, ['update-ref', 'refs/heads/main', squash]);
      rmSync(ghPr);
    },
    /** The open rolling PR is closed without merging. */
    closeUnmerged: () => rmSync(ghPr),
    ghCalls: () => readFileSync(ghLog, 'utf8').trim().split('\n'),
    tip: () => git(origin, ['rev-parse', `refs/heads/${BRANCH}`]),
    parents: (sha: string) => git(origin, ['rev-list', '--parents', '-n', '1', sha]).split(' ').slice(1),
    files: (sha: string) => git(origin, ['ls-tree', '-r', '--name-only', sha]).split('\n'),
    show: (sha: string, path: string) => git(origin, ['show', `${sha}:${path}`]),
    isAncestor(a: string, b: string) {
      try {
        git(origin, ['merge-base', '--is-ancestor', a, b]);
        return true;
      } catch {
        return false;
      }
    },
    /** What the rolling PR shows against main (GitHub's three-dot diff). */
    prDiff: () => git(origin, ['diff', '--name-only', `main...${BRANCH}`]).split('\n').filter(Boolean).sort(),
    /** Whether GitHub could merge the rolling PR into main right now. */
    mergeable() {
      try {
        git(origin, ['merge-tree', '--write-tree', 'main', BRANCH]);
        return true;
      } catch {
        return false;
      }
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
  return s;
}

// P0-05: the social-poster fold-back's ONE rolling state PR, executed for
// real against throwaway repos (lib/rolling-sandbox.ts): a bare "origin" and
// a fresh SHALLOW clone per poster run, like actions/checkout's. The
// recovery cases (merged/closed PR, retry conflicts) are in
// social-poster-rolling-recovery.test.ts.

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';
import { BRANCH, FEEDBACK, FOLD_STEP, POSTED_A, PR_STEP, git, hasBash, post, sandbox, stepScript, wf } from './lib/rolling-sandbox';

describe.skipIf(!hasBash)('social-poster.yml — one rolling state PR (P0-05), executed', () => {
  it("(a) two runs whose state PRs are both unmerged → one branch, ONE PR, both runs' changes present", () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      appendFileSync(join(run1, FEEDBACK), '{"row":2}\n'); // social-ledger overlay, ahead of main
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
      appendFileSync(join(run2, FEEDBACK), '{"row":2}\n{"row":3}\n');
      post(run2, 'b');
      const { mode, stdout } = s.fold(run2);
      expect(mode).toBe('rolling');
      expect(stdout).not.toContain('::warning::');
      s.pr(run2);

      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.isAncestor(tip1, tip2)).toBe(true); // a fast-forward
      const files = s.files(tip2);
      expect(files).toEqual(expect.arrayContaining(['social/posted/a.json', 'social/posted/b.json', 'social/queue/r.json']));
      expect(files).not.toContain('social/queue/a.json'); // run 1's deletion carried, not dropped
      expect(files).not.toContain('social/queue/b.json');
      expect(s.show(tip2, 'README.md')).toBe('v2');
      // Feedback rows never ride on the rolling PR (social-approval-poll.yml folds them).
      expect(s.show(tip2, FEEDBACK)).toBe('{"row":1}');
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/a.json', 'social/queue/b.json']);

      const calls = s.ghCalls();
      expect(calls.filter((c) => c.startsWith('pr create'))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith('pr edit 101'))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith(`pr merge ${BRANCH} --squash --auto`))).toHaveLength(2);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(b) main moves mid-run → state stays on the run-start HEAD and the push is still a fast-forward', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();

      const run2 = s.checkout();
      const runStart = git(run2, ['rev-parse', 'HEAD']);
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A);
      post(run2, 'b');
      // Mid-run, after run 2's checkout: a founder retires queue/r.json on main.
      s.advanceMain((repo) => {
        git(repo, ['rm', '-q', 'social/queue/r.json']);
      });
      expect(git(s.origin, ['rev-parse', 'main'])).not.toBe(runStart);

      expect(s.fold(run2).mode).toBe('rolling');
      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, runStart]);
      expect(s.isAncestor(tip1, tip2)).toBe(true);
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/a.json', 'social/queue/b.json']);
      // Landing the PR on the moved main keeps the founder's deletion.
      const landed = s.files(git(s.origin, ['merge-tree', '--write-tree', 'main', BRANCH]));
      expect(landed).not.toContain('social/queue/r.json');
      expect(landed).toEqual(expect.arrayContaining(['social/posted/a.json', 'social/posted/b.json']));
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(c) a conflict the poster may not resolve → the timestamped fallback with a ::warning::, rolling branch and checkout untouched', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      // Someone hand-edits the open rolling PR outside the state dirs, and main changes the same line.
      const hand = s.checkout();
      git(hand, ['fetch', '-q', 'origin', `${BRANCH}:${BRANCH}`]);
      git(hand, ['switch', '-q', BRANCH]);
      writeFileSync(join(hand, 'README.md'), 'hand\n');
      git(hand, ['-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qam', 'hand edit']);
      git(hand, ['push', '-q', 'origin', BRANCH]);
      const tip = s.tip();
      s.advanceMain((repo) => writeFileSync(join(repo, 'README.md'), 'v2\n'));

      const run2 = s.checkout();
      const head = git(run2, ['rev-parse', 'HEAD']);
      post(run2, 'b');
      const { mode, stdout } = s.fold(run2);

      expect(mode).toBe('fallback');
      expect(stdout).toMatch(/^::warning::social-poster: merge-tree conflict outside the social state dirs \(README\.md\)/m);
      expect(s.tip()).toBe(tip);
      expect(git(run2, ['rev-parse', 'HEAD'])).toBe(head);
      expect(git(run2, ['status', '--porcelain', '--', 'social']).split('\n').sort()).toEqual(['?? social/posted/b.json', 'D social/queue/b.json']);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('a run with no queue/posted/failed change pushes nothing and opens no PR', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      appendFileSync(join(run1, FEEDBACK), '{"row":2}\n'); // feedback alone is not this step's change
      expect(s.fold(run1).mode).toBe('none');
      expect(git(s.origin, ['branch', '--list', BRANCH])).toBe('');
    } finally {
      s.cleanup();
    }
  }, 60_000);
});

describe('social-poster.yml — rolling fold-back wiring (P0-05)', () => {
  it('the PR step runs only after a rolling push, and the timestamped commit-and-pr path only on an explicit fallback (never after an invariant abort)', () => {
    expect(wf).toContain("if: always() && steps.rolling.outputs.mode == 'rolling'");
    const fallbackAt = wf.indexOf('- name: Fold back via a timestamped PR (rolling-branch fallback)');
    expect(fallbackAt).toBeGreaterThan(wf.indexOf(`- name: ${PR_STEP}`));
    const fallback = wf.slice(fallbackAt, wf.indexOf('- name: Alert on a permanent post failure'));
    expect(fallback).toMatch(/^\s+if: always\(\) && steps\.rolling\.outputs\.mode == 'fallback'\s*$/m);
    expect(fallback).not.toContain("steps.rolling.outcome == 'failure'");
    expect(fallback).toContain('uses: ./.github/actions/commit-and-pr');
    expect(fallback).toContain('branch: ${{ env.branch }}');
  });

  it('the queued-and-posted/failed invariant runs on every rolling push, immediately before it', () => {
    const fold = stepScript(FOLD_STEP);
    const checkAt = fold.indexOf('CLASH=$(comm -12 <(ids social/queue) <(ids social/posted social/failed)');
    expect(checkAt).toBeGreaterThan(-1);
    expect(fold.indexOf('git push --quiet origin "$NEW_COMMIT:refs/heads/$rolling_branch"')).toBeGreaterThan(checkAt);
    expect(fold.split('git push').length - 1).toBe(1);
  });

  it('the rolling branch is derived from STATE_BRANCH_PREFIX, so every social-poster/state-* gate still matches it', () => {
    expect(wf).toContain('echo "rolling_branch=${STATE_BRANCH_PREFIX}rolling"');
    expect(BRANCH.startsWith('social-poster/state-')).toBe(true);
  });

  it('feedback rows still reach main: social-approval-poll.yml folds the full social-ledger copy every poll run', () => {
    const poll = readFileSync(join(ROOT, '.github', 'workflows', 'social-approval-poll.yml'), 'utf8');
    const overlay = poll.slice(poll.indexOf('- name: Overlay social/feedback from social-ledger'));
    expect(overlay).toMatch(/^\s+if: always\(\)$/m);
    expect(overlay).toContain('git archive FETCH_HEAD social/feedback | tar -x');
    const fold = poll.slice(poll.indexOf('- name: Fold feedback ledger back into main'));
    expect(fold).toMatch(/^\s+if: always\(\)$/m);
    expect(fold).toContain('uses: ./.github/actions/commit-and-pr');
    expect(fold).toContain('paths: social/feedback');
  });
});

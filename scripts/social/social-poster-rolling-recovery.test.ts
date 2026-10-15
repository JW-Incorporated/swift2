// P0-05 (PM ruling): the rolling state branch is never deleted after its PR
// merges (this repo keeps merged state branches), so a run with no OPEN
// rolling PR builds on its own tree — parents still (tip, HEAD), still a
// fast-forward. And a retry while the PR is unmerged must not leave two PRs
// changing the same lines (whichever merged second would be stuck forever),
// so conflicting state files resolve to this run's newer version in place.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSTED_A, git, hasBash, post, sandbox } from './lib/rolling-sandbox';

const retry = (t: string) => `{"body":"r","attempts":1,"lastError":"429","lastAttemptAt":"${t}"}\n`;

describe.skipIf(!hasBash)('social-poster.yml — rolling PR recovery (P0-05), executed', () => {
  it('(f) the rolling PR squash-merged, then main changed a file the old tip touched → no conflict, a fast-forward, PR diff = only this run', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      writeFileSync(join(run1, 'social/queue/r.json'), retry('t1'));
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();
      s.squashMerge(); // the branch stays, but its PR is no longer open
      // Later, r finally fails and that state lands on main some other way.
      s.advanceMain((repo) => {
        git(repo, ['rm', '-q', 'social/queue/r.json']);
        writeFileSync(join(repo, 'social/failed/r.json'), '{"body":"r","attempts":3}\n');
      });

      const run2 = s.checkout();
      post(run2, 'b');
      const { mode, stdout } = s.fold(run2);
      expect(mode).toBe('rolling');
      expect(stdout).not.toContain('::warning::');
      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.isAncestor(tip1, tip2)).toBe(true);
      expect(s.prDiff()).toEqual(['social/posted/b.json', 'social/queue/b.json']);
      expect(s.mergeable()).toBe(true);
      s.pr(run2);
      expect(s.ghCalls().filter((c) => c.startsWith('pr create'))).toHaveLength(2); // a fresh PR from the same branch
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it("(g) the rolling PR was closed unmerged → the next run starts clean from main; the closed PR's state changes are dropped", () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();
      s.closeUnmerged();

      const run2 = s.checkout();
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A); // social-ledger still has run 1's posted record
      post(run2, 'b');
      expect(s.fold(run2).mode).toBe('rolling');
      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.isAncestor(tip1, tip2)).toBe(true);
      const files = s.files(tip2);
      expect(files).toContain('social/queue/a.json'); // run 1's queue deletion: dropped with the closed PR
      expect(files).toContain('social/posted/a.json'); // its posted record: kept, via the ledger overlay
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/b.json']);
      s.pr(run2);
      expect(s.ghCalls().filter((c) => c.startsWith('pr create'))).toHaveLength(2);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(h) a retry while the rolling PR is unmerged → resolved in place to the newer attempt, ONE PR, still mergeable', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      writeFileSync(join(run1, 'social/queue/r.json'), retry('t1'));
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();

      const run2 = s.checkout(); // main still has r at attempts 0, so run 2 retries from there
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A);
      writeFileSync(join(run2, 'social/queue/r.json'), retry('t2'));
      post(run2, 'b');
      const { mode, stdout } = s.fold(run2);
      expect(mode).toBe('rolling');
      expect(stdout).toMatch(/^::warning::social-poster: this run and the open rolling PR both changed social\/queue\/r\.json/m);
      s.pr(run2);

      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.show(tip2, 'social/queue/r.json')).toBe(retry('t2').trim());
      expect(s.files(tip2)).not.toContain('social/queue/a.json'); // run 1's other changes kept
      expect(s.prDiff()).toEqual(['social/posted/a.json', 'social/posted/b.json', 'social/queue/a.json', 'social/queue/b.json', 'social/queue/r.json']);
      expect(s.mergeable()).toBe(true);
      const calls = s.ghCalls();
      expect(calls.filter((c) => c.startsWith('pr create'))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith('pr edit 101'))).toHaveLength(1);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(h) a retry, then the item posts while the PR is unmerged → the queue file is gone and the posted record is untouched', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      writeFileSync(join(run1, 'social/queue/r.json'), retry('t1'));
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);

      const run2 = s.checkout();
      const record = '{"platform":"x","body":"r","url":"u-r","postedAt":"t2"}\n';
      post(run2, 'r', record);
      expect(s.fold(run2).mode).toBe('rolling');
      const tip2 = s.tip();
      expect(s.files(tip2)).not.toContain('social/queue/r.json');
      expect(s.show(tip2, 'social/posted/r.json')).toBe(record.trim()); // never merged with the queue item's fields
      expect(s.prDiff()).toEqual(['social/posted/r.json', 'social/queue/r.json']);
      expect(s.mergeable()).toBe(true);
    } finally {
      s.cleanup();
    }
  }, 60_000);
});

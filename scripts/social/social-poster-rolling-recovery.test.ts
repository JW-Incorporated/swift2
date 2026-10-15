// P0-05 (PM ruling): the rolling state branch is never deleted after its PR
// merges (this repo keeps merged state branches), so a run with no OPEN
// rolling PR builds on its own tree — parents still (tip, HEAD), still a
// fast-forward. A retry while the PR is unmerged must not leave two PRs
// changing the same lines (whichever merged second would be stuck forever),
// so conflicting state files resolve in place: for queue/, deleted always
// wins, else the PR's version (architect ruling #5). And an invariant aborts
// any push whose tree has an item both queued and posted/failed.

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
      writeFileSync(join(run1, 'social/queue/r.json'), retry('t1'));
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();
      s.closeUnmerged();

      const run2 = s.checkout();
      post(run2, 'b');
      expect(s.fold(run2).mode).toBe('rolling');
      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.isAncestor(tip1, tip2)).toBe(true);
      expect(s.show(tip2, 'social/queue/r.json')).toBe('{"body":"r"}'); // run 1's retry bookkeeping: dropped
      expect(s.prDiff()).toEqual(['social/posted/b.json', 'social/queue/b.json']);
      s.pr(run2);
      expect(s.ghCalls().filter((c) => c.startsWith('pr create'))).toHaveLength(2);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('INVARIANT: a closed PR had posted an item, so it is queued on main AND posted on the ledger → push aborted, ::error:: names it, nothing pushed, no fallback', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      post(run1, 'a', POSTED_A);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const tip1 = s.tip();
      s.closeUnmerged();

      const run2 = s.checkout(); // main still queues a; the social-ledger overlay has its posted record
      writeFileSync(join(run2, 'social/posted/a.json'), POSTED_A);
      post(run2, 'b');
      const { status, mode, stdout } = s.fold(run2);
      expect(status).toBe(1);
      expect(mode).toBe('aborted');
      expect(stdout).toMatch(/^::error::social-poster: ABORTED the rolling state push — item\(s\) both queued and posted\/failed: a\.json\. Remove/m);
      expect(s.tip()).toBe(tip1);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(h) a retry while the rolling PR is unmerged → resolved in place to the PR\'s version, ONE PR, still mergeable', () => {
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
      expect(stdout).toMatch(/^::warning::social-poster: this run and the open rolling PR both changed: social\/queue\/r\.json \(both rewrote it: the rolling PR's\);/m);
      s.pr(run2);

      const tip2 = s.tip();
      expect(s.parents(tip2)).toEqual([tip1, git(run2, ['rev-parse', 'HEAD'])]);
      expect(s.show(tip2, 'social/queue/r.json')).toBe(retry('t1').trim());
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

  // Review round 1 (worstcase.mts): an item the tip retired after an AMBIGUOUS
  // failure (it may be live) must never come back via a stale retry.
  it('(h) tip deleted the queue file, this run retried it from main → stays deleted, the failed record kept', () => {
    const s = sandbox();
    const failed = '{"body":"r","attempts":1,"lastError":"ambiguous"}\n';
    try {
      const run1 = s.checkout();
      git(run1, ['rm', '-q', 'social/queue/r.json']);
      writeFileSync(join(run1, 'social/failed/r.json'), failed);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);

      const run2 = s.checkout();
      writeFileSync(join(run2, 'social/failed/r.json'), failed); // the social-ledger overlay
      writeFileSync(join(run2, 'social/queue/r.json'), '{"body":"r","attempts":1,"lastError":"429"}\n');
      const { mode, stdout } = s.fold(run2);
      expect(mode).toBe('rolling');
      expect(stdout).toContain('social/queue/r.json (one side deleted it: deleted)');
      const files = s.files(s.tip());
      expect(files).not.toContain('social/queue/r.json');
      expect(files).toContain('social/failed/r.json');
      expect(s.prDiff()).toEqual(['social/failed/r.json', 'social/queue/r.json']); // deleted on main once it lands
      expect(s.mergeable()).toBe(true);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(h) a founder edit on main races the tip retiring the file → still DELETED (deleted always wins; the founder re-approves)', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      git(run1, ['rm', '-q', 'social/queue/r.json']);
      writeFileSync(join(run1, 'social/failed/r.json'), '{"body":"r","attempts":3}\n');
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      s.advanceMain((repo) => writeFileSync(join(repo, 'social/queue/r.json'), '{"body":"r, re-approved by a founder"}\n'));

      const run2 = s.checkout();
      writeFileSync(join(run2, 'social/failed/r.json'), '{"body":"r","attempts":3}\n');
      post(run2, 'b');
      const { mode, stdout } = s.fold(run2);
      expect(mode).toBe('rolling');
      expect(stdout).toContain('social/queue/r.json (one side deleted it: deleted)');
      expect(s.files(s.tip())).not.toContain('social/queue/r.json');
      expect(s.files(s.tip())).toContain('social/failed/r.json');
      expect(s.mergeable()).toBe(true);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  // Final review (case1.mts): main's change to r was the poster's OWN squash-merged
  // attempts bump, not a founder. The retired item must stay retired.
  it('CASE 1: tip retired r (ambiguous) after the previous PR squash-merged an attempts bump; the next run retried r from main → r DELETED, failed/r survives', () => {
    const s = sandbox();
    const amb = '{"body":"r","attempts":1,"lastError":"ambiguous"}\n';
    try {
      const run1 = s.checkout(); // r retried, attempts 0 -> 1; rolling PR #1 opens
      writeFileSync(join(run1, 'social/queue/r.json'), retry('t1'));
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);
      const run2 = s.checkout(); // PR #1 still open: run 2 retries r from attempts 0 -> AMBIGUOUS -> failed/
      git(run2, ['rm', '-q', 'social/queue/r.json']);
      writeFileSync(join(run2, 'social/failed/r.json'), amb);
      s.squashMerge(); // PR #1 auto-merges while run 2 is still posting
      expect(s.fold(run2).mode).toBe('rolling');
      s.pr(run2);
      expect(s.files(s.tip())).not.toContain('social/queue/r.json');

      const run3 = s.checkout(); // main (squash of PR #1) still queues r at attempts 1; run 3 retries it
      writeFileSync(join(run3, 'social/failed/r.json'), amb);
      writeFileSync(join(run3, 'social/queue/r.json'), '{"body":"r","attempts":2,"lastError":"429","lastAttemptAt":"t3"}\n');
      const { mode, stdout } = s.fold(run3);
      expect(mode).toBe('rolling');
      expect(stdout).toContain('social/queue/r.json (one side deleted it: deleted)');
      const files = s.files(s.tip());
      expect(files).not.toContain('social/queue/r.json');
      expect(s.show(s.tip(), 'social/failed/r.json')).toBe(amb.trim());
      expect(s.prDiff()).toEqual(['social/failed/r.json', 'social/queue/r.json']);
      expect(s.mergeable()).toBe(true);
    } finally {
      s.cleanup();
    }
  }, 60_000);

  it('(h) both runs wrote different failed/ records for one item → the record is kept (this run\'s), never dropped', () => {
    const s = sandbox();
    try {
      const run1 = s.checkout();
      git(run1, ['rm', '-q', 'social/queue/r.json']);
      writeFileSync(join(run1, 'social/failed/r.json'), '{"body":"r","attempts":3,"failedAt":"t1"}\n');
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1);

      const run2 = s.checkout(); // main still queues r, so run 2 exhausts it again
      git(run2, ['rm', '-q', 'social/queue/r.json']);
      writeFileSync(join(run2, 'social/failed/r.json'), '{"body":"r","attempts":3,"failedAt":"t2"}\n');
      expect(s.fold(run2).mode).toBe('rolling');
      expect(s.show(s.tip(), 'social/failed/r.json')).toBe('{"body":"r","attempts":3,"failedAt":"t2"}');
      expect(s.files(s.tip())).not.toContain('social/queue/r.json');
      expect(s.mergeable()).toBe(true);
    } finally {
      s.cleanup();
    }
  }, 60_000);
});

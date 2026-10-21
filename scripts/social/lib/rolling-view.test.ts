import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module
import { applyRollingView } from './rolling-view.mjs';
import { BRANCH, hasBash, post, sandbox } from './rolling-sandbox';

const quiet = () => {};

describe.skipIf(!hasBash)('applyRollingView (issue #5885)', () => {
  const boxes: ReturnType<typeof sandbox>[] = [];
  afterEach(() => boxes.splice(0).forEach((b) => b.cleanup()));
  const box = () => {
    const b = sandbox();
    boxes.push(b);
    return b;
  };

  it('stale main + fresh rolling tip: an already-posted item is not left queued', () => {
    const s = box();
    const run1 = s.checkout();
    post(run1, 'a');
    expect(s.fold(run1).mode).toBe('rolling');
    const run2 = s.checkout(); // main is still stale: it queues `a`
    expect(existsSync(join(run2, 'social/queue/a.json'))).toBe(true);
    const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
    expect(r.mode).toBe('rolling');
    expect(r.dropped).toEqual(['a.json']);
    expect(existsSync(join(run2, 'social/queue/a.json'))).toBe(false);
    expect(readFileSync(join(run2, 'social/posted/a.json'), 'utf8')).toContain('u-a');
    expect(existsSync(join(run2, 'social/queue/b.json'))).toBe(true);
  });

  it('an item retired to failed/ on the tip is not retried either', () => {
    const s = box();
    const run1 = s.checkout();
    rmSync(join(run1, 'social/queue/b.json'));
    writeFileSync(join(run1, 'social/failed/b.json'), '{"reason":"ambiguous"}\n');
    post(run1, 'a');
    s.fold(run1);
    const run2 = s.checkout();
    const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
    expect(r.dropped.sort()).toEqual(['a.json', 'b.json']);
    expect(existsSync(join(run2, 'social/failed/b.json'))).toBe(true);
  });

  it('never overwrites a local record and never copies queue contents from the tip', () => {
    const s = box();
    const run1 = s.checkout();
    post(run1, 'a', '{"from":"tip"}\n');
    writeFileSync(join(run1, 'social/queue/b.json'), '{"body":"stale-tip-edit"}\n');
    s.fold(run1);
    const run2 = s.checkout();
    writeFileSync(join(run2, 'social/posted/a.json'), '{"from":"local"}\n');
    applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
    expect(readFileSync(join(run2, 'social/posted/a.json'), 'utf8')).toContain('local');
    expect(readFileSync(join(run2, 'social/queue/b.json'), 'utf8')).toContain('"b"');
  });

  it('no rolling branch: main view, nothing changed', () => {
    const s = box();
    const run1 = s.checkout();
    const r = applyRollingView({ cwd: run1, branch: BRANCH, log: quiet });
    expect(r).toEqual({ mode: 'main-only', overlaid: [], dropped: [], shadowed: [] });
    expect(existsSync(join(run1, 'social/queue/a.json'))).toBe(true);
  });

  describe('posted wins over a shadowing failed/ record (#6118, #6123)', () => {
    const FAILED = '{"reason":"stale-48h"}\n';

    it('(a) posted + failed for one name: the view keeps posted only', () => {
      const s = box();
      const run1 = s.checkout();
      post(run1, 'a');
      s.fold(run1);
      const run2 = s.checkout();
      writeFileSync(join(run2, 'social/failed/a.json'), FAILED); // ledger overlay brought the false positive
      const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
      expect(r.shadowed).toEqual(['a.json']);
      expect(existsSync(join(run2, 'social/failed/a.json'))).toBe(false);
      expect(readFileSync(join(run2, 'social/posted/a.json'), 'utf8')).toContain('u-a');
    });

    it('(a) the state output never carries the shadowed failed copy, even from the rolling tip', () => {
      const s = box();
      const run1 = s.checkout();
      rmSync(join(run1, 'social/queue/b.json'));
      writeFileSync(join(run1, 'social/failed/b.json'), FAILED);
      expect(s.fold(run1).mode).toBe('rolling');
      s.pr(run1); // rolling PR is now open
      const run2 = s.checkout();
      post(run2, 'b');
      writeFileSync(join(run2, 'social/failed/b.json'), FAILED);
      expect(s.fold(run2).mode).toBe('rolling');
      const files = s.files(s.tip());
      expect(files).toContain('social/posted/b.json');
      expect(files).not.toContain('social/failed/b.json');
    });

    it('(b) failed alone is kept', () => {
      const s = box();
      const run1 = s.checkout();
      rmSync(join(run1, 'social/queue/b.json'));
      writeFileSync(join(run1, 'social/failed/b.json'), FAILED);
      s.fold(run1);
      const run2 = s.checkout();
      const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
      expect(r.shadowed).toEqual([]);
      expect(existsSync(join(run2, 'social/failed/b.json'))).toBe(true);
      expect(s.files(s.tip())).toContain('social/failed/b.json');
    });

    it('(c) posted alone is kept', () => {
      const s = box();
      const run1 = s.checkout();
      post(run1, 'a');
      s.fold(run1);
      const run2 = s.checkout();
      const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
      expect(r.shadowed).toEqual([]);
      expect(existsSync(join(run2, 'social/posted/a.json'))).toBe(true);
      expect(s.files(s.tip())).toContain('social/posted/a.json');
    });

    it('(d) the queue item is still dropped as already handled', () => {
      const s = box();
      const run1 = s.checkout();
      post(run1, 'a');
      s.fold(run1);
      const run2 = s.checkout();
      writeFileSync(join(run2, 'social/failed/a.json'), FAILED);
      const r = applyRollingView({ cwd: run2, branch: BRANCH, log: quiet });
      expect(r.dropped).toEqual(['a.json']);
      expect(existsSync(join(run2, 'social/queue/a.json'))).toBe(false);
    });
  });

  it('a git error fails loudly instead of falling back to main', () => {
    const s = box();
    const broken = s.checkout();
    expect(() => applyRollingView({ cwd: broken, branch: BRANCH, remote: 'no-such-remote', log: quiet })).toThrow(/rolling-view/);
  });
});

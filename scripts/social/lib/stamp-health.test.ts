// The safety axis as a pure-ish unit (git injected): the same
// cleanSince/selfClean/stampHealth the poll merges on and the notifier's
// already-stamped filter re-briefs on (PR #4139 round 4, Codex HIGH).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SOCIAL_APPROVERS } from './approvers.mjs';
import { makeFakeGit } from './fake-git.test-helper';
import { contentHash, signApproval } from './queue.mjs';
import { filterAlreadyStamped, makeGitState, stampHealth } from './stamp-health.mjs';

const KEY = 'test-key';
const PR = 4200;
const STALE = 'b'.repeat(40);
const HEAD = 'a'.repeat(40);
const REL = 'social/queue/2026-09-20-example-x.json';
const REL_G = 'social/queue/2026-09-21-example-y.json';
const BASE = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
const text = (item: unknown) => JSON.stringify(item, null, 2) + '\n';

function v3(item: Record<string, unknown>, sha: string) {
  const unsigned = { v: 3, by: SOCIAL_APPROVERS[0], at: '2026-09-10T00:00:00Z', pr: PR, sha, message: '1', contentHash: contentHash(item) };
  return { ...item, approval: { ...unsigned, sig: signApproval(unsigned, KEY) } };
}

function v2(item: Record<string, unknown>) {
  const unsigned = { v: 2, by: SOCIAL_APPROVERS[0], at: '2026-09-10T00:00:00Z', pr: PR, message: '1', contentHash: contentHash(item) };
  return { ...item, approval: { ...unsigned, sig: signApproval(unsigned, KEY) } };
}

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'stamp-health-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const noKey = { approvers: SOCIAL_APPROVERS }; // the notifier's posture: shape+id+hash, no signature
const withKey = { approvers: SOCIAL_APPROVERS, key: KEY }; // the poll's

describe('filterAlreadyStamped (the notifier)', () => {
  it('HIGH: keeps a draft whose v3 stamp is content-valid but no longer covers head (why drift) — a fresh brief is owed', () => {
    const stamped = v3(BASE, STALE);
    const drifted = { ...stamped, why: 'nobody approved this' };
    const git = makeFakeGit({ root, head: HEAD, trees: { [STALE]: { [REL]: text(BASE) }, [HEAD]: { [REL]: text(drifted) } } });
    const kept = filterAlreadyStamped([{ file: REL, ...drifted }], { head: HEAD, gitState: makeGitState(git.impl, PR), approvers: SOCIAL_APPROVERS });
    expect(kept.map((d) => d.file)).toEqual([REL]);
  });

  it('drops a draft whose stamp still covers head — no re-brief on a synchronize (B1)', () => {
    const stamped = v3(BASE, STALE);
    const git = makeFakeGit({ root, head: HEAD, trees: { [STALE]: { [REL]: text(BASE) }, [HEAD]: { [REL]: text(stamped) } } });
    expect(filterAlreadyStamped([{ file: REL, ...stamped }], { head: HEAD, gitState: makeGitState(git.impl, PR), approvers: SOCIAL_APPROVERS })).toEqual([]);
  });

  it('keeps a v2 stamp (it needs a fresh ✅ to become v3) and an unstamped draft; drops nothing it cannot see a stamp on', () => {
    const git = makeFakeGit({ root, head: HEAD, trees: { [HEAD]: { [REL]: text(v2(BASE)), [REL_G]: text(BASE) } } });
    const kept = filterAlreadyStamped([{ file: REL, ...v2(BASE) }, { file: REL_G, ...BASE }], { head: HEAD, gitState: makeGitState(git.impl, PR), approvers: SOCIAL_APPROVERS });
    expect(kept.map((d) => d.file)).toEqual([REL, REL_G]);
  });

  it('keeps a stamped draft when a non-queue path changed since its stamp (image bytes) — the daily digest is the only fresh brief such a PR gets', () => {
    const stamped = v3(BASE, STALE);
    const PHOTO = 'apps/web/public/social/library/photos/x.jpg';
    const git = makeFakeGit({ root, head: HEAD, trees: { [STALE]: { [REL]: text(BASE), [PHOTO]: 'old' }, [HEAD]: { [REL]: text(stamped), [PHOTO]: 'new' } } });
    expect(filterAlreadyStamped([{ file: REL, ...stamped }], { head: HEAD, gitState: makeGitState(git.impl, PR), approvers: SOCIAL_APPROVERS })).toHaveLength(1);
  });

  it('keeps a stamped draft whose history is unreadable — fails OPEN for briefing, the harmless direction', () => {
    const stamped = v3(BASE, STALE);
    const git = makeFakeGit({ root, head: HEAD, trees: { [HEAD]: { [REL]: text(stamped) } } }); // STALE's objects never fetched
    expect(filterAlreadyStamped([{ file: REL, ...stamped }], { head: HEAD, gitState: makeGitState(git.impl, PR), approvers: SOCIAL_APPROVERS })).toHaveLength(1);
  });

  it('without a head/git state degrades to the content-only check (the pre-2026-09-12 behaviour, blind to drift)', () => {
    const drifted = { ...v3(BASE, STALE), why: 'nobody approved this' };
    expect(filterAlreadyStamped([{ file: REL, ...drifted }], { head: null, gitState: null, approvers: SOCIAL_APPROVERS })).toEqual([]);
  });
});

describe('stampHealth', () => {
  it('names the offending path for a non-queue drift, and the file itself for a self-clean failure', () => {
    const stamped = v3(BASE, STALE);
    const PHOTO = 'apps/web/public/social/library/photos/x.jpg';
    const git = makeFakeGit({ root, head: HEAD, trees: { [STALE]: { [REL]: text(BASE), [PHOTO]: 'old' }, [HEAD]: { [REL]: text({ ...stamped, why: 'x' }), [PHOTO]: 'new' } } });
    const health = stampHealth(makeGitState(git.impl, PR), REL, { ...stamped, why: 'x' }, HEAD, withKey);
    expect(health.ok).toBe(false);
    expect(health.stamped).toBe(true);
    expect(health.problems.map((p) => p.path)).toEqual([PHOTO]); // cleanSince fails first; selfClean is only asked once the range is clean
    const git2 = makeFakeGit({ root, head: HEAD, trees: { [STALE]: { [REL]: text(BASE) }, [HEAD]: { [REL]: text({ ...stamped, why: 'x' }) } } });
    const health2 = stampHealth(makeGitState(git2.impl, PR), REL, { ...stamped, why: 'x' }, HEAD, withKey);
    expect(health2.problems.map((p) => p.path)).toEqual([REL]);
    expect(health2.problems[0].why).toContain('changed outside approval/body/edit');
  });

  it('with the key, a forged signature is unhealthy; without the key (the notifier), shape+hash is all that is asked', () => {
    const forged = { ...v3(BASE, HEAD), approval: { ...v3(BASE, HEAD).approval, sig: 'hmac-sha256:' + '1'.repeat(64) } };
    const git = makeFakeGit({ root, head: HEAD, trees: { [HEAD]: { [REL]: text(forged) } } });
    expect(stampHealth(makeGitState(git.impl, PR), REL, forged, HEAD, withKey).ok).toBe(false);
    expect(stampHealth(makeGitState(git.impl, PR), REL, forged, HEAD, noKey).ok).toBe(true);
  });
});

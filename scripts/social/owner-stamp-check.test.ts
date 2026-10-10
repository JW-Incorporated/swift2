// The cleanup step of social-tree-approve.yml closes a PR whose head moved off the
// tree-auto stamp commit - except when the new head already holds the owner's own
// valid v3 stamp. This pins that check: valid v3 keeps the PR; everything else closes.
import { describe, expect, it } from 'vitest';
import { ownerStampCheck } from './owner-stamp-check.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { TREE_AUTO_BY, TREE_AUTO_KIND, contentHash, signApproval } from './lib/queue.mjs';

const KEY = 'test-signing-key';
const SHA = 'b'.repeat(40);
const PATH_X = 'social/queue/2026-10-10-story-x.json';
const PATH_IG = 'social/queue/2026-10-10-story-instagram.json';
const base = { platform: 'x', body: 'hello', media: [], altText: [], scheduledAt: '2026-10-10T15:00:00Z', campaign: 'story' };

function v3(item: Record<string, unknown>, over: Record<string, unknown> = {}, key = KEY) {
  const approval: Record<string, unknown> = {
    v: 3, by: `discord:${SOCIAL_APPROVERS[0].replace('discord:', '')}`, at: '2026-10-09T12:00:00Z', pr: 5500, message: '1', sha: 'c'.repeat(40),
    contentHash: contentHash(item), ...over,
  };
  approval.sig = signApproval(approval, key);
  return { ...item, approval };
}
const show = (files: Record<string, unknown>) => (p: string) => {
  if (!(p in files)) throw new Error('missing');
  return JSON.stringify(files[p]);
};
const run = (files: Record<string, unknown>, paths = Object.keys(files), key = KEY) => ownerStampCheck(paths, { sha: SHA, key, showImpl: show(files) });

describe('ownerStampCheck', () => {
  it('is YES when every queue file carries a valid owner v3 stamp', () => {
    expect(run({ [PATH_X]: v3(base), [PATH_IG]: v3({ ...base, platform: 'instagram' }) }).ok).toBe(true);
  });
  it('is no for a tree-auto v4 stamp (that is the one being removed)', () => {
    const item = { ...base };
    const approval: Record<string, unknown> = { v: 4, kind: TREE_AUTO_KIND, by: TREE_AUTO_BY, at: '2026-10-09T12:00:00Z', pr: 5500, message: 'x', contentHash: contentHash(item), mediaDigest: 'sha256:abc' };
    approval.sig = signApproval(approval, KEY);
    expect(run({ [PATH_X]: { ...item, approval } }).ok).toBe(false);
  });
  it('is no for an unstamped file, a forged signature, an edited body, or one stamped file among two', () => {
    expect(run({ [PATH_X]: base }).ok).toBe(false);
    expect(run({ [PATH_X]: v3(base, {}, 'another-key') }).ok).toBe(false);
    expect(run({ [PATH_X]: { ...v3(base), body: 'edited after the stamp' } }).ok).toBe(false);
    expect(run({ [PATH_X]: v3(base), [PATH_IG]: base }).ok).toBe(false);
  });
  it('is no for an approver that is not in SOCIAL_APPROVERS', () => {
    expect(run({ [PATH_X]: v3(base, { by: 'discord:111111111111111111' }) }).ok).toBe(false);
  });
  it('is no without a key, a bad sha, an empty list, an unreadable file or an unsafe path', () => {
    expect(run({ [PATH_X]: v3(base) }, [PATH_X], '').ok).toBe(false);
    expect(ownerStampCheck([PATH_X], { sha: 'nope', key: KEY, showImpl: show({ [PATH_X]: v3(base) }) }).ok).toBe(false);
    expect(run({}, []).ok).toBe(false);
    expect(run({}, [PATH_X]).ok).toBe(false);
    expect(run({ 'social/queue/../x.json': v3(base) }).ok).toBe(false);
  });
});

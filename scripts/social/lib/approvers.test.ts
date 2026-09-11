// RULINGS-SOCIAL-2.md B5 — the check that would have caught A2's hole.
// The three refusal tests A2 shipped with all exercised the *verifier*
// ("does the poster reject a bad stamp?"). None of them exercised the
// *issuer* ("who can mint a good one?") — and the repo already had the
// answer in data: KNOWN_CONTENT_AUTHORS. These three tests are the
// disjointness half of that fix; stamp-approval.test.ts carries the
// issuer half.
import { describe, expect, it } from 'vitest';
import { SOCIAL_APPROVERS } from './approvers.mjs';
import { KNOWN_CONTENT_AUTHORS } from '../../automerge-branch-author-gate.mjs';

describe('SOCIAL_APPROVERS', () => {
  it('is disjoint from KNOWN_CONTENT_AUTHORS — no identity that can author or merge a content PR may also approve one', () => {
    expect(SOCIAL_APPROVERS.filter((id) => KNOWN_CONTENT_AUTHORS.includes(id))).toEqual([]);
  });

  it('is disjoint from every other automation identity in this system', () => {
    const otherAutomationIdentities = ['github-actions[bot]', 'app/claude'];
    expect(SOCIAL_APPROVERS.filter((id) => otherAutomationIdentities.includes(id))).toEqual([]);
  });

  it('every approver is a discord: identity — a GitHub login can never approve again', () => {
    for (const id of SOCIAL_APPROVERS) {
      expect(id).toMatch(/^discord:\d{17,20}$/);
    }
  });

  it('is non-empty — an empty list is a deliberate total-refusal state, not a silent accident', () => {
    // EXPECTED TO FAIL until the owner's Discord user id is pinned into
    // approvers.mjs (RULINGS-SOCIAL-2.md B1 setup step 3). A failure here
    // is the loud signal that setup is incomplete, not a bug in the test.
    expect(SOCIAL_APPROVERS.length).toBeGreaterThan(0);
  });
});

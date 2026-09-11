// RULINGS-SOCIAL-2.md B5 — the issuer test. The three A2 refusal tests
// (now in post-queue.test.ts / queue.test.ts) all feed a bad stamp to the
// VERIFIER and check it's rejected. None of them ever called the MINTING
// function with an automation identity and checked it refuses — which is
// exactly how a GitHub-login approver list shipped overlapping
// KNOWN_CONTENT_AUTHORS in the first place. This file closes that gap for
// the v2 stamper.
import { describe, expect, it, vi } from 'vitest';
import { stampFiles } from './stamp-approval.mjs';
import { KNOWN_CONTENT_AUTHORS } from '../automerge-branch-author-gate.mjs';

const AUTOMATION_IDENTITIES = [...KNOWN_CONTENT_AUTHORS, 'github-actions[bot]', 'app/claude', 'sffan15-sys'];

describe('stampFiles — issuer refusal', () => {
  for (const by of AUTOMATION_IDENTITIES) {
    it(`refuses to stamp anything for automation identity "${by}"`, () => {
      const writeFileImpl = vi.fn();
      const readFileImpl = vi.fn(() => JSON.stringify({ platform: 'x', body: 'hello', scheduledAt: '2026-09-20T00:00:00Z' }));
      const result = stampFiles(['2026-09-20-example-x.json'], {
        by,
        at: '2026-09-20T00:00:00Z',
        pr: 4200,
        message: '123',
        key: 'test-key',
        readFileImpl,
        writeFileImpl,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/not in SOCIAL_APPROVERS/);
      expect(writeFileImpl).not.toHaveBeenCalled();
    });
  }

  it('refuses to stamp anything when no signing key is supplied, even for a would-be valid approver', () => {
    const writeFileImpl = vi.fn();
    const readFileImpl = vi.fn(() => JSON.stringify({ platform: 'x', body: 'hello', scheduledAt: '2026-09-20T00:00:00Z' }));
    const result = stampFiles(['2026-09-20-example-x.json'], {
      by: 'discord:000000000000000001',
      at: '2026-09-20T00:00:00Z',
      pr: 4200,
      message: '123',
      key: '',
      readFileImpl,
      writeFileImpl,
    });
    expect(result.ok).toBe(false);
    expect(writeFileImpl).not.toHaveBeenCalled();
  });
});

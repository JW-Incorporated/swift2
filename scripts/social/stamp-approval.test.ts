// docs/social/RULINGS-SOCIAL-2.md B5 — the issuer test. The three A2 refusal tests
// (now in post-queue.test.ts / queue.test.ts) all feed a bad stamp to the
// VERIFIER and check it's rejected. None of them ever called the MINTING
// function with an automation identity and checked it refuses — which is
// exactly how a GitHub-login approver list shipped overlapping
// KNOWN_CONTENT_AUTHORS in the first place. This file closes that gap for
// the stamper (v3 since docs/decisions.md 2026-09-12: the head SHA is signed).
import { describe, expect, it, vi } from 'vitest';
import { stampFiles } from './stamp-approval.mjs';
import { approvalStatus, stampedSha } from './lib/queue.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { KNOWN_CONTENT_AUTHORS } from '../automerge-branch-author-gate.mjs';

const AUTOMATION_IDENTITIES = [...KNOWN_CONTENT_AUTHORS, 'github-actions[bot]', 'app/claude', 'sffan15-sys'];
const HEAD_SHA = 'a'.repeat(40);

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

  it('refuses to stamp anything without a full 40-hex head SHA — a stamp with no SHA could never pass the merge predicate', () => {
    const writeFileImpl = vi.fn();
    const readFileImpl = vi.fn(() => JSON.stringify({ platform: 'x', body: 'hello', scheduledAt: '2026-09-20T00:00:00Z' }));
    for (const sha of [undefined, '', 'abc123', 'g'.repeat(40)]) {
      const result = stampFiles(['2026-09-20-example-x.json'], { by: SOCIAL_APPROVERS[0], at: '2026-09-20T00:00:00Z', pr: 4200, message: '123', sha, key: 'test-key', readFileImpl, writeFileImpl });
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/not a full commit SHA/);
    }
    expect(writeFileImpl).not.toHaveBeenCalled();
  });

  it('writes a v3 stamp whose signed payload carries the head SHA it was minted on', () => {
    const item = { platform: 'x', body: 'hello', scheduledAt: '2026-09-20T00:00:00Z' };
    let written = '';
    const writeFileImpl = vi.fn((_p: string, text: string) => {
      written = text;
    });
    const readFileImpl = vi.fn(() => JSON.stringify(item));
    const result = stampFiles(['2026-09-20-example-x.json'], { by: SOCIAL_APPROVERS[0], at: '2026-09-20T00:00:00Z', pr: 4200, message: '123', sha: HEAD_SHA, key: 'test-key', readFileImpl, writeFileImpl });
    expect(result).toEqual({ ok: true, stamped: ['social/queue/2026-09-20-example-x.json'] });
    const stamped = JSON.parse(written);
    expect(stamped.approval).toMatchObject({ v: 3, by: SOCIAL_APPROVERS[0], pr: 4200, sha: HEAD_SHA, message: '123' });
    expect(approvalStatus(stamped, { approvers: SOCIAL_APPROVERS, key: 'test-key' })).toEqual({ ok: true });
    expect(stampedSha(stamped)).toBe(HEAD_SHA);
    expect(approvalStatus({ ...stamped, approval: { ...stamped.approval, sha: 'b'.repeat(40) } }, { approvers: SOCIAL_APPROVERS, key: 'test-key' }).ok).toBe(false);
  });
});

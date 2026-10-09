// The issuer test for the v4 tree-auto stamp: it mints only after the trusted
// check-drafts gate passes over ALL given files, and a refusal writes nothing.
import { describe, expect, it, vi } from 'vitest';
import { runCheckDrafts, stampTreeAuto } from './stamp-tree-auto.mjs';
import { approvalStatus } from './lib/queue.mjs';

const KEY = 'test-key';
const AT = '2026-10-09T12:00:00.000Z';
const ITEM = { platform: 'x', body: 'hello', scheduledAt: '2026-10-10T00:00:00Z', campaign: 'c1' };

function harness(item: Record<string, unknown> = ITEM, gate = { ok: true, output: '' }) {
  const writes = new Map<string, string>();
  const readFileImpl = vi.fn(() => JSON.stringify(item));
  const writeFileImpl = vi.fn((p: string, text: string) => void writes.set(String(p), text));
  const checkDraftsImpl = vi.fn(() => gate);
  return { writes, readFileImpl, writeFileImpl, checkDraftsImpl };
}

describe('stampTreeAuto', () => {
  it('stamps a draft the gate passed with a v4 stamp that the verifier accepts (and only with the key)', () => {
    const h = harness();
    const r = stampTreeAuto(['2026-10-10-a-x.json'], { pr: 12, at: AT, message: 'run 1', key: KEY, root: '/r', ...h });
    expect(r).toEqual({ ok: true, stamped: ['social/queue/2026-10-10-a-x.json'] });
    expect(h.checkDraftsImpl).toHaveBeenCalledWith(['social/queue/2026-10-10-a-x.json'], { root: '/r' });
    const written = JSON.parse([...h.writes.values()][0]);
    expect(written.approval).toMatchObject({ v: 4, kind: 'tree-auto', by: 'tree:auto', pr: 12, at: AT });
    expect(approvalStatus(written, { key: KEY })).toEqual({ ok: true, kind: 'tree-auto' });
    expect(approvalStatus(written, { key: 'other' }).ok).toBe(false);
  });

  it('writes NOTHING when the trusted check-drafts fails, and says why', () => {
    const h = harness(ITEM, { ok: false, output: 'FAIL voice: ai-tell' });
    const r = stampTreeAuto(['a.json', 'b.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/check-drafts did not pass/);
    expect(r.reason).toMatch(/ai-tell/);
    expect(h.writeFileImpl).not.toHaveBeenCalled();
  });

  it('runs the gate once over every file together (the pair rule needs both halves)', () => {
    const h = harness();
    stampTreeAuto(['a-x.json', 'a-ig.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(h.checkDraftsImpl).toHaveBeenCalledTimes(1);
    expect(h.checkDraftsImpl.mock.calls[0][0]).toEqual(['social/queue/a-x.json', 'social/queue/a-ig.json']);
    expect(h.writeFileImpl).toHaveBeenCalledTimes(2);
  });

  it('refuses without a signing key, a bad PR number, or no files — gate never even runs', () => {
    for (const bad of [{ key: '' }, { pr: 0 }, { pr: Number.NaN }, { files: [] as string[] }]) {
      const h = harness();
      const r = stampTreeAuto(bad.files ?? ['a.json'], { pr: 12, at: AT, key: KEY, ...h, ...bad });
      expect(r.ok).toBe(false);
      expect(h.checkDraftsImpl).not.toHaveBeenCalled();
      expect(h.writeFileImpl).not.toHaveBeenCalled();
    }
  });

  it('refuses path tricks: only a plain *.json basename under social/queue/', () => {
    for (const bad of ['a.txt', '.json', '-rf.json', 'a b.json', 'x/../../etc.json/']) {
      const h = harness();
      expect(stampTreeAuto([bad], { pr: 12, at: AT, key: KEY, ...h }).ok).toBe(false);
      expect(h.writeFileImpl).not.toHaveBeenCalled();
    }
  });

  it('refuses a draft that already carries any approval (never overwrites an owner stamp or a forgery)', () => {
    const h = harness({ ...ITEM, approval: { v: 3 } });
    const r = stampTreeAuto(['a.json'], { pr: 12, at: AT, key: KEY, ...h });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/already carries an approval/);
    expect(h.checkDraftsImpl).not.toHaveBeenCalled();
    expect(h.writeFileImpl).not.toHaveBeenCalled();
  });

  it('the real runCheckDrafts fails closed on a file that does not exist under social/queue/', () => {
    expect(runCheckDrafts(['social/queue/zz-definitely-missing-p3a.json']).ok).toBe(false);
  });
});

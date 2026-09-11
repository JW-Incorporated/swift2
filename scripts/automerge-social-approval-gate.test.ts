import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SOCIAL_QUEUE_PATH_RE,
  TRIPPING_STATUSES,
  STAMP_BRANCH_PREFIX,
  evaluateSocialApprovalGate,
} from './automerge-social-approval-gate.mjs';
import { ROOT } from './lib/generated-content.mjs';

describe('evaluateSocialApprovalGate', () => {
  it('declines a PR that adds a new social draft', () => {
    const r = evaluateSocialApprovalGate([
      { status: 'added', filename: 'social/queue/2026-09-10-launch-x.json' },
    ]);
    expect(r.blocked).toBe(true);
    expect(r.matches).toHaveLength(1);
  });

  it('still enables a PR that only REMOVES queue files (the poster fold-back PR)', () => {
    const r = evaluateSocialApprovalGate([
      { status: 'removed', filename: 'social/queue/2026-09-10-launch-x.json' },
      { status: 'added', filename: 'social/posted/2026-09-10-launch-x.json' },
    ]);
    expect(r.blocked).toBe(false);
    expect(r.matches).toEqual([]);
  });

  it('declines a PR that both adds and removes queue files', () => {
    const r = evaluateSocialApprovalGate([
      { status: 'removed', filename: 'social/queue/2026-09-09-old-x.json' },
      { status: 'added', filename: 'social/queue/2026-09-10-new-x.json' },
    ]);
    expect(r.blocked).toBe(true);
    expect(r.matches).toEqual([
      { status: 'added', filename: 'social/queue/2026-09-10-new-x.json' },
    ]);
  });

  it('ignores a modified file outside social/queue/', () => {
    const r = evaluateSocialApprovalGate([{ status: 'modified', filename: 'social/posted/x.json' }]);
    expect(r.blocked).toBe(false);
  });

  it('trips on every documented status except removed', () => {
    for (const status of TRIPPING_STATUSES) {
      const r = evaluateSocialApprovalGate([{ status, filename: 'social/queue/a.json' }]);
      expect(r.blocked, status).toBe(true);
    }
    expect(TRIPPING_STATUSES).not.toContain('removed');
  });

  it('SOCIAL_QUEUE_PATH_RE matches queue JSON only', () => {
    expect(SOCIAL_QUEUE_PATH_RE.test('social/queue/a.json')).toBe(true);
    expect(SOCIAL_QUEUE_PATH_RE.test('social/posted/a.json')).toBe(false);
    expect(SOCIAL_QUEUE_PATH_RE.test('social/queue/a.txt')).toBe(false);
  });

  it('does not trip on the poster\'s own retry bookkeeping (modified, social-poster/state-* branch)', () => {
    const r = evaluateSocialApprovalGate(
      [{ status: 'modified', filename: 'social/queue/2026-09-10-launch-x.json' }],
      'social-poster/state-20260910120000',
    );
    expect(r.blocked).toBe(false);
    expect(r.matches).toEqual([]);
  });

  it('still trips on an added draft from a social-poster/state-* branch (no smuggling a new draft in)', () => {
    const r = evaluateSocialApprovalGate(
      [{ status: 'added', filename: 'social/queue/2026-09-10-launch-x.json' }],
      'social-poster/state-20260910120000',
    );
    expect(r.blocked).toBe(true);
    expect(r.matches).toHaveLength(1);
  });

  it('still trips on a modified draft from a non-state branch', () => {
    const r = evaluateSocialApprovalGate(
      [{ status: 'modified', filename: 'social/queue/2026-09-10-launch-x.json' }],
      'content-shift/some-branch',
    );
    expect(r.blocked).toBe(true);
    expect(r.matches).toHaveLength(1);
  });

  // RULINGS-SOCIAL.md A2 — the approval stamper writes `approval` back into
  // an EXISTING queue file via its own `social-approval/stamp-<PR>` PR.
  it('does not trip on the stamper\'s own approval write (modified, social-approval/stamp-* branch)', () => {
    const r = evaluateSocialApprovalGate(
      [{ status: 'modified', filename: 'social/queue/2026-09-10-launch-x.json' }],
      `${STAMP_BRANCH_PREFIX}4130`,
    );
    expect(r.blocked).toBe(false);
    expect(r.matches).toEqual([]);
  });

  it('still trips on an added draft from a social-approval/stamp-* branch (no smuggling a new draft in)', () => {
    const r = evaluateSocialApprovalGate(
      [{ status: 'added', filename: 'social/queue/2026-09-10-launch-x.json' }],
      `${STAMP_BRANCH_PREFIX}4130`,
    );
    expect(r.blocked).toBe(true);
    expect(r.matches).toHaveLength(1);
  });
});

// ── the workflow must keep mirroring this gate (same "must not silently
//    drift" contract automerge-branch-author-gate.test.ts already enforces
//    for the branch/author gate) ────────────────────────────────────────
describe('the auto-merge workflow mirrors this gate', () => {
  const wf = readFileSync(join(ROOT, '.github/workflows/auto-merge-content.yml'), 'utf8');

  it('matches the same social/queue path pattern', () => {
    expect(wf).toContain('^social/queue/.*\\.json$');
  });

  it('references every tripping status', () => {
    for (const status of TRIPPING_STATUSES) {
      expect(wf, status).toContain(status);
    }
  });

  it('excludes "removed" from the tripping case (fold-back PRs still enable)', () => {
    const match = wf.match(/added\|modified\|renamed\|copied\|changed\)/);
    expect(match).not.toBeNull();
  });

  it('exempts only modified status on the social-poster/state-* and social-approval/stamp-* branch prefixes', () => {
    expect(wf).toContain('social-poster/state-*|social-approval/stamp-*) continue ;;');
  });
});

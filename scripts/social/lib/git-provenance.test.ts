import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { getQueueFileProvenance } from './git-provenance.mjs';

// Two Codex review rounds found local git metadata can't answer "who
// approved this" (see DEBUG.md) — the real mechanism shells out to `gh api`
// against the commit's associated-PRs endpoint. Every test here injects
// both `execFileImpl` (the git-log SHA lookup) and `runGhApi` (the gh call)
// so nothing ever spawns a real process.
describe('getQueueFileProvenance', () => {
  it('derives approvedBy/approvedAt from the merged PR associated with the latest commit touching the file', async () => {
    const execFileImpl = vi.fn(async () => ({ stdout: 'abc123deadbeef\n' }));
    const runGhApi = vi.fn(async () => 'joey\n2026-09-10T15:00:00Z\n');

    const result = await getQueueFileProvenance('social/queue/a-x.json', {
      cwd: '/repo',
      execFileImpl,
      repo: 'JW-Incorporated/swift2',
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: 'joey', approvedAt: '2026-09-10T15:00:00Z' });
    expect(execFileImpl).toHaveBeenCalledWith(
      'git',
      ['log', '--format=%H', '-1', '--', 'social/queue/a-x.json'],
      { cwd: '/repo' },
    );
    expect(runGhApi).toHaveBeenCalledWith('abc123deadbeef', 'JW-Incorporated/swift2');
  });

  it('returns nulls when the commit has no associated PR (e.g. a direct push)', async () => {
    const execFileImpl = vi.fn(async () => ({ stdout: 'abc123\n' }));
    const runGhApi = vi.fn(async () => 'null\nnull\n');

    const result = await getQueueFileProvenance('social/queue/a-x.json', {
      execFileImpl,
      repo: 'JW-Incorporated/swift2',
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: null, approvedAt: null });
  });

  it('returns nulls when there is no git history for the file at all', async () => {
    const execFileImpl = vi.fn(async () => ({ stdout: '' }));
    const runGhApi = vi.fn();

    const result = await getQueueFileProvenance('social/queue/never-committed.json', {
      execFileImpl,
      repo: 'JW-Incorporated/swift2',
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: null, approvedAt: null });
    expect(runGhApi).not.toHaveBeenCalled();
  });

  it('returns nulls when repo is unknown — never even attempts the git/API lookup', async () => {
    // `repo: null`, not `repo: undefined` — a destructuring default only
    // applies for an `undefined` value, so `undefined` here would silently
    // fall through to the REAL `process.env.GITHUB_REPOSITORY`. That env
    // var is always set in an actual GitHub Actions run (unlike this local
    // sandbox), which is exactly how this test passed locally but failed in
    // CI: it wasn't actually exercising the "repo unknown" branch there at
    // all. `null` is a genuinely falsy override that bypasses the default.
    const execFileImpl = vi.fn();
    const runGhApi = vi.fn();

    const result = await getQueueFileProvenance('social/queue/a-x.json', {
      repo: null,
      execFileImpl,
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: null, approvedAt: null });
    expect(execFileImpl).not.toHaveBeenCalled();
    expect(runGhApi).not.toHaveBeenCalled();
  });

  it('falls back to nulls instead of throwing when the gh API call fails (network hiccup, unauthenticated, gh missing)', async () => {
    const execFileImpl = vi.fn(async () => ({ stdout: 'abc123\n' }));
    const runGhApi = vi.fn(async () => {
      throw new Error('gh: authentication required');
    });

    const result = await getQueueFileProvenance('social/queue/a-x.json', {
      execFileImpl,
      repo: 'JW-Incorporated/swift2',
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: null, approvedAt: null });
  });

  it('falls back to nulls instead of throwing when the git-log lookup itself fails', async () => {
    const execFileImpl = vi.fn(async () => {
      throw new Error('fatal: not a git repository');
    });
    const runGhApi = vi.fn();

    const result = await getQueueFileProvenance('social/queue/a-x.json', {
      execFileImpl,
      repo: 'JW-Incorporated/swift2',
      runGhApi,
    });

    expect(result).toEqual({ approvedBy: null, approvedAt: null });
    expect(runGhApi).not.toHaveBeenCalled();
  });
});

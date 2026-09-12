// The notifier's already-stamped filter, run as the CLI social-approval-
// notify.yml invokes it, against REAL git (a throwaway bare origin that
// carries refs/pull/<n>/head, and a main-only clone standing in for the
// job's checkout). PR #4139 round 4 (Codex HIGH): a draft whose stamp is
// still content-valid but no longer covers the branch (a `why`-only drift,
// image bytes, a v2 stamp) used to be filtered as "already stamped", and
// when every draft was, the whole prompt — header included — was
// suppressed. That starved the redesign's own recovery path: the founder
// never saw a fresh header to ✅. Ran against the pre-fix CLI first and
// failed (PR body).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { contentHash, signApproval } from './lib/queue.mjs';

const SCRIPT = fileURLToPath(new URL('./filter-already-stamped.mjs', import.meta.url));
const REL_FILE = 'social/queue/2026-09-20-example-x.json';
const BASE_ITEM = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
const PR = 4200;

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function stampedAt(sha: string) {
  const unsigned = { v: 3, by: SOCIAL_APPROVERS[0], at: '2026-09-10T00:00:00Z', pr: PR, sha, message: '1', contentHash: contentHash(BASE_ITEM) };
  return { ...BASE_ITEM, approval: { ...unsigned, sig: signApproval(unsigned, 'test-key') } };
}

/** What the workflow's jq projection emits for one draft at the PR head. */
function manifestRow(item: Record<string, unknown>) {
  const pick = (k: string) => (k in item ? item[k] : null);
  return {
    file: REL_FILE,
    platform: pick('platform'),
    body: pick('body'),
    scheduledAt: pick('scheduledAt'),
    campaign: pick('campaign'),
    mediaCredit: pick('mediaCredit'),
    media: pick('media'),
    mediaKind: pick('mediaKind'),
    altText: pick('altText'),
    why: pick('why'),
    lane: pick('lane'),
    approval: pick('approval'),
  };
}

/** origin.git with main at C0 (unstamped) and refs/pull/<PR>/head at the
 * given history; returns a main-only clone (the notifier's checkout) and
 * the SHAs. */
function buildRepos(sandbox: string, { drift }: { drift: boolean }) {
  const origin = join(sandbox, 'origin.git');
  const author = join(sandbox, 'author');
  git(sandbox, ['init', '--bare', '-q', origin]);
  git(sandbox, ['init', '-q', '-b', 'main', author]);
  git(author, ['config', 'user.name', 'test']);
  git(author, ['config', 'user.email', 'test@example.com']);
  mkdirSync(join(author, 'social', 'queue'), { recursive: true });
  const write = (item: unknown) => writeFileSync(join(author, REL_FILE), JSON.stringify(item, null, 2) + '\n');
  write(BASE_ITEM);
  git(author, ['add', '-A']);
  git(author, ['commit', '-q', '-m', 'draft']);
  git(author, ['remote', 'add', 'origin', origin]);
  git(author, ['push', '-q', 'origin', 'HEAD:main']);
  const c0 = git(author, ['rev-parse', 'HEAD']);
  const stamped = stampedAt(c0); // minted by a poll run that looked at C0
  write(stamped);
  git(author, ['add', '-A']);
  git(author, ['commit', '-q', '-m', 'social-approval: stamp']);
  if (drift) {
    write({ ...stamped, why: 'a rationale nobody approved' }); // unhashed — the signature still verifies
    git(author, ['add', '-A']);
    git(author, ['commit', '-q', '-m', 'tweak why']);
  }
  git(author, ['push', '-q', 'origin', `HEAD:refs/pull/${PR}/head`]);
  const head = git(author, ['rev-parse', 'HEAD']);
  const headItem = JSON.parse(readFileSync(join(author, REL_FILE), 'utf8'));
  const notifier = join(sandbox, 'notifier');
  git(sandbox, ['clone', '-q', '-b', 'main', origin, notifier]); // main only — no pull refs, like actions/checkout
  return { notifier, head, headItem };
}

function runFilter(cwd: string, manifestPath: string, head: string) {
  return execFileSync('node', [SCRIPT, manifestPath, '--pr', String(PR), '--head', head], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

describe('filter-already-stamped.mjs (CLI, real git)', () => {
  it('HIGH: a why-only drift after a valid v3 stamp is NOT filtered — the founder gets a fresh brief (header included) to re-✅', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'filter-stamped-'));
    try {
      const { notifier, head, headItem } = buildRepos(sandbox, { drift: true });
      const manifestPath = join(sandbox, 'drafts.json');
      writeFileSync(manifestPath, JSON.stringify([manifestRow(headItem)]));

      const out = runFilter(notifier, manifestPath, head);

      expect(out).not.toContain('already-stamped: all drafts filtered');
      const remaining = JSON.parse(readFileSync(manifestPath, 'utf8'));
      expect(remaining).toHaveLength(1);
      expect(remaining[0].file).toBe(REL_FILE);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  }, 30_000);

  it('a stamped draft whose stamp still covers the branch IS filtered — B1\'s "never re-brief on a synchronize" still holds', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'filter-stamped-'));
    try {
      const { notifier, head, headItem } = buildRepos(sandbox, { drift: false });
      const manifestPath = join(sandbox, 'drafts.json');
      writeFileSync(manifestPath, JSON.stringify([manifestRow(headItem)]));

      const out = runFilter(notifier, manifestPath, head);

      expect(out).toContain('already-stamped: all drafts filtered');
      expect(JSON.parse(readFileSync(manifestPath, 'utf8'))).toEqual([]);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  }, 30_000);
});

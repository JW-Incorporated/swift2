// Workflow-invariant tests for the social-poster stale-ledger guard and the
// auto-merge hardening added for issue #2031 (PR #2039). These assert on the
// YAML text — same convention as automerge-content-guard.test.ts — because the
// behaviors they pin are safety controls that must not be silently droppable
// or renamable in an "unrelated cleanup".

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('social-poster.yml — stale-ledger guard (issue #2031)', () => {
  const wf = read('.github/workflows/social-poster.yml');

  it('defines the state-branch prefix exactly once, as STATE_BRANCH_PREFIX', () => {
    // The guard's PR filter and the commit step's branch mint MUST share one
    // definition. If the literal appears more than once, someone re-inlined
    // it and a rename can desync the two — the guard would then match nothing
    // and fail OPEN (silently back to pre-#2031 behavior).
    expect(wf).toContain('STATE_BRANCH_PREFIX: social-poster/state-');
    const literalCount = wf.split('social-poster/state-').length - 1;
    expect(literalCount, 'the raw prefix literal must appear ONLY in the env definition').toBe(1);
  });

  it('both the guard and the branch mint use the shared prefix variable', () => {
    expect(wf).toContain('startswith(\\"$STATE_BRANCH_PREFIX\\")');
    expect(wf).toContain('BRANCH="${STATE_BRANCH_PREFIX}$(date -u +%Y%m%d%H%M%S)"');
  });

  it('refuses to post while a queue-state PR is open, and fails closed on API errors', () => {
    expect(wf).toContain('Refuse to post while a queue-state PR is still open');
    // both refusal paths must be hard exits, and the API-error path must be
    // distinguishable from a genuine stale ledger
    expect(wf).toContain('Refusing to post this run');
    expect(wf).toContain('NOT a stale ledger');
  });

  it('enumerates open PRs with full pagination, not a truncatable list window', () => {
    // `gh pr list --limit N` filters client-side over a window; an OLD
    // stranded state PR is exactly what falls off it. The guard must paginate.
    expect(wf).toContain('gh api --paginate "repos/$REPO/pulls?state=open&base=main');
    expect(wf).not.toContain('gh pr list --state open --limit');
  });

  it('checks SOCIAL_FREEZE before the guard, so frozen runs are green no-ops', () => {
    const freezeAt = wf.indexOf('id: freeze');
    const guardAt = wf.indexOf('Refuse to post while a queue-state PR');
    expect(freezeAt).toBeGreaterThan(-1);
    expect(guardAt).toBeGreaterThan(freezeAt);
    // the posting step itself must be gated on the freeze output
    expect(wf).toContain("if: steps.freeze.outputs.frozen != 'true'");
  });

  it('fast-forwards the checkout after the guard passes (checkout→guard race)', () => {
    const guardAt = wf.indexOf('Refuse to post while a queue-state PR');
    const ffAt = wf.indexOf('git merge --ff-only FETCH_HEAD');
    expect(ffAt).toBeGreaterThan(guardAt);
  });

  it('warns in the state-PR body that closing (not merging) loses the ledger', () => {
    expect(wf).toContain('Never CLOSE this PR');
  });
});

describe('auto-merge-content.yml — #2031 hardening', () => {
  const wf = read('.github/workflows/auto-merge-content.yml');

  it('skips REMOVED files when fetching PR content (renames reported as removed+added)', () => {
    // Both fetch loops (check-drafts and guard-code) 404'd on a removed
    // file's head-SHA content; a removed file has nothing to validate or scan.
    const occurrences = wf.split(`$1 != "removed"`).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it('the enable job runs on !cancelled() so it can disarm after a failed dependency', () => {
    expect(wf).toContain('!cancelled()');
    expect(wf).toContain('CHECK_DRAFTS_RESULT');
    expect(wf).toContain('GUARD_CODE_RESULT');
  });

  it('enforces the append-only ledger constraint on social/posted|failed', () => {
    expect(wf).toContain('LEDGER INTEGRITY');
    expect(wf).toContain('^social/(posted|failed)/');
    expect(wf).toContain('declined — ledger rewrite');
  });
});

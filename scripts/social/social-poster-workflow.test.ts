// Workflow-invariant tests for the social-poster ledger mechanics. These
// assert on the YAML text — same convention as automerge-content-guard.test.ts
// — because the behaviors they pin are safety controls that must not be
// silently droppable or renamable in an "unrelated cleanup".

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('social-poster.yml — social-ledger direct-push dedupe (issue #2040)', () => {
  const wf = read('.github/workflows/social-poster.yml');

  it('defines LEDGER_BRANCH and STATE_BRANCH_PREFIX exactly once each, as shared env vars', () => {
    // Two independent branch-naming schemes now share this file — the ledger
    // branch dedupe correctness reads from/writes to, and the throwaway
    // state-PR branches behind the now-visibility-only fold-back PR. Each
    // must be defined in exactly one place so a rename can't silently
    // desync a reader from a writer.
    expect(wf).toContain('LEDGER_BRANCH: social-ledger');
    expect(wf).toContain('STATE_BRANCH_PREFIX: social-poster/state-');
    const stateLiteralCount = wf.split('social-poster/state-').length - 1;
    expect(stateLiteralCount, 'the raw state-PR prefix literal must appear ONLY in the env definition').toBe(1);
  });

  it('every git command targeting the ledger branch uses $LEDGER_BRANCH, never a hardcoded ref', () => {
    // The mechanism this file depends on for correctness (issue #2040) is
    // that the read step and the write step agree on which branch they mean.
    // A raw `refs/heads/social-ledger` or `origin/social-ledger` sitting in
    // a git command instead of the variable would defeat a future rename
    // silently — same class of bug the old state-branch-prefix test guarded.
    expect(wf).not.toContain('refs/heads/social-ledger');
    expect(wf).not.toContain('origin/social-ledger');
    expect(wf).toContain('origin "$LEDGER_BRANCH"');
    expect(wf).toContain('origin/$LEDGER_BRANCH');
    expect(wf).toContain('refs/heads/$LEDGER_BRANCH');
  });

  it('retires the old fail-closed stale-ledger guard (main-PR-merge dependency is gone)', () => {
    // The guard added for issue #2031/PR #2039 refused to post while a
    // queue-state PR was open, because main's own social/posted/ could be
    // stale. That premise is retired: dedupe no longer reads main alone.
    expect(wf).not.toContain('Refuse to post while a queue-state PR is still open');
    expect(wf).not.toContain('Refusing to post this run');
  });

  it('reads the ledger additively (union with main), before posting anything', () => {
    const readAt = wf.indexOf('Read the posted/failed ledger from social-ledger');
    const postAt = wf.indexOf('- name: Post due queue items');
    expect(readAt).toBeGreaterThan(-1);
    expect(postAt).toBeGreaterThan(readAt);
    // `git archive ... | tar -x` only ever writes files present on the
    // ledger tip — it can never delete a file the main checkout already
    // has, which is what makes this a union rather than an overwrite.
    expect(wf).toContain('git archive FETCH_HEAD $PATHS | tar -x');
  });

  it('never overlays social/queue from the ledger branch (2026-09-06, kanban t_e7ce7fe8)', () => {
    // The additive-only overlay is exactly right for posted/failed (an
    // append-only ledger) but wrong for queue/, which main must be free to
    // delete from directly (a founder retiring a stale draft, e.g. PR
    // #3817). Overlaying queue here can only ever resurrect an
    // already-deleted draft from a lagging ledger-branch tree, and because
    // a resurrected appearance-lane item is already >48h past scheduledAt,
    // it gets immediately re-retired to failed/ by the very same run —
    // exactly what happened to 2026-09-01-appearance-T6iTnTV-Rgw.
    const forLoopMatch = wf.match(/for d in ([^;]+); do/);
    expect(forLoopMatch).not.toBeNull();
    const dirs = forLoopMatch![1].trim().split(/\s+/);
    expect(dirs).toEqual(['social/posted', 'social/failed']);
    expect(dirs).not.toContain('social/queue');
  });

  it('the ledger read degrades gracefully instead of failing when a dir is empty on the ledger tip', () => {
    // `git archive` errors on a pathspec absent from the tree. Relying on
    // social/queue/.gitkeep to always exist would make that failure mode
    // silent until someone removes it; the read step checks existence first.
    expect(wf).toContain('git cat-file -e "FETCH_HEAD:$d"');
  });

  it('pushes the ledger update directly (no PR) immediately after posting, before any email step', () => {
    const postAt = wf.indexOf('- name: Post due queue items');
    const pushAt = wf.indexOf('- name: Push ledger update directly to social-ledger');
    const notifyAt = wf.indexOf('- name: Notify founder of successful posts');
    const foldbackAt = wf.indexOf('- name: Fold ledger back into main');
    expect(pushAt).toBeGreaterThan(postAt);
    expect(pushAt).toBeLessThan(notifyAt);
    expect(pushAt).toBeLessThan(foldbackAt);
    expect(wf).toContain(
      "if: always() && (steps.post.conclusion == 'success' || steps.post.conclusion == 'failure')",
    );
  });

  it('the ledger push is a plain fast-forward, never --force', () => {
    // Force-pushing here would be able to silently discard state; the
    // design instead parents each new commit on the branch's own previous
    // tip so every push is a genuine fast-forward, and a genuine conflict
    // fails the step (and reddens the run) instead of overwriting anything.
    // (The comments below explain this choice and mention "--force" in
    // prose, so assert on the actual command, not the bare substring.)
    expect(wf).not.toMatch(/git push (--force|-f)\b/);
  });

  it('the ledger push builds its commit via write-tree/commit-tree, not a branch-consuming `git commit`', () => {
    // A plain `git commit` here would advance this checkout's own HEAD and
    // consume the staged diff the fold-back PR step below still needs to
    // build its own commit from the same working tree.
    expect(wf).toContain('git write-tree');
    expect(wf).toContain('git commit-tree');
  });

  it('the fold-back PR into main is explicitly downgraded to visibility-only, but still asks to be merged not closed', () => {
    const wfLower = wf;
    expect(wfLower).toContain('Fold ledger back into main (via PR — visibility only, not correctness-critical)');
    expect(wfLower).toContain('Please still merge, not close');
  });

  it('checks SOCIAL_FREEZE before every other step, so frozen runs are green no-ops', () => {
    const freezeAt = wf.indexOf('id: freeze');
    const readAt = wf.indexOf('Read the posted/failed ledger from social-ledger');
    expect(freezeAt).toBeGreaterThan(-1);
    expect(readAt).toBeGreaterThan(freezeAt);
    expect(wf).toContain("if: steps.freeze.outputs.frozen != 'true'");
  });
});

describe('social-poster.yml — founder success email (2026-08-25 decision)', () => {
  const wf = read('.github/workflows/social-poster.yml');

  it('routes SOCIAL_POSTER_NOTIFY through the shared mailer, not a new send path', () => {
    // Must reuse scripts/watchdog/send-mail.py — the same proven delivery
    // path watchdog.yml/brief-mailer.yml already use — never invent a
    // second way to send mail from this repo.
    expect(wf).toContain('SOCIAL_POSTER_NOTIFY');
    expect(wf).toContain('scripts/watchdog/send-mail.py');
  });

  it('the notify step runs whenever the poster ran, even if the run also failed', () => {
    const postAt = wf.indexOf('id: post');
    // The header comment mentions this step by name too, so search for the
    // step itself (- name: ...) starting after the posting step's id.
    const notifyAt = wf.indexOf('- name: Notify founder of successful posts', postAt);
    expect(notifyAt).toBeGreaterThan(postAt);
    expect(wf).toContain("if: always() && (steps.post.conclusion == 'success' || steps.post.conclusion == 'failure')");
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

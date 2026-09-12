// Workflow-invariant tests for the social-poster ledger mechanics. These
// assert on the YAML text — same convention as automerge-content-guard.test.ts
// — because the behaviors they pin are safety controls that must not be
// silently droppable or renamable in an "unrelated cleanup".

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
    const readAt = wf.indexOf('Read the posted/failed/feedback ledger from social-ledger');
    const postAt = wf.indexOf('- name: Post due queue items');
    expect(readAt).toBeGreaterThan(-1);
    expect(postAt).toBeGreaterThan(readAt);
    // `git archive ... | tar -x` only ever writes files present on the
    // ledger tip — it can never delete a file the main checkout already
    // has, which is what makes this a union rather than an overwrite.
    expect(wf).toContain('git archive FETCH_HEAD $PATHS | tar -x');
  });

  it('never overlays social/queue from the ledger branch (2026-09-06, kanban t_e7ce7fe8)', () => {
    // The additive-only overlay is exactly right for posted/failed/feedback
    // (append-only ledgers this workflow doesn't own but must not silently
    // revert — social/feedback added 2026-09-11, Codex round-1 review on PR
    // #4139 finding 6: the write step below snapshots the WHOLE checkout,
    // so any ledger namespace not overlaid here gets reverted to main's
    // lagging copy) but wrong for queue/, which main must be free to delete
    // from directly (a founder retiring a stale draft, e.g. PR #3817).
    // Overlaying queue here can only ever resurrect an already-deleted
    // draft from a lagging ledger-branch tree, and because a resurrected
    // appearance-lane item is already >48h past scheduledAt, it gets
    // immediately re-retired to failed/ by the very same run — exactly what
    // happened to 2026-09-01-appearance-T6iTnTV-Rgw.
    const forLoopMatch = wf.match(/for d in ([^;]+); do/);
    expect(forLoopMatch).not.toBeNull();
    const dirs = forLoopMatch![1].trim().split(/\s+/);
    expect(dirs).toEqual(['social/posted', 'social/failed', 'social/feedback']);
    expect(dirs).not.toContain('social/queue');
  });

  it('the ledger commit preserves social/feedback without treating it alone as a reason to push (2026-09-11, PR #4139 finding 6)', () => {
    // The write step below snapshots the WHOLE checkout via write-tree, not
    // a partial diff, so social/feedback must be staged too or this
    // workflow's very first ledger commit after S3 would silently revert
    // every feedback row social-approval-poll.mjs has recorded since main's
    // last (visibility-only) fold-back. It must NOT, by itself, count
    // toward "is there anything to push this run" — that stays scoped to
    // this workflow's own queue/posted/failed, so a run that posted nothing
    // doesn't push a redundant no-op commit just because feedback lags main.
    expect(wf).toContain('git add social/queue social/posted social/failed social/feedback');
    expect(wf).toContain('git diff --cached --quiet -- social/queue social/posted social/failed');
  });

  it('the ledger read degrades gracefully instead of failing when a dir is empty on the ledger tip', () => {
    // `git archive` errors on a pathspec absent from the tree. Relying on
    // social/queue/.gitkeep to always exist would make that failure mode
    // silent until someone removes it; the read step checks existence first.
    expect(wf).toContain('git cat-file -e "FETCH_HEAD:$d"');
  });

  it('pushes the ledger update directly (no PR) immediately after posting, before any alert step', () => {
    const postAt = wf.indexOf('- name: Post due queue items');
    const pushAt = wf.indexOf('- name: Push ledger update directly to social-ledger');
    const alertAt = wf.indexOf('- name: Alert on a permanent post failure');
    const foldbackAt = wf.indexOf('- name: Fold ledger back into main');
    expect(pushAt).toBeGreaterThan(postAt);
    expect(pushAt).toBeLessThan(alertAt);
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

  it('the ledger push retries on a non-fast-forward instead of failing on the first attempt (DEBUG.md round-2 finding 3)', () => {
    // social-approval-poll.yml pushes to the SAME $LEDGER_BRANCH from a
    // separate concurrency group — a genuine concurrent write here is
    // expected, not exceptional. A single-shot push would let one workflow's
    // rejected push strand its posted/failed rows, risking a duplicate
    // real-world post on a later run. Bounded so a truly stuck branch still
    // fails loudly instead of looping forever.
    const pushSection = wf.slice(wf.indexOf('- name: Push ledger update directly to social-ledger'));
    expect(pushSection).toContain('MAX_ATTEMPTS=5');
    expect(pushSection).toContain('while true; do');
    expect(pushSection).toMatch(/if git push origin "\$NEW_COMMIT:refs\/heads\/\$LEDGER_BRANCH"; then/);
    expect(pushSection).toContain('git fetch origin "$LEDGER_BRANCH"');
    expect(pushSection).toContain('::error::social-poster: push to $LEDGER_BRANCH failed after $MAX_ATTEMPTS attempts');
    expect(pushSection).toMatch(/exit 1/);
  });

  it('the fold-back PR into main is explicitly downgraded to visibility-only, but still asks to be merged not closed', () => {
    const wfLower = wf;
    expect(wfLower).toContain('Fold ledger back into main (via PR — visibility only, not correctness-critical)');
    expect(wfLower).toContain('Please still merge, not close');
  });

  it('checks SOCIAL_FREEZE before every other step, so frozen runs are green no-ops', () => {
    const freezeAt = wf.indexOf('id: freeze');
    const readAt = wf.indexOf('Read the posted/failed/feedback ledger from social-ledger');
    expect(freezeAt).toBeGreaterThan(-1);
    expect(readAt).toBeGreaterThan(freezeAt);
    expect(wf).toContain("if: steps.freeze.outputs.frozen != 'true'");
  });
});

describe('social-poster.yml — permanent-failure alert (Marjorie Overhaul C3, retiring bot email)', () => {
  const wf = read('.github/workflows/social-poster.yml');

  it('the per-post success email is retired outright, not renamed or re-routed', () => {
    // docs/specs/marjorie-overhaul/c3-email-retired.md: the brief's "Since
    // yesterday" section counts social/posted/*.json instead (fetchPostedSince).
    // post-queue.mjs still writes SOCIAL_POSTER_NOTIFY's payload file (out of
    // scope for this task -- see PLAN.md), it's just unread here now.
    expect(wf).not.toContain('Notify founder of successful posts');
  });

  it('routes the permanent-failure alert through the shared upsert-alert.sh path, not a new send path', () => {
    const postAt = wf.indexOf('id: post');
    const failAt = wf.indexOf('- name: Alert on a permanent post failure', postAt);
    expect(failAt).toBeGreaterThan(postAt);
    const failSection = wf.slice(failAt);
    expect(failSection).toContain("if: always() && steps.post.outcome == 'failure'");
    expect(failSection).toContain(
      'scripts/watchdog/upsert-alert.sh open "Watchdog: a social post permanently failed"',
    );
    // `post` runs under environment: social, not ops -- upsert-alert.sh's
    // Discord leg finds DISCORD_MARJORIE_WEBHOOK_URL empty here and falls
    // back to send-mail.py, so these two must stay until HA closes the gap.
    expect(failSection).toContain('MARJORIE_EMAIL');
    expect(failSection).toContain('GMAIL_APP_PASSWORD');
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

// The push step's `run:` body executed for real (bash + git in a throwaway
// pair of repos) — the DEBUG.md architect verdict's R2-3 closure: a retry
// after a non-fast-forward must rebuild its tree from the FRESH ledger tip
// and stage only this workflow's own namespaces, never re-push a stale
// full-tree snapshot that silently reverts feedback rows the poll pushed in
// between. Ran against the pre-redesign step first and failed (PR #4139 body).
describe('social-poster.yml — ledger push step, executed', () => {
  const wf = read('.github/workflows/social-poster.yml');
  const hasBash = (() => {
    try {
      execFileSync('bash', ['-c', 'true'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  /** The `run: |` body of the push step, dedented — the same bytes CI runs. */
  function pushStepScript(): string {
    const lines = wf.split('\n');
    const start = lines.findIndex((l) => l.includes('- name: Push ledger update directly to social-ledger'));
    expect(start).toBeGreaterThan(-1);
    const runAt = lines.findIndex((l, i) => i > start && /^\s+run: \|\s*$/.test(l));
    expect(runAt).toBeGreaterThan(start);
    const indent = lines[runAt + 1].match(/^(\s*)/)![1].length;
    const body: string[] = [];
    for (let i = runAt + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === '') {
        body.push('');
        continue;
      }
      if (l.match(/^(\s*)/)![1].length < indent) break;
      body.push(l.slice(indent));
    }
    return body.join('\n');
  }

  const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

  it.skipIf(!hasBash)(
    "R5: a retry that races an interleaved social-approval-poll push keeps the poll's feedback rows AND lands this run's posted/failed rows",
    () => {
      const sandbox = mkdtempSync(join(tmpdir(), 'social-poster-push-'));
      try {
        const origin = join(sandbox, 'origin.git');
        const work = join(sandbox, 'work');
        const poll = join(sandbox, 'poll');
        git(sandbox, ['init', '--bare', '-q', origin]);
        git(sandbox, ['init', '-q', '-b', 'main', work]);
        git(work, ['config', 'user.name', 'test']);
        git(work, ['config', 'user.email', 'test@example.com']);
        for (const d of ['social/queue', 'social/posted', 'social/failed', 'social/feedback']) {
          mkdirSync(join(work, d), { recursive: true });
          writeFileSync(join(work, d, '.gitkeep'), '');
        }
        writeFileSync(join(work, 'social/queue/item.json'), '{"body":"due"}\n');
        git(work, ['add', '-A']);
        git(work, ['commit', '-q', '-m', 'main']);
        git(work, ['remote', 'add', 'origin', origin]);
        git(work, ['push', '-q', 'origin', 'HEAD:main']);
        git(work, ['push', '-q', 'origin', 'HEAD:social-ledger']); // the ledger's first tip = main
        // What the "Read the ledger" step leaves behind: the remote ref materialized at THIS (soon stale) tip.
        git(work, ['fetch', '-q', 'origin', 'social-ledger']);
        git(work, ['update-ref', 'refs/remotes/origin/social-ledger', 'FETCH_HEAD']);

        // The interleaved poll push: social-ledger advances with a feedback row after `work` read it.
        git(sandbox, ['clone', '-q', '-b', 'social-ledger', origin, poll]);
        git(poll, ['config', 'user.name', 'poll']);
        git(poll, ['config', 'user.email', 'poll@example.com']);
        const row = '{"pr":1,"file":"social/queue/other.json","action":"approve"}';
        writeFileSync(join(poll, 'social/feedback/2026-W37.jsonl'), row + '\n');
        git(poll, ['add', 'social/feedback/2026-W37.jsonl']);
        git(poll, ['commit', '-q', '-m', 'social-feedback: 1 reaction(s) recorded']);
        git(poll, ['push', '-q', 'origin', 'HEAD:social-ledger']);

        // This run's own posting: the due item moved from queue/ to posted/ in the working tree.
        rmSync(join(work, 'social/queue/item.json'));
        writeFileSync(join(work, 'social/posted/item.json'), '{"body":"due","postedAt":"2026-09-12T00:00:00Z"}\n');

        execFileSync('bash', ['-c', pushStepScript()], {
          cwd: work,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, LEDGER_BRANCH: 'social-ledger' },
        });

        const tip = git(origin, ['rev-parse', 'social-ledger']);
        const paths = git(origin, ['ls-tree', '-r', '--name-only', tip]).split('\n');
        expect(paths).toContain('social/feedback/2026-W37.jsonl'); // the poll's row survived the retry
        expect(git(origin, ['show', `${tip}:social/feedback/2026-W37.jsonl`])).toBe(row);
        expect(paths).toContain('social/posted/item.json'); // this run's own row landed
        expect(paths).not.toContain('social/queue/item.json');
        expect(git(origin, ['rev-list', '--count', tip])).toBe('3'); // main, the poll's commit, this push — a genuine fast-forward
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    },
    30_000,
  );
});

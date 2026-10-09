// Workflow-invariant tests for social-tree-approve.yml (P3, Tree's autonomous
// approval). Same convention as social-poster-workflow.test.ts: assert on the
// YAML text so the safety controls can't be dropped in an unrelated cleanup.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');
// Comments (the header prose) are stripped so assertions pin executable text only.
const wf = read('.github/workflows/social-tree-approve.yml')
  .split('\n')
  .filter((l) => !/^\s*#/.test(l))
  .join('\n');
const notify = read('.github/workflows/social-approval-notify.yml');
const poster = read('.github/workflows/social-poster.yml');

describe('social-tree-approve.yml', () => {
  it('is workflow_dispatch-only with a `pr` input, in the main-only `social` environment, one concurrency group per PR', () => {
    expect(wf).toMatch(/^on:\n {2}workflow_dispatch:\n {4}inputs:\n {6}pr:/m);
    expect(wf).not.toMatch(/^ {2}(schedule|pull_request|pull_request_target|push|workflow_run):/m);
    expect(wf).toContain('environment: social');
    expect(wf).toContain("if: github.ref == 'refs/heads/main'");
    expect(wf).toContain('group: social-tree-approve-${{ inputs.pr }}');
  });

  it('never interpolates the dispatch input into a script — it goes through env and a digits-only check', () => {
    expect(wf).toContain('PR_INPUT: ${{ inputs.pr }}');
    expect(wf).toContain('[[ "$PR_INPUT" =~ ^[0-9]{1,8}$ ]]');
    const runBodies = wf.split(/^ {8}run: \|/m).slice(1).join('\n');
    expect(runBodies).not.toMatch(/\$\{\{\s*(inputs|github\.event)\./);
  });

  it('refuses while SOCIAL_FREEZE is set, using the same truthiness as the poster', () => {
    expect(wf).toContain('FREEZE: ${{ vars.SOCIAL_FREEZE }}');
    expect(wf).toContain('[ -n "${FREEZE:-}" ] && [ "$FREEZE" != "false" ] && [ "$FREEZE" != "0" ]');
    expect(poster).toContain('[ -n "${FREEZE:-}" ] && [ "$FREEZE" != "false" ] && [ "$FREEZE" != "0" ]');
    expect(wf.indexOf('SOCIAL_FREEZE is set')).toBeLessThan(wf.indexOf('secrets.SOCIAL_APPROVAL_KEY'));
  });

  it('only accepts same-repo, OPEN, main-targeting tree/draft/* PRs that touch only queue json + social media, added/modified only', () => {
    expect(wf).toContain('tree/draft/*) : ;;');
    expect(wf).toContain('[ "$CROSS" = "false" ]');
    expect(wf).toContain('[ "$STATE" = "OPEN" ]');
    expect(wf).toContain('[ "$BASE" = "main" ]');
    expect(wf).toContain("QUEUE_RE='^social/queue/[A-Za-z0-9][A-Za-z0-9._-]*\\.json$'");
    expect(wf).toContain("MEDIA_RE='^apps/web/public/social/[A-Za-z0-9._/-]+$'");
    expect(wf).toContain('added|modified) : ;;');
    expect(wf).toContain('is outside social/queue/*.json and apps/web/public/social/** — refusing');
  });

  it('runs main\'s code on the PR\'s files as data: the PR is never checked out into the workspace, and the stamp key reaches only the mint step', () => {
    expect(wf).toContain('ref: main');
    expect(wf).toContain('-H "Accept: application/vnd.github.raw" "repos/$REPO/contents/$f?ref=$HEAD_SHA"');
    expect(wf).not.toMatch(/gh pr checkout|git checkout [^\n]*HEAD_SHA|actions\/checkout@v7\n\s+with:\n\s+ref: \$\{\{/);
    expect(wf).toContain('git worktree add --detach "$RUNNER_TEMP/pr-branch" "$HEAD_SHA"');
    expect(wf.match(/SOCIAL_APPROVAL_KEY: \$\{\{ secrets\.SOCIAL_APPROVAL_KEY \}\}/g)).toHaveLength(1);
    expect(wf).toContain('node scripts/social/stamp-tree-auto.mjs');
  });

  it('commits with the real-user PAT so CI runs on the stamp, waits for the required `build`, and merges pinned to the stamp commit', () => {
    expect(wf).toContain('GH_TOKEN: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(wf).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(wf).toContain('select(.name == "build")');
    expect(wf).toContain('gh pr checks "$PR" --repo "$REPO" --required --watch --fail-fast');
    expect(wf).toContain('--squash --delete-branch --match-head-commit "$STAMP_SHA"');
    expect(wf).not.toMatch(/--force|push -f|--no-verify/);
  });

  it('does not dispatch, post or send anything, and never touches the caps', () => {
    expect(wf).not.toMatch(/post-queue|workflow run|gh workflow|MAX_POSTS/);
  });
});

describe('social-approval-notify.yml — tree/draft/* gets no per-post prompt', () => {
  it('notify-new skips head refs starting tree/draft/', () => {
    expect(notify).toMatch(/notify-new:\n(?: {4}#[^\n]*\n)+ {4}if: github\.event_name == 'pull_request_target' && !startsWith\(github\.event\.pull_request\.head\.ref, 'tree\/draft\/'\)/);
  });
});

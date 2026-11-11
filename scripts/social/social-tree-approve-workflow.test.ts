// Workflow-wiring tests for social-tree-approve.yml (P3, Tree's autonomous
// approval). The DECISIONS live in tree-approve-gate.mjs and are unit-tested in
// tree-approve-gate.test.ts / stamp-tree-auto.test.ts; this file only pins that
// the YAML keeps calling them, in the right order, with the right secrets scope.
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
const at = (needle: string) => {
  const i = wf.indexOf(needle);
  expect(i, needle).toBeGreaterThan(-1);
  return i;
};

describe('social-tree-approve.yml', () => {
  it('is workflow_dispatch-only with a `pr` input, in the main-only `social` environment', () => {
    expect(wf).toMatch(/^on:\n {2}workflow_dispatch:\n {4}inputs:\n {6}pr:/m);
    expect(wf).not.toMatch(/^ {2}(schedule|pull_request|pull_request_target|push|workflow_run):/m);
    expect(wf).toContain('environment: social');
    expect(wf).toContain("if: github.ref == 'refs/heads/main'");
  });

  it('L8: normalises the PR number (digits only, leading zeros stripped) in a first job and keys the concurrency group on the NORMALISED value', () => {
    expect(wf).toContain('PR_INPUT: ${{ inputs.pr }}');
    expect(wf).toContain('[[ "$PR_INPUT" =~ ^[0-9]{1,8}$ ]]');
    expect(wf).toContain('PR=$((10#$PR_INPUT))');
    expect(wf).toContain('group: social-tree-approve-${{ needs.prepare.outputs.pr }}');
    expect(wf).not.toContain('group: social-tree-approve-${{ inputs.pr }}');
    const runBodies = wf.split(/^ {8}run: \|/m).slice(1).join('\n');
    expect(runBodies).not.toMatch(/\$\{\{\s*(inputs|github\.event)\./);
  });

  it('refuses while SOCIAL_FREEZE is set, before the key is ever referenced, with the poster\'s truthiness', () => {
    const rule = '[ -n "${FREEZE:-}" ] && [ "$FREEZE" != "false" ] && [ "$FREEZE" != "0" ]';
    expect(wf).toContain('FREEZE: ${{ vars.SOCIAL_FREEZE }}');
    expect(wf).toContain(rule);
    expect(poster).toContain(rule);
    expect(at('SOCIAL_FREEZE is set')).toBeLessThan(at('secrets.SOCIAL_APPROVAL_KEY'));
  });

  it('H3: hands the dispatcher identity (github.triggering_actor) to the gate script, which owns the allowlist', () => {
    expect(wf).toContain('ACTOR: ${{ github.triggering_actor }}');
    expect(wf.match(/tree-approve-gate\.mjs gate --pr "\$PR" --actor "\$ACTOR"/g)).toHaveLength(2);
    expect(wf).not.toMatch(/vars\.[A-Z_]*(TREE|ALLOW|ACTOR)/);
  });

  it('H1/H2: the gate runs on git objects pinned to one head SHA — no API file list, no extension/size logic in YAML, no PR checkout', () => {
    expect(wf).toContain('node scripts/social/tree-approve-gate.mjs meta');
    expect(wf).toContain('git fetch --no-tags --depth=1 origin "refs/heads/$HEAD_REF"');
    expect(wf).toContain('[ "$(git rev-parse FETCH_HEAD)" = "$HEAD_SHA" ]');
    expect(wf).toContain('git show "$HEAD_SHA:$f" > "$f"');
    expect(wf).not.toMatch(/pulls\/\$PR\/files|--paginate|QUEUE_RE|MEDIA_RE|\.svg|gh pr checkout|contents\/\$f/);
    expect(at('--head "$HEAD_SHA" --out "$RUNNER_TEMP/gate"')).toBeLessThan(at('git show "$HEAD_SHA:$f"'));
    expect(at('git show "$HEAD_SHA:$f"')).toBeLessThan(at('stamp-tree-auto.mjs'));
  });

  it('mints with the key in ONE step only, before any push, and the stamp commit is verified to touch only the stamped queue files', () => {
    expect(wf.match(/SOCIAL_APPROVAL_KEY: \$\{\{ secrets\.SOCIAL_APPROVAL_KEY \}\}/g)).toHaveLength(1);
    expect(at('stamp-tree-auto.mjs')).toBeLessThan(at('git push origin'));
    expect(at('tree-approve-gate.mjs stamp-diff')).toBeLessThan(at('git push origin'));
    expect(wf).toContain('git worktree add --detach "$RUNNER_TEMP/pr-branch" "$HEAD_SHA"');
  });

  it('commits with the real-user PAT, waits for the required `build`, RE-RUNS the whole gate on the stamp commit, and only then merges pinned to it', () => {
    expect(wf).toContain('GH_TOKEN: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(wf).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(wf).toContain('select(.name == "build")');
    expect(wf).toContain('gh pr checks "$PR" --repo "$REPO" --required --watch --fail-fast');
    expect(wf).toContain('--head "$STAMP_SHA" --out "$RUNNER_TEMP/gate2"');
    expect(at('--out "$RUNNER_TEMP/gate2"')).toBeLessThan(at('gh pr merge'));
    expect(at('gh pr checks')).toBeLessThan(at('--out "$RUNNER_TEMP/gate2"'));
    expect(wf).toContain('--squash --delete-branch --match-head-commit "$STAMP_SHA"');
    expect(wf).not.toMatch(/--force|push -f|--no-verify/);
  });

  it('M5: a failure after the stamp was pushed reverts the stamp commit (or closes the PR)', () => {
    expect(wf).toContain("if: failure() && steps.commit.outputs.stamp_sha != '' && steps.merge.conclusion != 'success'");
    expect(wf).toContain('git revert --no-edit "$STAMP_SHA"');
    expect(wf).toContain('gh pr close "$PR"');
  });

  it('does not dispatch, post or send anything, and never touches the caps', () => {
    expect(wf).not.toMatch(/post-queue|workflow run|gh workflow|MAX_POSTS/);
  });
});

describe('social-approval-notify.yml — H4: tree/draft/* PRs KEEP their ✅ prompt for now', () => {
  it('notify-new has no tree/draft skip', () => {
    expect(notify).toContain("    if: github.event_name == 'pull_request_target'\n");
    expect(notify).not.toMatch(/startsWith\(github\.event\.pull_request\.head\.ref/);
  });

  it('L7: the notifier tells the already-stamped filter which branch it is on, so v4 is honoured only on tree/draft/*', () => {
    expect(notify).toContain('--head "$SHA" --head-ref "$HEAD_REF"');
  });
});

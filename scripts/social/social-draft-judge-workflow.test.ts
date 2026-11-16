// Workflow-wiring tests for social-draft-judge.yml. The decisions live in
// judge-drafts.mjs / rewrite-drafts.mjs and are unit-tested there; this file
// pins that the YAML keeps calling them in the right order, with the right
// secrets scope, and that the two properties the pipeline depends on survive
// a later edit (#6890):
//   - the job refuses to judge on top of its own or the approval stamp's
//     commit, which is what moved the PR head out from under an in-flight
//     social-tree-approve run and darkened the account from 2026-11-10;
//   - the bar is unchanged: approval is dispatched only when a judge pass
//     reports every score at or above 4.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const raw = readFileSync(join(ROOT, '.github', 'workflows', 'social-draft-judge.yml'), 'utf8');
// Comments (the header prose) are stripped so assertions pin executable text only.
const wf = raw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const at = (needle: string) => {
  const i = wf.indexOf(needle);
  expect(i, needle).toBeGreaterThan(-1);
  return i;
};

describe('social-draft-judge.yml', () => {
  it("skips the run when the PR head is this machinery's own commit (judge, rewrite or approval stamp)", () => {
    expect(wf).toContain('HEAD_AUTHOR=$(git log -1 --format=%ae "$HEAD_SHA")');
    expect(wf).toContain('HEAD_SUBJECT=$(git log -1 --format=%s "$HEAD_SHA")');
    expect(wf).toContain('41898282+github-actions[bot]@users.noreply.github.com');
    expect(wf).toMatch(/independent\\ judge\\ scores\|judge\\ rewrite\|tree-auto\\ approval\\ stamp/);
    // The skip is expressed as count=0, which every later step is already gated on.
    expect(at('echo "count=0" >> "$GITHUB_OUTPUT"')).toBeLessThan(at('git worktree add --detach "$RUNNER_TEMP/pr"'));
    // Every commit subject the skip matches is one this repo actually writes.
    const approve = readFileSync(join(ROOT, '.github', 'workflows', 'social-tree-approve.yml'), 'utf8');
    expect(approve).toContain('git commit -m "social: tree-auto approval stamp (PR #$PR)"');
    expect(wf).toContain('git commit -m "social: independent judge scores (PR #$PR)"');
    expect(wf).toContain('git commit -m "social: judge rewrite and scores (PR #$PR)"');
  });

  it('judges, then rewrites once, then judges again — in that order, each on the pinned PR files', () => {
    const pass1 = at('--pass 1');
    const rewrite = at('rewrite-drafts.mjs');
    const pass2 = at('--pass 2');
    expect(pass1).toBeLessThan(rewrite);
    expect(rewrite).toBeLessThan(pass2);
    expect(wf).toContain('--reasons-out "$RUNNER_TEMP/judge-reasons.json"');
    expect(wf).toContain('--reasons "$RUNNER_TEMP/judge-reasons.json"');
    // Pass 2 re-scores only what the rewrite changed.
    expect(wf).toContain('--already "$RUNNER_TEMP/judged.json"');
  });

  it('runs the rewrite only on a refusal, and only when a rewrite was actually produced', () => {
    expect(wf).toContain("if: steps.pin.outputs.count != '0' && steps.judge.outputs.all_pass == 'false'");
    expect(wf).toContain("if: steps.rewrite.outputs.rewrote != '' && steps.rewrite.outputs.rewrote != '0'");
  });

  it('keeps the bar: approval is dispatched only when a judge pass reports every score clear', () => {
    expect(wf).toContain("if: steps.push.outputs.pushed == 'true' && (steps.judge.outputs.all_pass == 'true' || steps.judge2.outputs.all_pass == 'true')");
    // No rewrite output can authorise a dispatch on its own.
    expect(wf).not.toMatch(/Dispatch social-tree-approve[\s\S]{0,200}steps\.rewrite/);
  });

  it('comments both judge passes and the rewrite on the PR as one comment', () => {
    expect(wf).toContain('for f in judge-summary.md rewrite-summary.md judge-summary-2.md; do');
    expect(wf).toContain('--body-file "$RUNNER_TEMP/judge-comment.md"');
  });

  it('keeps the signing key out of every LLM step and signs whatever record the file ends up with', () => {
    const block = (name: string) => {
      const start = at(name);
      const next = wf.indexOf('\n      - name:', start + 1);
      return wf.slice(start, next === -1 ? undefined : next);
    };
    for (const step of ['name: Judge the captions', 'name: Rewrite the captions the judge refused (once)', 'name: Judge the rewritten captions']) {
      expect(block(step)).not.toContain('SOCIAL_JUDGE_KEY');
      expect(block(step)).not.toContain('SOCIAL_APPROVAL_KEY');
      expect(block(step)).toContain('CLAUDE_CODE_OAUTH_TOKEN');
    }
    const sign = block('name: Sign the judge records');
    expect(sign).toContain('SOCIAL_JUDGE_KEY: ${{ secrets.SOCIAL_JUDGE_KEY }}');
    expect(sign).not.toContain('CLAUDE_CODE_OAUTH_TOKEN');
    expect(sign).toContain('--sign "$RUNNER_TEMP/judged2.json"');
  });

  it('runs only the judge/rewrite/calibration scripts — never a posting or stamping path', () => {
    const scripts = [...new Set((wf.match(/scripts\/social\/[A-Za-z0-9-]+\.mjs/g) ?? []))];
    expect(scripts.sort()).toEqual([
      'scripts/social/calibrate-judge.mjs',
      'scripts/social/judge-drafts.mjs',
      'scripts/social/rewrite-drafts.mjs',
    ]);
    expect(wf).not.toContain('"approval"');
  });
});

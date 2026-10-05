import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { checkDiff, main } from './ops-fix-guard.mjs';
// @ts-expect-error plain .mjs module
import { autoSpec, renderComment, renderHa, renderPrompt } from './ops-fix-escalate.mjs';

const file = (path: string, ...added: string[]) =>
  [`diff --git a/${path} b/${path}`, `--- a/${path}`, `+++ b/${path}`, ...added.map((l) => `+${l}`)].join('\n');

describe('checkDiff', () => {
  it('passes an ordinary workflow and script fix', () => {
    expect(checkDiff(file('.github/workflows/watchdog.yml', 'timeout-minutes: 20') + '\n' + file('scripts/x.mjs', 'run()'))).toEqual([]);
  });
  it('allows referencing a secret name in YAML', () => {
    expect(checkDiff(file('.github/workflows/a.yml', 'GH_TOKEN: ${{ secrets.SOCIAL_POSTER_PAT }}'))).toEqual([]);
  });
  it('blocks edits to social approval/signing files', () => {
    for (const p of ['.github/workflows/social-approval-poll.yml', 'scripts/automerge-social-approval-gate.mjs', 'scripts/social/social-approval-poll.mjs', 'scripts/social/lib/queue.mjs', 'scripts/social/post-queue.mjs', 'scripts/social/delete-media.mjs']) {
      expect(checkDiff(file(p, 'x'))).toEqual([expect.stringContaining('rail 3')]);
    }
  });
  it('protects the ops-fixer machinery and the required-check workflows', () => {
    for (const p of ['scripts/marjorie/ops-fix-guard.mjs', 'scripts/marjorie/ops-fix-guard.test.ts', 'scripts/marjorie/ops-fix-escalate.mjs', 'scripts/marjorie/ops-fix-trust.mjs', '.github/workflows/routine-ops-fix.yml', 'docs/agents/runner-prompts/ops-fix.md', 'docs/agents/ops-fixer.md', '.github/workflows/routine-template.yml', '.github/workflows/ci.yml', '.github/workflows/parity.yml', '.github/CODEOWNERS', '.github/rulesets/main.json']) {
      expect(checkDiff(file(p, 'x'))).toEqual([expect.stringContaining('rail 4')]);
    }
  });
  it('blocks --admin merges and ruleset/branch-protection API calls', () => {
    for (const l of ['gh pr merge 5 --squash --admin', 'gh api -X PUT repos/o/r/rulesets/1', 'gh api repos/o/r/branches/main/protection']) {
      expect(checkDiff(file('s.sh', l))).toHaveLength(1);
    }
    expect(checkDiff(file('s.sh', 'gh pr merge 5 --squash --auto'))).toEqual([]);
  });
  it('allows other social code', () => {
    expect(checkDiff(file('scripts/social/check-drafts.mjs', 'x'))).toEqual([]);
  });
  it('blocks an approval key written into the social queue', () => {
    expect(checkDiff(file('social/queue/a.json', '  "approval": { "v": 2 }'))).toEqual([expect.stringContaining('approval')]);
    expect(checkDiff(file('docs/x.md', '"approval": 1'))).toEqual([]);
  });
  it('blocks gh secret/variable mutations but not reads', () => {
    expect(checkDiff(file('a.yml', 'gh secret set FOO'))).toHaveLength(1);
    expect(checkDiff(file('a.yml', 'gh variable delete FOO'))).toHaveLength(1);
    expect(checkDiff(file('a.yml', 'gh secret list'))).toEqual([]);
  });
  it('blocks force pushes', () => {
    for (const l of ['git push --force origin x', 'git push -f', 'git push --force-with-lease', 'git push origin +main']) {
      expect(checkDiff(file('s.sh', l))).toHaveLength(1);
    }
    expect(checkDiff(file('s.sh', 'git push origin feat'))).toEqual([]);
  });
  it('ignores removed lines', () => {
    expect(checkDiff(['diff --git a/s.sh b/s.sh', '-git push --force'].join('\n'))).toEqual([]);
  });
});

describe('main', () => {
  it('exits 1 on a violation and 0 when clean', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main(['--base', 'b', '--head', 'pr'], () => file('s.sh', 'git push -f'))).toBe(1);
    expect(main([], () => file('s.sh', 'echo hi'))).toBe(0);
    err.mockRestore();
    log.mockRestore();
  });
});

const spec = {
  issue: 4821, project: 'swift2', title: 'cron red', found: 'step 3 times out', tried: 'raised timeout, no effect',
  goal: 'job green', acceptance: 'npm test passes', ha: 108, date: '2026-10-05',
};

describe('escalation text', () => {
  it('builds a self-contained prompt with all required parts', () => {
    const p = renderPrompt(spec);
    for (const s of ['#4821', 'step 3 times out', 'raised timeout', 'job green', 'npm test passes', 'Fixes #4821', 'CLAUDE.md']) expect(p).toContain(s);
  });
  it('puts the prompt in a fence and names where to paste it', () => {
    const c = renderComment(spec);
    expect(c).toContain('Documents\\Claude\\Projects\\Swift2');
    expect(c).toMatch(/```text\n[\s\S]*Fixes #4821[\s\S]*\n```/);
    expect(renderComment({ ...spec, project: 'hermes' })).toContain('Projects\\Hermes');
  });
  it('builds a deterministic escalation without an LLM spec', () => {
    const c = renderComment(autoSpec(7, 'guard failed', 'https://x/run/1'));
    expect(c).toContain('Fixes #7');
    expect(c).toContain('https://x/run/1');
    expect(c).toContain('<!-- ops-fix-stuck:7 -->');
  });
  it('rejects an incomplete spec', () => {
    expect(() => renderPrompt({ ...spec, found: '' })).toThrow(/found/);
    expect(() => renderPrompt({ ...spec, project: 'x' })).toThrow(/project/);
  });
  it('files a v2 HA item within the caps', () => {
    const ha = renderHa(spec);
    expect(ha).toContain('## #108 🔴 [BLOCKING]');
    expect(ha).toContain('1. Open Claude Code in Documents\\Claude\\Projects\\Swift2.');
    expect(ha).toContain('2. Paste the prompt from issue #4821 (copy button on the code block).');
    expect(Buffer.byteLength(ha)).toBeLessThan(1500);
    for (const l of ha.split('\n').filter((x) => /^\d+\. /.test(x))) expect(l.length).toBeLessThanOrEqual(200);
  });
});

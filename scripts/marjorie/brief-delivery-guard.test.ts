import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain mjs
import { guard, validateBrief } from './brief-delivery-guard.mjs';

const issue = {
  number: 4366, state: 'open', title: "Founders' Brief — 2026-09-15",
  repository_url: 'https://api.github.com/repos/JW-Incorporated/swift2',
  html_url: 'https://github.com/JW-Incorporated/swift2/issues/4366',
  labels: [{ name: 'founders-brief' }],
  body: "cc @sffan15-sys @wjduvall-cmd\n\n**Founders' Brief — 2026-09-15** · [issue #4366](https://github.com/JW-Incorporated/swift2/issues/4366)\n\nReady.",
};

describe('brief delivery guard', () => {
  it('accepts only the exact current brief contract', () => {
    expect(validateBrief(issue, [], { issueNumber: 4366, date: '2026-09-15' })).toEqual({ body: issue.body, url: issue.html_url });
    for (const changed of [
      { ...issue, state: 'closed' }, { ...issue, labels: [] }, { ...issue, title: "Founders' Brief — 2026-09-14" },
      { ...issue, body: issue.body.replace('cc @sffan15-sys @wjduvall-cmd', 'cc @someone') },
    ]) expect(() => validateBrief(changed, [], { issueNumber: 4366, date: '2026-09-15' })).toThrow();
  });

  it('refuses existing Discord and recovery delivery markers', () => {
    for (const body of ['<!-- discord-message-id: 123456789012345678 -->', '<!-- marjorie-brief-delivery-recovery -->']) {
      expect(() => validateBrief(issue, [{ body }], { issueNumber: 4366, date: '2026-09-15' })).toThrow('already');
    }
  });

  it('reads the explicitly numbered issue and fresh REST comments without logging its body', () => {
    const execImpl = vi.fn((_cmd: string, args: string[]) => JSON.stringify(args[1].includes('/comments?') ? [] : issue));
    const log = vi.fn();
    const writeImpl = vi.fn();
    const appendImpl = vi.fn();
    const code = guard({
      env: { GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: 'JW-Incorporated/swift2', ISSUE_NUMBER: '4366', BODY_FILE: 'body.md', GITHUB_OUTPUT: 'out' },
      execImpl, writeImpl, appendImpl, now: new Date('2026-09-15T20:00:00Z'), log,
    });
    expect(code).toBe(0);
    expect(execImpl.mock.calls.map(([, args]) => args[1])).toEqual([
      'repos/JW-Incorporated/swift2/issues/4366', 'repos/JW-Incorporated/swift2/issues/4366/comments?per_page=100&page=1',
    ]);
    expect(log.mock.calls.flat().join(' ')).not.toContain('Ready.');
    expect(writeImpl).toHaveBeenCalledWith('body.md', issue.body);
  });

  it('keeps recovery manual, main-only, serialized, and free of an assembler or Claude step', () => {
    const workflow = readFileSync('.github/workflows/marjorie-brief-delivery-recovery.yml', 'utf8').replace(/\r\n/g, '\n');
    expect(workflow).toMatch(/^on:\n\x20{2}workflow_dispatch:\n\x20{4}inputs:\n\x20{6}issue_number:[\s\S]*?type: number/m);
    expect(workflow).not.toContain('schedule:');
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toMatch(/concurrency:\n\x20{2}group: marjorie-brief-deliver\n\x20{2}cancel-in-progress: false/);
    expect(workflow).toContain('ref: main');
    expect(workflow).toContain('post-or-mail.mjs');
    expect(workflow).not.toMatch(/assemble-brief|anthropic|claude/i);
  });
});

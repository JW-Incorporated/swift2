import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const triage = readFileSync('docs/agents/runner-prompts/marjorie-triage.md', 'utf8');
const workflow = readFileSync('.github/workflows/routine-marjorie-triage.yml', 'utf8');

describe('marjorie triage truncation guards (#4230, #4232, #4239)', () => {
  it('never requests comments in a bulk gh issue list (indented or reworded too)', () => {
    const bulk = triage.split('\n').filter((l) => /gh\s+issue\s+list/i.test(l));
    expect(bulk.length).toBeGreaterThan(0);
    for (const line of bulk) expect(line).not.toMatch(/comments/i);
  });

  it('writes the reconciled marker only after a COMPLETED closure', () => {
    const step = triage.match(/\n5\. Only after a `COMPLETED` closure[\s\S]*?\n\n/)?.[0] ?? '';
    expect(step).toContain('marjorie-triage-reconciled');
    expect(step).toMatch(/NOT_PLANNED[\s\S]*do \*\*not\*\* write the marker/);
  });

  it('reads comment threads through the one-turn helper, never a per-issue loop', () => {
    expect(triage.match(/node scripts\/marjorie\/lib\/fetch-issue-comments\.mjs/g)?.length).toBe(2);
    expect(triage).not.toMatch(/gh\s+issue\s+view\s+<n>[^\n]*comments/i);
    expect(triage.match(/hit exactly 200/g)?.length).toBe(2);
  });

  it('paginates the deliver candidate fetch without a --limit cap', () => {
    expect(workflow).toContain('gh api --paginate "repos/$GITHUB_REPOSITORY/issues?labels=founder-decision');
    expect(workflow).not.toMatch(/--label founder-decision --state open --json number,url --limit/);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const template = readFileSync('.github/workflows/routine-template.yml', 'utf8').replace(/\r\n/g, '\n');

// The manual-budget caller checks for routine-marjorie-brief.yml and routine-marjorie-triage.yml left with those
// workflows (deleted 2026-10-09); the template's own defaults are what remains pinned.
describe('optional routine budget control', () => {
  it('defaults the typed reusable input to zero and appends only a positive numeric cap', () => {
    expect(template).toMatch(/max_budget_usd:\n[\s\S]*?type: number\n\s+default: 0/);
    expect(template).toContain("${{ inputs.max_budget_usd > 0 && format(' --max-budget-usd {0}', inputs.max_budget_usd) || '' }}");
    expect(template.match(/--max-budget-usd/g)).toHaveLength(1);
  });
});

describe('optional routine disallowed_tools', () => {
  it('defaults empty and appends --disallowedTools only when set', () => {
    expect(template).toMatch(/disallowed_tools:\n[\s\S]*?type: string\n\s+default: ""/);
    expect(template).toContain("${{ inputs.disallowed_tools != '' && format(' --disallowedTools ''{0}''', inputs.disallowed_tools) || '' }}");
    expect(template.match(/--disallowedTools ''/g)).toHaveLength(1);
  });

  it.each(['fable-strategy-update', 'laura-a11y-walk', 'nils-walk'])('routine-%s removes the file-write tools', (name) => {
    const caller = readFileSync(`.github/workflows/routine-${name}.yml`, 'utf8').replace(/\r\n/g, '\n');
    expect(caller).toContain('disallowed_tools: "Write Edit NotebookEdit Task"');
  });
});

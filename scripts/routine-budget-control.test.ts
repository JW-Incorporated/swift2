import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const template = readFileSync('.github/workflows/routine-template.yml', 'utf8');
const brief = readFileSync('.github/workflows/routine-marjorie-brief.yml', 'utf8');

describe('optional routine budget control', () => {
  it('defaults the typed reusable input to zero and appends only a positive numeric cap', () => {
    expect(template).toMatch(/max_budget_usd:\n[\s\S]*?type: number\n\s+default: 0/);
    expect(template).toContain("${{ inputs.max_budget_usd > 0 && format(' --max-budget-usd {0}', inputs.max_budget_usd) || '' }}");
    expect(template.match(/--max-budget-usd/g)).toHaveLength(1);
  });

  it('exposes the cap only to manual briefs while schedule and clock keep zero', () => {
    expect(brief).toMatch(/workflow_dispatch:\n\s+inputs:\n\s+max_budget_usd:[\s\S]*?type: number\n\s+default: 0/);
    expect(brief.match(/^ {4}inputs:$/gm)).toHaveLength(1);
    expect(brief).toContain("max_budget_usd: ${{ github.event_name == 'workflow_dispatch' && inputs.max_budget_usd || 0 }}");
    expect(brief).toContain('- cron: "0 12 * * *"');
  });
});

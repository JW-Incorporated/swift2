import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { probeVerdict } from './claude-auth-probe.mjs';

const success = { type: 'result', subtype: 'success', is_error: false, num_turns: 1, total_cost_usd: 0.008, result: 'AUTH_OK' };

describe('Claude auth probe metadata', () => {
  it('accepts only the one-turn sentinel within the cost ceiling', () => {
    expect(probeVerdict([success]).ok).toBe(true);
    for (const change of [
      { result: 'other' },
      { num_turns: 2 },
      { total_cost_usd: 0.051 },
      { total_cost_usd: undefined },
      { subtype: 'error', is_error: true },
    ]) expect(probeVerdict([{ ...success, ...change }]).ok).toBe(false);
  });

  it('keeps the workflow manual, read-only, bounded, and non-reporting', () => {
    const workflow = readFileSync('.github/workflows/claude-auth-probe.yml', 'utf8');
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).not.toMatch(/schedule:|(?:contents|actions|issues|pull-requests): write|upload-artifact|ANTHROPIC_API_KEY|SUPABASE|DISCORD/);
    expect(workflow).toContain('anthropics/claude-code-action@v1');
    expect(workflow).toContain('--model claude-haiku-4-5-20251001 --max-turns 1 --max-budget-usd 0.05 --tools ""');
    expect(workflow).toContain('display_report: "false"');
    expect(workflow).toContain('show_full_output: "false"');
    expect(workflow).toContain('persist-credentials: false');
  });
});

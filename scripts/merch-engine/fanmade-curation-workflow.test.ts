import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/merch-fanmade-curate.yml', 'utf8');

describe('fan-made curation workflow', () => {
  it('runs weekly and manually with one non-cancelling concurrency group', () => {
    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('group: merch-fanmade-curate');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('pins the CLI, tolerates install failure, and scopes only the primary token to curation', () => {
    expect(workflow).toContain('@anthropic-ai/claude-code@2.1.300');
    expect(workflow).toMatch(/continue-on-error:\s*true/);
    const tokenLines = workflow.split('\n').filter((line) => line.includes('CLAUDE_CODE_OAUTH_TOKEN'));
    expect(tokenLines).toEqual([
      expect.stringContaining('CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}'),
    ]);
    expect(workflow).not.toContain('CLAUDE_CODE_OAUTH_TOKEN_BACKUP');
  });

  it('uses the Jev secret, shared commit-and-pr action, and gh-only issue closure', () => {
    expect(workflow).toContain('TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}');
    expect(workflow).toContain('uses: ./.github/actions/commit-and-pr');
    expect(workflow).toContain('paths: supabase/seed/merch/fanmade.mjs');
    expect(workflow).toContain('gh issue close "$number" --comment "$reason"');
  });
});

// Workflow-invariant tests for social-reply-notifier.yml — same convention as
// social-poster-workflow.test.ts: pin the safety properties in the YAML text.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const wf = readFileSync(join(ROOT, '.github', 'workflows', 'social-reply-notifier.yml'), 'utf8');
const script = readFileSync(join(ROOT, 'scripts', 'social', 'reply-ledger.sh'), 'utf8');
const code = wf.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');

describe('social-reply-notifier.yml', () => {
  it('runs every 15 minutes at an off-cluster minute, with dispatch + a concurrency group', () => {
    expect(code).toMatch(/cron: "11,26,41,56 \* \* \* \*"/);
    expect(code).toContain('workflow_dispatch:');
    expect(code).toMatch(/concurrency:\s+group: social-reply-notifier\s+cancel-in-progress: false/);
  });

  it('is least-privilege: contents write only, social environment, main checkout, no agent step', () => {
    expect(code).toMatch(/permissions:\s+contents: write\s*(#[^\n]*)?\n\s*\n/);
    expect(code).not.toMatch(/pull-requests:|actions:|issues:|id-token:/);
    expect(code).toContain('environment: social');
    expect(code).toMatch(/actions\/checkout@v7\s+with:\s+ref: main/);
    expect(code).not.toMatch(/claude-code-action|SOCIAL_POSTER_PAT|DISCORD_BOT_TOKEN|SOCIAL_APPROVAL_KEY/);
  });

  it('hands secrets to exactly one step, and never interpolates an expression into a script', () => {
    expect((code.match(/\$\{\{ secrets\./g) ?? []).length).toBe(4);
    expect(code).toMatch(/Poll replies[\s\S]*IG_ACCESS_TOKEN: \$\{\{ secrets\.IG_ACCESS_TOKEN \}\}/);
    const runLines = code.split('\n').filter((l) => /^\s+run: /.test(l));
    for (const line of runLines) expect(line).not.toContain('${{');
  });

  it('keeps the posting path out of the job', () => {
    expect(code).not.toMatch(/post-queue|delete-media|stamp-approval|queue-schema|lib\/queue|approvers/);
    expect(code).toContain('scripts/social/reply-notifier.mjs');
  });

  it('creates the ledger branch before anything is sent, and pushes after even on failure', () => {
    expect(code.indexOf('reply-ledger.sh fetch')).toBeLessThan(code.indexOf('reply-notifier.mjs'));
    expect(code).toMatch(/Push the reply ledger\s+if: \$\{\{ always\(\)/);
    expect(script).toContain('social-reply-ledger');
    expect(script).toMatch(/does not exist — creating it[\s\S]*push_file/);
  });
});

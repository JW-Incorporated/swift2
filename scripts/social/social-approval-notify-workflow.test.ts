// Workflow-invariant tests for social-approval-notify.yml — same convention
// as social-poster-workflow.test.ts: these pin safety/recovery controls in
// the YAML text so they can't be silently dropped in an unrelated cleanup.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const wf = readFileSync(join(ROOT, '.github', 'workflows', 'social-approval-notify.yml'), 'utf8');

describe('social-approval-notify.yml — the already-stamped filter (PR #4139)', () => {
  it('projects `approval` into BOTH manifests — without it the filter sees every draft as unstamped and filters nothing', () => {
    const projections = wf.match(/'\{file: \$file,[^']*\}'/g) ?? [];
    expect(projections).toHaveLength(2);
    for (const p of projections) expect(p).toContain(', approval}');
  });

  it('hands the PR number and head SHA to the filter in BOTH jobs, so a stamp that no longer covers the branch is re-briefed instead of suppressing the whole prompt (round 4, Codex HIGH)', () => {
    const calls = wf.match(/node scripts\/social\/filter-already-stamped\.mjs [^\n]+/g) ?? [];
    expect(calls).toHaveLength(2);
    for (const c of calls) {
      expect(c).toContain('--pr "$PR"');
      expect(c).toContain('--head "$SHA"');
    }
  });
});

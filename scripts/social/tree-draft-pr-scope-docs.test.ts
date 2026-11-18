// Pins the draft-PR scope rule in Tree's runner prompts. social-tree-approve.yml's
// gate (scripts/social/tree-approve-gate.mjs) refuses a tree/draft/* PR that
// holds any file but social/queue/*.json and its referenced images. On
// 2026-11-17/18 the daily prompt told Tree to put inbox expiry moves in that same
// PR (#6931, #6962, 129-139 renames into social/inbox/closed/), so nothing was
// approved. The prompts must keep inbox/calendar housekeeping on a separate
// tree/inbox/<date> PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('Tree draft PRs stay queue-only', () => {
  const daily = read('docs/agents/runner-prompts/tree-daily-draft.md');

  it('routes every inbox/calendar change to a separate tree/inbox/<date> PR', () => {
    expect(daily).toContain('**Two PRs, never one (2026-11-18).**');
    expect(daily).toMatch(/goes on a SEPARATE branch `tree\/inbox\/<date>`/);
    expect(daily).toMatch(/move the file to `social\/inbox\/closed\/` — on the `tree\/inbox\/<date>` branch, never the draft branch/);
  });

  it('step 7 limits the draft PR to queue files and their images', () => {
    expect(daily).toContain('**Open ONE draft PR**');
    expect(daily).toMatch(/holding ONLY `social\/queue\/\*\.json` and the images/);
    expect(daily).not.toMatch(/\*\*Open ONE PR\*\* for the run/);
  });

  it('the Hermes loop and the charter carry the same rule', () => {
    expect(read('docs/agents/runner-prompts/tree-hermes-daily.md')).toMatch(/separate `tree\/inbox\/<YYYY-MM-DD>` PR/);
    expect(read('docs/agents/tree.md')).toMatch(/`tree\/inbox\/<date>`\s+PR, never the `tree\/draft\/<date>` PR/);
  });
});

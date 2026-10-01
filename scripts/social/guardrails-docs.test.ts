// S2 review fix: the guardrail wording must live in the founder-owned file, not in the
// strategy doc Tree can now edit without a founder merge.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const NORMATIVE = [
  'Major personal-life events — confirmed-only carve-out (Joey, 2026-09-01',
  'independently reported as settled fact by two major outlets',
  'Until\nconfirmation, silence',
  'takedown-on-request without argument',
  '**no AI-generated\nimages, ever**',
  '**cards never reproduce lyrics**',
  'nothing is ever\ninvented',
];

describe('guardrail wording lives in docs/social/guardrails.md', () => {
  const guardrails = read('docs/social/guardrails.md');
  const strategy = read('docs/marketing/social-strategy.md');

  it.each(NORMATIVE)('guardrails.md carries %j', (text) => {
    expect(guardrails).toContain(text);
  });

  it.each(NORMATIVE)('the Tree-editable strategy doc no longer carries %j', (text) => {
    expect(strategy).not.toContain(text);
  });

  it('the strategy doc, charter and daily prompt point at guardrails.md for them', () => {
    expect(strategy).toContain('docs/social/guardrails.md');
    expect(read('docs/agents/tree.md')).toContain('`docs/social/guardrails.md` guardrail 4');
    expect(read('docs/agents/runner-prompts/tree-daily-draft.md')).toContain('`docs/social/guardrails.md` guardrail 4');
  });
});

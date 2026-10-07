import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { blockOf, issueRefs, propagateDecision, renderDecisionComment } from './decision-propagate.mjs';

const OPEN = `## #12 🟡 [DECIDE] First (~5 min)
**Why:** about #4001.

---

## #13 🟡 [DECIDE] Second (~5 min)
**Why:** HA #123 relates; see #4002, #4002 again, PR https://github.com/o/r/pull/4003 and https://github.com/other/repo/issues/9999.
**Steps:**
1. Decide: \`a\` — x; \`b\` — y.
`;

describe('issueRefs / blockOf', () => {
  it('reads only the item’s own block', () => {
    expect(blockOf(OPEN, 13)).toContain('#4002');
    expect(blockOf(OPEN, 13)).not.toContain('#4001');
    expect(blockOf(OPEN, 99)).toBe('');
  });
  it('finds #NNN refs and same-repo links once each, skipping HA numbers and other repos', () => {
    expect(issueRefs(blockOf(OPEN, 13), { repo: 'o/r' })).toEqual([4002, 4003]);
  });
  it('skips short numbers, the excluded ones, and caps the list', () => {
    expect(issueRefs('#12 #99 #1000 #1001', { repo: 'o/r', exclude: [1001] })).toEqual([1000]);
    expect(issueRefs(Array.from({ length: 9 }, (_, i) => `#${2000 + i}`).join(' '), { repo: 'o/r' })).toHaveLength(5);
  });
});

describe('renderDecisionComment', () => {
  it('carries the marker, the link, and defangs mentions, backticks and comment openers', () => {
    const text = renderDecisionComment({ number: 13, title: 'Ship <!-- x --> @everyone', choice: 'a `b` @joey', outcome: 'done', url: 'https://x/1' });
    expect(text).toContain('<!-- decision-propagated: HA-13 -->');
    expect(text).toContain('https://x/1');
    expect(text).not.toMatch(/@everyone|@joey/);
    expect(text.match(/<!--/g)).toHaveLength(1);
    expect(text).toContain('decided on human action #13');
    expect(renderDecisionComment({ number: 13, title: 't', choice: 'skip', outcome: 'skip', url: 'u' })).toContain('skipped on human action #13');
  });
});

describe('propagateDecision', () => {
  it('never throws: a failing gh call is logged and the decision stands', async () => {
    const run = vi.fn(() => { throw new Error('HTTP 403: nope'); });
    const log = vi.fn();
    const out = await propagateDecision({ openMd: OPEN, number: 13, title: 'Second', choice: 'a', url: 'u', repo: 'o/r', run, log });
    expect(out.posted).toEqual([]);
    expect(log.mock.calls.flat().join('\n')).toContain('stopped: HTTP 403');
  });
  it('an item that references nothing makes no calls', async () => {
    const run = vi.fn();
    const out = await propagateDecision({ openMd: '## #5 🟡 [DECIDE] Quiet (~1 min)\n**Why:** nothing.\n', number: 5, title: 'Quiet', choice: 'a', url: 'u', repo: 'o/r', run, log: vi.fn() });
    expect(out.refs).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });
});

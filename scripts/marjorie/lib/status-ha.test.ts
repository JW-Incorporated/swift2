import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { haAnchor, oneLineWhy, parseHaEntries, renderNeedsYou, sortNeedsYou } from './status-ha.mjs';

const DOC = `# Human actions

> **4 open.**

## #88 🔴 [BLOCKING] Store the login (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** The export needs a credential. Only the owner can store it.
**Steps:**
1. Run the thing
   and then the other thing.
2. Check it.
**Worked if:** it works.

## #87 🟡 [DECIDE] Pick a budget (~5 min)
<!-- ha filed=2026-09-29 -->

**Why:** The backlog alert fires daily.
**Steps:**
1. Read #4546 and check whether any listed issue is live work.
2. Decide: \`accept\` — raise the budget and stop the alert; \`route\` — send the issues to a desk.
**Worked if:** a choice is recorded.

## #85 🟡 [DECIDE] Chased item has no activity (~2 min)
<!-- ha filed=2026-09-28 -->
<!-- marjorie-chase: 96h issue=4559 -->

**Why:** Nothing has moved since 09-24.

**Steps:**
1. Reply in chat with one word: \`assign\`, \`defer\`, or \`close\`.

**Worked if:** not stalled.

## #70 🟡 [DECIDE] Free-form decision (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** A parser needs proof.
**Steps:**
1. Do step one.
2. Do step two.
**Worked if:** proven.
`;

const REPO = 'JW-Incorporated/swift2';
const NOW = Date.parse('2026-10-01T12:00:00Z');

describe('haAnchor', () => {
  it('matches GitHub heading slugs (emoji, brackets, punctuation dropped; spaces become hyphens)', () => {
    expect(haAnchor('## #88 🔴 [BLOCKING] Store Facebook login and schedule the weekly export (~5 min)')).toBe('88--blocking-store-facebook-login-and-schedule-the-weekly-export-5-min');
    expect(haAnchor("## #82 🔴 [BLOCKING] GH_DISPATCH_TOKEN can't dispatch workflows (~10 min)")).toBe('82--blocking-gh_dispatch_token-cant-dispatch-workflows-10-min');
    expect(haAnchor('## #78 🔴 [BLOCKING] Add Actions read/write to X (~5 min)')).toBe('78--blocking-add-actions-readwrite-to-x-5-min');
  });
});

describe('parseHaEntries', () => {
  const items = parseHaEntries(DOC);
  it('finds every open item with kind, title, eta and filed date', () => {
    expect(items.map((i: { number: number }) => i.number)).toEqual([88, 87, 85, 70]);
    expect(items[0]).toMatchObject({ tag: 'BLOCKING', title: 'Store the login', eta: '~5 min', filed: '2026-09-30' });
  });
  it('takes the first sentence of Why as the one-liner and caps it', () => {
    expect(items[0].why).toBe('The export needs a credential.');
    expect(oneLineWhy(`${'word '.repeat(80)}.`).length).toBeLessThanOrEqual(160);
  });
  it('joins wrapped step lines into their step', () => {
    expect(items[0].steps[0]).toBe('Run the thing and then the other thing.');
  });
  it('reads the choices from a "Decide:" step and keeps the other steps as criteria', () => {
    expect(items[1].options).toEqual([
      { choice: 'accept', text: 'raise the budget and stop the alert' },
      { choice: 'route', text: 'send the issues to a desk' },
    ]);
    expect(items[1].criteria).toEqual(['Read #4546 and check whether any listed issue is live work.']);
    expect(items[1].whyFull).toBe('The backlog alert fires daily.');
  });
  it('does not mistake a lone backticked path for a choice list', () => {
    const [it] = parseHaEntries('## #9 🟡 [DECIDE] Budget (~1 min)\n<!-- ha filed=2026-09-01 -->\n\n**Why:** x.\n**Steps:**\n1. Decide: raise `a.json` or route the issues.\n**Worked if:** y.\n');
    expect(it.options).toEqual([]);
    expect(it.criteria).toEqual(['Decide: raise `a.json` or route the issues.']);
  });
  it('falls back to the backticked "one word" choices, and to none', () => {
    expect(items[2].options.map((o: { choice: string }) => o.choice)).toEqual(['assign', 'defer', 'close']);
    expect(items[3].options).toEqual([]);
  });
  it('parses every heading in the real HUMAN-ACTIONS.md', () => {
    const md = readFileSync('HUMAN-ACTIONS.md', 'utf8');
    const headings = md.split('\n').filter((l) => /^## #\d+/.test(l)).length;
    const real = parseHaEntries(md);
    expect(real).toHaveLength(headings);
    for (const it of real) expect(it.anchor).toMatch(/^\d+--(blocking|decide|upgrade)-/);
  });
});

describe('renderNeedsYou', () => {
  const items = parseHaEntries(DOC);
  const out = renderNeedsYou(items, { repo: REPO, now: NOW });
  it('links each item to its entry in HUMAN-ACTIONS.md', () => {
    expect(out).toContain(`https://github.com/${REPO}/blob/main/HUMAN-ACTIONS.md#88--blocking-store-the-login-5-min`);
  });
  it('shows done syntax for non-decisions and decide syntax with options and criteria for decisions', () => {
    expect(out).toContain('Reply `done #88` when finished, or `skip #88 <why>`.');
    expect(out).toContain('- `accept` — raise the budget and stop the alert');
    expect(out).toContain('How to decide:\n- Read #4546 and check whether any listed issue is live work.');
    expect(out).toContain('Reply: `decide #87 accept`');
    expect(out).toContain('Reply: `decide #70 <your choice>`');
    expect(out).not.toContain('`done #87`');
  });
  it('orders blocking before decisions, oldest first within a kind, and shows age', () => {
    expect(sortNeedsYou(items).map((i: { number: number }) => i.number)).toEqual([88, 70, 85, 87]);
    expect(out).toContain('waiting 19d');
  });
  it('lists an answered item under Closing, with the owner\'s answer and the PR, instead of as waiting', () => {
    const waiting = items.filter((i: { number: number }) => i.number !== 88);
    const closing = [{ number: 88, title: 'Store the login', summary: 'closed: wrong `question`', pr: { number: 9, url: 'https://x/9' } }];
    const out2 = renderNeedsYou(waiting, { repo: REPO, now: NOW, closing });
    expect(out2).toContain('✅ **Closing — merging now**\n- #88 — Store the login · your answer: closed: wrong \'question\' · [PR #9](https://x/9)');
    expect(out2).not.toContain('**#88 —');
    expect(out2).not.toContain('Reply `done #88`');
  });
  it('says so when nothing is open, and still shows what is closing', () => {
    expect(renderNeedsYou([], { repo: REPO })).toContain('Nothing waiting on you');
    const out3 = renderNeedsYou([], { repo: REPO, closing: [{ number: 85, title: 'T', summary: '', pr: { number: 9, url: 'https://x/9' } }] });
    expect(out3).toContain('Nothing waiting on you');
    expect(out3).toContain('- #85 — T · [PR #9](https://x/9)');
  });
});

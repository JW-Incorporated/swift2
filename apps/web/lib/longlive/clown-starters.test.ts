import { describe, expect, it } from 'vitest';

import { CLOWN_STARTERS, promptForItem } from './clown-starters';

// `clown-board.ts` (the real BoardItem source) is being built in parallel and
// may not exist yet — PLAN.md's dependency note directs test files to define
// a narrow local double rather than import it. This mirrors the exact
// contract in PLAN.md § Contracts verbatim.
interface TestBoardItem {
  id: string;
  title: string;
  blurb: string;
  prompt: string;
  date: string;
}

describe('promptForItem', () => {
  it("returns the item's authored prompt verbatim", () => {
    const item: TestBoardItem = {
      id: 'theory:debut-tv',
      title: 'The debut vault theory',
      blurb: 'Still unconfirmed.',
      prompt: 'Make the case for the debut re-record being finished.',
      date: '2026-08-01',
    };
    expect(promptForItem(item)).toBe(item.prompt);
  });

  it('trims surrounding whitespace off the authored prompt', () => {
    const item: TestBoardItem = {
      id: 'egg:sourdough-sam',
      title: 'Sourdough Sam egg',
      blurb: 'Confirmed.',
      prompt: '  tell me about the Sourdough Sam clue  ',
      date: '2026-02-08',
    };
    expect(promptForItem(item)).toBe('tell me about the Sourdough Sam clue');
  });

  it('falls back to the title if the authored prompt is empty (defensive only — real board data always has one)', () => {
    const item: TestBoardItem = {
      id: 'egg:empty-prompt',
      title: 'Fallback title',
      blurb: 'x',
      prompt: '   ',
      date: '2026-01-01',
    };
    expect(promptForItem(item)).toBe('Fallback title');
  });

  it('never invents or paraphrases text beyond what the item authored', () => {
    const item: TestBoardItem = {
      id: 'theory:another',
      title: 'Some theory title',
      blurb: 'Some blurb text that is not the prompt.',
      prompt: 'Only this exact prompt string.',
      date: '2026-03-01',
    };
    const result = promptForItem(item);
    expect(result).not.toContain(item.blurb);
    expect(result).toBe('Only this exact prompt string.');
  });

  it('is pure: calling it twice on the same item returns the same result', () => {
    const item: TestBoardItem = {
      id: 'egg:purity-check',
      title: 'Purity check',
      blurb: 'blurb',
      prompt: 'deterministic prompt',
      date: '2026-04-01',
    };
    expect(promptForItem(item)).toBe(promptForItem(item));
  });
});

describe('CLOWN_STARTERS (#1987)', () => {
  it('keeps a compact four-prompt empty state instead of the retired nine-chip wall', () => {
    expect(CLOWN_STARTERS).toHaveLength(4);
  });

  it('gives newcomers at least three prompts that require no prior lore', () => {
    expect(CLOWN_STARTERS.filter((starter) => starter.newcomerFriendly)).toHaveLength(4);
    expect(CLOWN_STARTERS.slice(0, 3).map((starter) => starter.prompt)).toEqual([
      'What is clowning?',
      'What is a Taylor Swift Easter egg?',
      'How do you check a fan theory?',
    ]);
  });
});

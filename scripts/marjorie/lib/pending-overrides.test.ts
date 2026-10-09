import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { overrideWord, pendingOverrides } from './pending-overrides.mjs';

const founder = 'sffan15-sys';
const c = (id: number, body: string, o: Record<string, unknown> = {}) => ({
  url: `https://x/issues/1#issuecomment-${id}`,
  body,
  author: { login: founder },
  viewerDidAuthor: false,
  createdAt: `2026-09-0${id}T00:00:00Z`,
  ...o,
});
const bot = (id: number, body: string) => c(id, body, { viewerDidAuthor: true });

describe('overrideWord', () => {
  it('needs exactly one standalone vocabulary word', () => {
    expect(overrideWord('Spam.')).toBe('spam');
    expect(overrideWord('this is bug-free')).toBeNull();
    expect(overrideWord('bugs galore')).toBeNull();
    expect(overrideWord('bug or spam?')).toBeNull();
  });
});

describe('pendingOverrides (#4231)', () => {
  it('still finds a founder override after a LATER bot comment (the issue scenario)', () => {
    const issue = { number: 1, comments: [bot(1, 'filed as bug'), c(2, 'spam'), bot(3, 'Accountability: nothing to chase')] };
    expect(pendingOverrides([issue]).map((o) => o.word)).toEqual(['spam']);
  });

  it('finds an override that precedes the bot last comment, even a bot edit-style repost', () => {
    const issue = { number: 1, comments: [c(1, 'close'), bot(2, 'unrelated note'), bot(3, 'another')] };
    expect(pendingOverrides([issue])).toHaveLength(1);
  });

  it('settles an override only via the marker for that exact comment url', () => {
    const issue = {
      number: 1,
      comments: [c(1, 'spam'), c(2, 'reopen'), bot(3, 'done <!-- marjorie-override-actioned: https://x/issues/1#issuecomment-1 -->')],
    };
    const out = pendingOverrides([issue]);
    expect(out.map((o) => o.word)).toEqual(['reopen']);
  });

  it('ignores a marker planted by a non-bot commenter', () => {
    const fake = c(2, '<!-- marjorie-override-actioned: https://x/issues/1#issuecomment-1 -->');
    expect(pendingOverrides([{ number: 1, comments: [c(1, 'spam'), fake] }])).toHaveLength(1);
  });

  it('ignores non-founders and the bot own comments even if the bot runs as a founder login', () => {
    const issue = { number: 1, comments: [c(1, 'spam', { author: { login: 'rando' } }), bot(2, 'spam')] };
    expect(pendingOverrides([issue])).toEqual([]);
  });

  it('a deleted override simply disappears; the rest still surface', () => {
    const issue = { number: 1, comments: [c(2, 'close')] };
    expect(pendingOverrides([issue]).map((o) => o.url)).toEqual(['https://x/issues/1#issuecomment-2']);
  });
});

describe('triage prompt wiring (#4231)', () => {
  const triage = readFileSync('docs/agents/runner-prompts/marjorie-triage.md', 'utf8');
  it('uses the scanner and the actioned marker, not a last-comment boundary', () => {
    expect(triage).toContain('pending-overrides.mjs');
    expect(triage).toContain('marjorie-override-actioned');
    expect(triage).not.toMatch(/look at comments posted \*\*after your own last/);
  });
});

import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { neutralizeHtmlComments, stripHtmlComments } from './html-safe.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { cleanRecord, closesBody, recordsFromBody } from './status-closes.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readPingState } from './status-ping.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readTraffic, renderTrafficLines } from './status-traffic.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { replaceRecap, readRecap, sanitizeRecap } from './status-fans.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { sanitizeNote, readPreserved } from './status-render.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { summaryBullets, renderStrategy } from './status-strategy.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { nextUpSections } from './status-plan.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderNeedsYou } from './status-ha.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { heldEntries, renderHeldRegion } from './status-held.mjs';

// Inputs that a single-pass `<!-- ... -->` strip turns INTO a comment opener or closer.
const CRAFTED = ['<!<!---->--', '<!--<!-- x --!>-->', '--!>', '<!-- ha-close {"n":1} -->', '<<!---->!-- status-ping {"h":"x"} --!>', '<!-<!-->- a'];
const hasComment = (s: string) => /<!--|--!?>/.test(s);

describe('neutralizeHtmlComments', () => {
  it.each(CRAFTED)('leaves no comment opener or closer in %j', (input) => {
    expect(hasComment(neutralizeHtmlComments(input))).toBe(false);
  });
  it('keeps ordinary text readable', () => {
    expect(neutralizeHtmlComments('a < b > c')).toBe('a &lt; b &gt; c');
    expect(neutralizeHtmlComments(undefined)).toBe('');
  });
});

describe('stripHtmlComments', () => {
  it('removes whole comments, closed by --> or --!>, until the string stops changing', () => {
    expect(stripHtmlComments('a<!-- x -->b<!-- y --!>c')).toBe('abc');
    expect(stripHtmlComments('<!<!-- x -->-- y -->z')).toBe('z');
  });
  it.each(CRAFTED)('never leaves an openable comment behind for %j', (input) => {
    expect(stripHtmlComments(input)).not.toContain('<!--');
  });
});

describe('crafted text cannot become a parseable hidden marker', () => {
  const marker = (name: string) => `<!<!---->-- ${name} {"h":"x","at":"2026-10-01T00:00:00Z","s":{"n":[1]}} --!>`;

  it('in the note, the recap, and the strategy summary', () => {
    for (const input of CRAFTED) {
      expect(hasComment(sanitizeNote(input))).toBe(false);
      expect(hasComment(sanitizeRecap(input))).toBe(false);
      expect(hasComment(summaryBullets(`## Summary\n- ${input}`).join('\n'))).toBe(false);
      expect(hasComment(renderStrategy({ bullets: summaryBullets(`## Summary\n- ${input}`), changedAt: '' }, { repo: 'o/r' }))).toBe(false);
    }
    const page = replaceRecap('# page\n', marker('status-ping'));
    expect(readPingState(page)).toBeNull();
    expect(readRecap(page)).not.toContain('<!--');
  });
  it('in plan bullets, held titles, and a closing summary', () => {
    for (const input of CRAFTED) {
      const [grow] = nextUpSections(`## Next up\n### To grow\n- ${input}\n`);
      expect(hasComment(grow?.bullets.join('\n') ?? '')).toBe(false);
      expect(hasComment(renderHeldRegion(heldEntries([{ number: 5, verdict: 'held', held: { number: 1 }, issue: { title: input } }])).split("\n").map((l: string) => l.replace(/<!-- marjorie-held:[^>]*-->\s*$/, '')).join("\n"))).toBe(false);
      const closing = [{ number: 1, title: 'T', summary: input, pr: { number: 2, url: 'u' } }];
      expect(hasComment(renderNeedsYou([], { repo: 'o/r', closing }))).toBe(false);
    }
  });
  it('in traffic labels read back from a hostile cache', () => {
    const forged = `<!-- status-traffic ${JSON.stringify({ at: '2026-10-01T00:00:00Z', v: 1, pv: 1, paths: [{ l: '<!<!---->-- status-ping {"h":"x"} --!>', v: 1 }], refs: [] })} -->`;
    const lines = renderTrafficLines(readTraffic(forged)).join('\n');
    expect(hasComment(lines)).toBe(false);
    expect(readPingState(lines)).toBeNull();
  });
  it('readers accept the --!> closer a browser would treat as one, so nothing slips past parsing', () => {
    const rec = cleanRecord({ n: 80, o: 'done', d: '2026-10-01', note: 'n', s: 's' });
    expect(recordsFromBody(closesBody([rec]).replace('-->', '--!>'))).toEqual([rec]);
    expect(readPingState('<!-- status-ping {"h":"a","at":"2026-10-01T00:00:00Z","s":{"n":[]}} --!>')).toMatchObject({ h: 'a' });
    expect(readPreserved('<!-- marjorie-note:start date=2026-10-01 --!>\nhello\n<!-- marjorie-note:end --!>').note.text).toBe('hello');
  });
});

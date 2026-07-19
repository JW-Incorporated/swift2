import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildBlocks, chunk, gfmToMrkdwn, stripCcLine } from './post-to-slack.mjs';

describe('stripCcLine', () => {
  it('removes a leading cc mention line', () => {
    const body = 'cc @sffan15-sys @wjduvall-cmd\n# Brief\nreal content';
    expect(stripCcLine(body)).toBe('# Brief\nreal content');
  });
  it('leaves a body without a cc line unchanged', () => {
    const body = '# Brief\ncc is mentioned mid-body but not as a lead line';
    expect(stripCcLine(body)).toBe(body);
  });
  it('is safe on empty/undefined input', () => {
    expect(stripCcLine('')).toBe('');
    expect(stripCcLine(undefined)).toBe('');
  });
});

describe('gfmToMrkdwn', () => {
  it('turns a heading into a bold line', () => {
    expect(gfmToMrkdwn('## Heading')).toBe('*Heading*');
  });
  it('turns **bold** into *bold*', () => {
    expect(gfmToMrkdwn('some **bold** text')).toBe('some *bold* text');
  });
  it('rewrites markdown links to Slack link syntax', () => {
    expect(gfmToMrkdwn('[text](https://x.com)')).toBe('<https://x.com|text>');
  });
  it('renders an unchecked task box with ☐', () => {
    expect(gfmToMrkdwn('- [ ] todo')).toContain('☐');
  });
  it('renders a checked task box with ☑', () => {
    expect(gfmToMrkdwn('- [x] done')).toContain('☑');
  });
  it('turns an ordinary bullet into •', () => {
    expect(gfmToMrkdwn('- item').startsWith('•')).toBe(true);
  });
});

describe('chunk', () => {
  it('returns a single chunk for text well under the limit', () => {
    expect(chunk('short line\nanother line')).toEqual(['short line\nanother line']);
  });
  it('never exceeds the limit even for a single over-long line', () => {
    const limit = 2900;
    const huge = 'x'.repeat(limit * 3 + 17);
    const chunks = chunk(huge, limit);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(limit);
    }
  });
  it('returns the empty-brief placeholder for an empty string', () => {
    expect(chunk('')).toEqual(['_(empty brief)_']);
  });
});

describe('buildBlocks', () => {
  it('opens with a header block carrying the subject', () => {
    const blocks = buildBlocks({ subject: "Founders' Brief — 2026-07-19", body: '# Hi', url: 'https://gh/x' });
    expect(blocks[0].type).toBe('header');
    expect(blocks[0].text.text).toBe("Founders' Brief — 2026-07-19");
  });
  it('has at least one section block and a trailing context block with the url', () => {
    const url = 'https://github.com/JW-Incorporated/swift2/issues/822';
    const blocks = buildBlocks({ subject: 'Brief', body: '# Hi\nsome content', url });
    expect(blocks.some((b) => b.type === 'section')).toBe(true);
    const last = blocks[blocks.length - 1];
    expect(last.type).toBe('context');
    expect(last.elements[0].text).toContain(url);
  });
  it('strips the cc line so it never appears in any section', () => {
    const blocks = buildBlocks({
      subject: 'Brief',
      body: 'cc @sffan15-sys @wjduvall-cmd\n# Real\nbody',
      url: 'https://gh/x',
    });
    const sections = blocks.filter((b) => b.type === 'section');
    for (const s of sections) {
      expect(s.text.text).not.toContain('sffan15-sys');
    }
  });
  it('caps blocks at 50 and adds a truncation notice for a huge brief', () => {
    const line = 'y'.repeat(2900);
    const body = Array.from({ length: 200 }, () => line).join('\n');
    const url = 'https://gh/x';
    const blocks = buildBlocks({ subject: 'Big', body, url });
    expect(blocks.length).toBeLessThanOrEqual(50);
    const hasTruncation = blocks.some(
      (b) => b.type === 'section' && typeof b.text?.text === 'string' && b.text.text.includes('truncated for Slack'),
    );
    expect(hasTruncation).toBe(true);
  });
});

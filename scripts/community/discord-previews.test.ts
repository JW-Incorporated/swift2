import { describe, expect, it } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { suppressPreviews, angleWrapBareUrls, DISCORD_SUPPRESS_EMBEDS } from './discord-delivery.mjs';

describe('suppressPreviews', () => {
  it('sets SUPPRESS_EMBEDS (4) on a payload with no embeds', () => {
    const out = suppressPreviews({ content: 'see https://example.com', allowed_mentions: { parse: [] } });
    expect(out.flags).toBe(4);
    expect(DISCORD_SUPPRESS_EMBEDS).toBe(4);
    expect(out.content).toBe('see https://example.com');
  });

  it('ORs into existing flags instead of overwriting them', () => {
    expect(suppressPreviews({ content: 'x', flags: 64 }).flags).toBe(64 | 4);
    expect(suppressPreviews({ content: 'x', flags: 4 }).flags).toBe(4);
  });

  it('treats an empty embeds array as no embeds', () => {
    expect(suppressPreviews({ content: 'x', embeds: [] }).flags).toBe(4);
  });

  it('with deliberate embeds: no SUPPRESS flag, bare URLs in content angle-wrapped', () => {
    const embeds = [{ image: { url: 'https://cdn.example.com/a.png' } }];
    const out = suppressPreviews({ content: 'full: https://github.com/o/r/blob/x.json', embeds });
    expect(out).not.toHaveProperty('flags');
    expect(out.embeds).toBe(embeds);
    expect(out.content).toBe('full: <https://github.com/o/r/blob/x.json>');
  });

  it('with embeds: clears only the SUPPRESS bit and keeps the others', () => {
    const out = suppressPreviews({ content: 'x', embeds: [{}], flags: 64 | 4 });
    expect(out.flags).toBe(64);
  });

  it('does not mutate its input', () => {
    const input = { content: 'https://a.com', embeds: [{}], flags: 4 };
    suppressPreviews(input);
    expect(input).toEqual({ content: 'https://a.com', embeds: [{}], flags: 4 });
  });
});

describe('angleWrapBareUrls', () => {
  it('wraps bare URLs and leaves trailing punctuation outside', () => {
    expect(angleWrapBareUrls('Go to https://a.com/x. Or (https://b.com)!')).toBe(
      'Go to <https://a.com/x>. Or (<https://b.com>)!',
    );
  });

  it('never double-wraps already-wrapped or markdown-wrapped URLs', () => {
    const text = 'a <https://a.com> b [t](<https://b.com>)';
    expect(angleWrapBareUrls(text)).toBe(text);
    expect(angleWrapBareUrls(angleWrapBareUrls('https://c.com'))).toBe('<https://c.com>');
  });

  it('wraps a plain markdown link target', () => {
    expect(angleWrapBareUrls('[site](https://longlivets.com/x)')).toBe('[site](<https://longlivets.com/x>)');
  });

  it('leaves URLs inside code fences and inline code verbatim', () => {
    const text = 'caption:\n```\nlink in bio https://a.com\n```\n`https://b.com` and https://c.com';
    expect(angleWrapBareUrls(text)).toBe(
      'caption:\n```\nlink in bio https://a.com\n```\n`https://b.com` and <https://c.com>',
    );
  });

  it('keeps a closing paren that belongs to the URL', () => {
    expect(angleWrapBareUrls('https://en.wikipedia.org/wiki/A_(b)')).toBe('<https://en.wikipedia.org/wiki/A_(b)>');
  });

  it('leaves text without URLs alone', () => {
    expect(angleWrapBareUrls('ref: PR #12 · abc123 · social/queue/a.json')).toBe(
      'ref: PR #12 · abc123 · social/queue/a.json',
    );
  });
});

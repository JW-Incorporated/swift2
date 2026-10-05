import { describe, expect, it } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { chunkPreservingRefLine } from './ref-line-chunk.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../../community/discord-delivery.mjs';

// Mirrors social-approval-poll.mjs's own REF_LINE_RE — the regex this
// helper exists to keep matching post-chunking.
const REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;

describe('chunkPreservingRefLine', () => {
  it('returns the content whole when it fits under the limit', () => {
    const content = `line one\nline two\nref: PR #1 · ${'a'.repeat(40)} · social/queue/x.json`;
    expect(chunkPreservingRefLine(content, 2000)).toEqual([content]);
  });

  it('keeps the ref: line intact on the final chunk when a long body pushes the message over the limit (Codex review, round 1)', () => {
    const refLine = `ref: PR #4130 · ${'b'.repeat(40)} · social/queue/2026-09-12-example-instagram.json`;
    const longBody = 'word '.repeat(500); // well over DISCORD_MESSAGE_LIMIT alone
    const content = `${longBody}\n${refLine}`;

    const chunks = chunkPreservingRefLine(content, DISCORD_MESSAGE_LIMIT);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    const last = chunks[chunks.length - 1];
    expect(last.trim().endsWith(refLine)).toBe(true);
    expect(last).toMatch(REF_LINE_RE);
    // No OTHER chunk may itself look like a (broken) ref line fragment.
    for (const chunk of chunks.slice(0, -1)) expect(chunk).not.toContain('ref: PR #');
  });

  it('reproduces the exact boundary Codex found: content just over the limit once a short identity line is prepended', () => {
    // Built so the message is a few chars under 2000 WITHOUT the identity
    // line, then a short prefix line (like "Tree · slot: ... · pillar:
    // ...") tips it over — this is the scenario the round-1 review
    // reproduced with a real Instagram caption.
    const refLine = `ref: PR #99 · ${'c'.repeat(40)} · social/queue/tip.json`;
    const filler = 'x'.repeat(1900 - refLine.length - 1);
    const withoutIdentity = `${filler}\n${refLine}`;
    expect(withoutIdentity.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);

    const identityLine = 'Tree · slot: 2026-09-12 15:00 UTC · pillar: unspecified';
    const withIdentity = `${identityLine}\n${withoutIdentity}`;
    expect(withIdentity.length).toBeGreaterThan(DISCORD_MESSAGE_LIMIT - 150); // close to/over the limit

    const chunks = chunkPreservingRefLine(withIdentity, DISCORD_MESSAGE_LIMIT);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    expect(chunks[chunks.length - 1].trim().endsWith(refLine)).toBe(true);
  });

  it('falls back to plain chunkForDiscord behavior when the content has no trailing ref: line', () => {
    const content = 'word '.repeat(500);
    const chunks = chunkPreservingRefLine(content, DISCORD_MESSAGE_LIMIT);
    expect(chunks.join('')).not.toBe('');
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
  });
});

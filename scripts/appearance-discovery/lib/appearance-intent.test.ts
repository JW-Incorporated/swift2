import { describe, expect, it } from 'vitest';
import { buildAppearanceIntent } from './appearance-intent.mjs';
import { validateIntent } from '../../social/lib/inbox.mjs';

const NOW = new Date('2026-08-25T13:40:00Z');

const candidate = (overrides = {}) => ({
  videoId: 'dQw4w9WgXcQ',
  title: 'Taylor Swift Performs "Fortnight" Live at the VMAs',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  channelName: 'Republic Records',
  channelWhy: "Taylor's label",
  published: '2026-08-25T12:00:00Z',
  rule: 'taylor-swift',
  ...overrides,
});

// This is the actual T6 acceptance property (spec AC#3): appearance-discovery
// FILE mode writes an intent and its intake issue, and zero files under
// social/queue/. discover.mjs's FILE-mode block (Tree Overhaul T6,
// 2026-09-12) calls exactly this pure function to build what it writes to
// social/inbox/ — it no longer imports or calls anything queue-shaped.
describe('buildAppearanceIntent (appearance-discovery FILE mode, Tree Overhaul T6 — no captions, no social/queue/ writes)', () => {
  it('builds a valid, schema-consistent v:1 intent with no body/caption text of any kind', () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW, issueNumber: 4321 });
    expect(validateIntent(intent)).toEqual([]);
    expect(intent.v).toBe(1);
    expect(intent.lane).toBe('appearance');
    expect(intent.source).toBe('appearance-discovery');
    expect(intent.status).toBe('open');
    expect(intent).not.toHaveProperty('body');
    expect(JSON.stringify(intent)).not.toContain('social/queue');
  });

  it('restates only the RSS metadata the feed itself already asserts — no claim about the video content', () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW, issueNumber: 4321 });
    expect(intent.facts).toEqual({
      channelName: 'Republic Records',
      videoTitle: 'Taylor Swift Performs "Fortnight" Live at the VMAs',
      publishedAt: '2026-08-25T12:00:00Z',
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it("links.issue points at the intake issue already filed for the same candidate", () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW, issueNumber: 4321 });
    expect(intent.links).toEqual({ pr: null, issue: 4321 });
  });

  it('defaults links.issue to null for a dry-run preview (no issue actually filed)', () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW });
    expect(intent.links).toEqual({ pr: null, issue: null });
  });

  it('sets a 48h deadline from createdAt (T6 spec: an appearance is stale almost immediately)', () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW, issueNumber: 1 });
    expect(intent.createdAt).toBe(NOW.toISOString());
    expect(intent.deadline).toBe(new Date(NOW.getTime() + 48 * 60 * 60 * 1000).toISOString());
  });

  it('ids the intent deterministically from the date and the videoId', () => {
    const intent = buildAppearanceIntent(candidate(), { now: NOW, issueNumber: 1 });
    expect(intent.id).toBe('appearance-2026-08-25-dQw4w9WgXcQ');
  });
});

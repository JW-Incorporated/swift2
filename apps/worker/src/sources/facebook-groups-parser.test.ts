import { describe, expect, it } from 'vitest';
import { extractPostsFromHtml, parseFacebookExport } from './facebook-groups-parser';

// SYNTHETIC fixture, illustrative only — no real Facebook export was
// available to verify against (see the module's header comment). Targets
// this parser's own `role="article"` / `aria-label` assumptions.
const SYNTHETIC_EXPORT_HTML = `<html><body>
  <div role="article">
    <a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>
    <div dir="auto">the clowning today is unreal, easter eggs everywhere in the new merch drop</div>
    <span>42 reactions</span>
    <span>7 comments</span>
  </div>
  <div role="article">
    <a href="/profile/2" aria-label="Another Fan">Another Fan</a>
    <div dir="auto">does anyone else think the color palette this era is a clue</div>
    <span>10 likes</span>
    <span>3 comments</span>
  </div>
</body></html>`;

describe('extractPostsFromHtml', () => {
  it('extracts one post per role="article" block with counts and a hashed author', () => {
    const posts = extractPostsFromHtml(SYNTHETIC_EXPORT_HTML);
    expect(posts).toHaveLength(2);
    expect(posts[0]!.text).toContain('clowning today is unreal');
    expect(posts[0]!.reactionCount).toBe(42);
    expect(posts[0]!.commentCount).toBe(7);
    expect(posts[0]!.authorHash).not.toBe('Jane Fan');
    expect(posts[0]!.authorHash).toMatch(/^[0-9a-f]{16}$/);
    expect(posts[1]!.reactionCount).toBe(10); // "likes" phrasing also matches
  });

  it('never throws on malformed/empty input', () => {
    expect(extractPostsFromHtml('')).toEqual([]);
    expect(extractPostsFromHtml('<html><body>no articles here</body></html>')).toEqual([]);
    expect(() => extractPostsFromHtml('<div role="article">unclosed')).not.toThrow();
  });
});

describe('parseFacebookExport', () => {
  it('produces a fan_signal-shaped draft: platform, community, 7-day window, no sample_urls', () => {
    const draft = parseFacebookExport(SYNTHETIC_EXPORT_HTML, {
      groupSlug: 'taylor-swift-fans',
      exportedAt: new Date('2026-08-23T16:00:00Z'),
    });
    expect(draft.platform).toBe('facebook');
    expect(draft.community).toBe('facebook:taylor-swift-fans');
    expect(draft.sample_urls).toEqual([]);
    expect(draft.volume).toBe(2);
    expect(draft.window_end).toBe('2026-08-23T16:00:00.000Z');
    expect(draft.window_start).toBe('2026-08-16T16:00:00.000Z'); // exactly 7 days
    expect(draft.redline_ok).toBe(true);
    expect(draft).not.toHaveProperty('source_tier'); // real schema has no such column — see header
  });

  it('drops a redline-flagged post from volume/heat/summary entirely', () => {
    const withFlagged = SYNTHETIC_EXPORT_HTML.replace(
      'the clowning today is unreal, easter eggs everywhere in the new merch drop',
      'is she pregnant? someone said they saw a bump',
    );
    const draft = parseFacebookExport(withFlagged, { groupSlug: 'taylor-swift-fans' });
    expect(draft.volume).toBe(1); // only the clean second post survives
    expect(draft.summary).not.toMatch(/pregnant/i);
  });

  it('handles zero postable content without crashing (all screened out or none found)', () => {
    const draft = parseFacebookExport('<html><body>nothing here</body></html>', {
      groupSlug: 'empty-group',
    });
    expect(draft.volume).toBe(0);
    expect(draft.heat).toBe(0);
    expect(draft.summary).toMatch(/no postable content/);
  });
});
